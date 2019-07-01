'use strict';

const xlsx = require('xlsx');
const path = require('path');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const { getCoordinates } = require('./app/services/location/location-service');
const knex = require('knex')(require('./db/knexfile').getKnexInstance());
const {
  USER_TABLE,
  USER_PROFILE_TABLE,
  USER_PHONE_TABLE,
  USER_EMAIL_TABLE,
  USER_PRODUCT_TABLE,
  USER_ADDRESS_TABLE,
  PRODUCT_TABLE
} = require('./constants/table.constants');

const {
  CHIIPS,
  POPLAR,
  GRINDINGS,
  PINE,
  FILLDIRT,
  ROUNDS,
  LOGS
} = require('./constants/products.constants');

const { UserTypes, PhoneTypes, UserStatus } = require('@betaquick/grace-tree-constants');

const MOMENTTS = moment().toISOString(true);
let HASHEDPASSWORD;

async function getTransaction() {
  return new Promise(function(resolve, reject) {
    knex.transaction(function(trx) {
      resolve(trx);
    });
  });
};


/**
  * @param file
  * Path to the xlsx file
  */
const file = path.join(__dirname, './Sign_Up_Form.xls');

const getJSONFormatOfSheets = (doc, worksheet_name, columns) => {
  /**
  * @param workbook
  * Reading xlsx file using the xlsx package
  */
  const workbook = xlsx.readFile(doc);

  /**
  * @param workbook which is the workbook
  * @param worksheet_name the name of the sheet
  */
  const worksheet = workbook.Sheets[worksheet_name];
  return xlsx.utils.sheet_to_json(worksheet);
};

const result = getJSONFormatOfSheets(file, 'Sheet1');


const addUserToUserTable = (data, trx) => {
  return knex(USER_TABLE)
    .transacting(trx)
    .insert({
      email: data['Primary Email'],
      password: data.password, userType: UserTypes.General,
      createdAt: MOMENTTS
    });
};

const addUserToUserProfileTable = (userId, data, trx) => {
  return knex(USER_PROFILE_TABLE)
    .transacting(trx)
    .insert({
      firstName: data.Name,
      lastName: data.Last,
      status: UserStatus.Pause,
      agreement: 1,
      userId,
      createdAt: MOMENTTS
    });
};

const addUserToUserEmailTable = (userId, emailAddress, trx, primary = 0) => {
  return knex(USER_EMAIL_TABLE)
    .transacting(trx)
    .insert({
      emailAddress,
      userId,
      primary,
      isVerified: 1,
      createdAt: MOMENTTS
    });
};

const addUserToUserAddressTable = async(userId, data, trx) => {
  let coords;
  try {
    if (data.Address) {
      coords = await getCoordinates(data.Address);
    }
  } catch (error) {
  } finally {
    return knex(USER_ADDRESS_TABLE)
      .transacting(trx)
      .insert({
        street: data.Address,
        city: data.City,
        state: data.State,
        zip: data['Zip Code'],
        deliveryInstruction: data['Where would you like us to dump?'],
        userId,
        ...(coords && { latitude: coords.lat, longitude: coords.lng })
      });
  }
};

const addUserToUserPhoneTable = (userId, phoneNumber, phoneType = '', trx) => {
  return knex(USER_PHONE_TABLE)
    .transacting(trx)
    .insert({
      phoneNumber,
      userId,
      isVerified: 1,
      phoneType,
      primary: !!phoneNumber
    });
};

const addUserToUserProductTable = (userId, data, trx, status = 0) => {
  return knex(USER_PRODUCT_TABLE)
    .transacting(trx)
    .insert({
      productId: data,
      status,
      userId
    });
};

const getProductId = (data, trx) => {
  return knex(PRODUCT_TABLE)
    .transacting(trx)
    .first()
    .where({
      productCode: data
    });
};

const addPhone = async(userId, data, transaction) => {

  if (data['Cell Phone Number'] !== '') {
    await addUserToUserPhoneTable(userId, data['Cell Phone Number'], PhoneTypes.MOBILE, transaction);
  }
  if (data['Home Phone Number'] !== '') {
    await addUserToUserPhoneTable(userId, data['Home Phone Number'], PhoneTypes.HOME, transaction);
  }
  if (data['Work Phone Number'] !== '') {
    await addUserToUserPhoneTable(userId, data['Work Phone Number'], PhoneTypes.WORK, transaction);
  }
};

const passesSanityCheck = data => data['Primary Email'] || data['Secondary Email'];

const addEmail = async(userId, data, transaction) => {
  if (data['Primary Email'] !== '') {
    await addUserToUserEmailTable(userId, data['Primary Email'], transaction, 1);
  }
  if (data['Secondary Email'] !== '') {
    await addUserToUserEmailTable(userId, data['Secondary Email'], transaction);
  }
};

const addProduct = async(userId, data, transaction) => {
  if (data.Chips === 'Yes') {
    const result = await getProductId(CHIIPS, transaction);
    await addUserToUserProductTable(userId, result.productId, transaction);
  }

  if (data.Grindings === 'Yes') {
    const result = await getProductId(GRINDINGS, transaction);
    await addUserToUserProductTable(userId, result.productId, transaction);
  }

  if (data['Logs (6-12 feet long)'] === 'Yes') {
    const result = await getProductId(LOGS, transaction);
    await addUserToUserProductTable(userId, result.productId, transaction);
  }

  if (data['Rounds (18-22 inches long)'] === 'Yes') {
    const result = await getProductId(ROUNDS, transaction);
    await addUserToUserProductTable(userId, result.productId, transaction);
  }

  if (data.Poplar === 'Yes') {
    const result = await getProductId(POPLAR, transaction);
    await addUserToUserProductTable(userId, result.productId, transaction);
  }

  if (data.Pine === 'Yes') {
    const result = await getProductId(PINE, transaction);
    await addUserToUserProductTable(userId, result.productId, transaction);
  }

  if (data['Fill Dirt'] === 'Yes') {
    const result = await getProductId(FILLDIRT, transaction);
    await addUserToUserProductTable(userId, result.productId, transaction);
  }
};

const db_upload = async(data) => {
  if (passesSanityCheck(data)) {
    let transaction = await getTransaction();
    try {
      const User = await addUserToUserTable({...data, password: HASHEDPASSWORD }, transaction);

      await addEmail(User[0], data, transaction);
      await addUserToUserProfileTable(User[0], data, transaction);
      await addUserToUserAddressTable(User[0], data, transaction);
      await addPhone(User[0], data, transaction);
      await addProduct(User[0], data, transaction);

      transaction.commit();

    } catch (err) {
      if (transaction) transaction.rollback();
      throw err;
    }
  }
};


(async() => {
  HASHEDPASSWORD = await bcrypt.hash('changeme', 10);
  result.forEach((data, ind) => {
    db_upload(data);
  });
})();


