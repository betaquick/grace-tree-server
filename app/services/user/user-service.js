'use strict';

const error = require('debug')('grace-tree:user-service:error');
const debug = require('debug')('grace-tree:user-service:debug');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const _ = require('lodash');
const { UserStatus } = require('@betaquick/grace-tree-constants');

const emailService = require('../messaging/email-service');
const smsService = require('../messaging/sms-service');
const locationService = require('../location/location-service');
const userData = require('./user-data');

const {
  statusValidator,
  businessInfoValidator,
  updateBusinessValidator,
  deliveryInfoValidator,
  userValidator,
  updateUserProductsValidator,
  crewValidator,
  updateAddressValidator
} = require('./user-validation');
const {
  USER_TABLE,
  USER_PROFILE_TABLE,
  USER_COMPANY_TABLE
} = require('../../../constants/table.constants');
const { throwError } = require('./../../controllers/util/controller-util');


// Santize user details for the UI
function sanitizeUser(user) {
  return {
    email: user.email,
    emails: user.emails,
    firstName: user.firstName,
    lastName: user.lastName,
    phones: user.phones,
    userId: user.userId,
    userType: user.userType,
    addresses: user.addresses,
    profile: user.profile,
    status: user.status
  };
}

const getUserObject = async userId => {
  
  try {
    const user = await userData.getUserByParam(USER_TABLE, { userId });
  
    user.emails = await userData.getUserEmails(user.userId);
    user.phones = await userData.getUserPhones(user.userId);
    user.addresses = await userData.getAddresses(user.userId);
    user.profile = await userData.getUserProfile(user.userId);
  
    return sanitizeUser(user);
  
  } catch (err) {
    error('Unable to fetch user by userId: ', userId);
    throw err;
  }
  
};

const acceptAgreement = async userId => {
  debug('Accept agreement for ' + userId);

  try {
    await Joi.validate(userId, Joi.number().required());
    const params = {agreement: true};
    
    return await userData.updateUserByParams(USER_PROFILE_TABLE, {userId}, params);
    
  } catch (err) {
    error('Error accepting agreement', err);
    throw err;
  }
};

const updateStatus = async(userId, status) => {
  debug('Update status for ' + userId);

  try {
    await Joi.validate({ userId, status }, statusValidator);

    const where = {
      [`${USER_TABLE}.userId`]: userId
    };
    const user = await userData.getUserByParam(USER_TABLE, where);

    await userData.updateUserByParams(USER_PROFILE_TABLE, { userId }, { status });
    user.status = status;

    if (status === UserStatus.Ready) {
      const { phoneNumber } = await userData.getUserPhone(userId);
      const options = {
        email: user.email,
        firstName: user.firstName
      };

      emailService.sendStatusNotificationMail(options);
      smsService.sendStatusNotificationSMS({ phoneNumber });
    }

    return user;
  } catch (err) {
    error('Error updating user status', err);
    throw err;
  }
};

const editUser = async(userId, data) => {
  const { emails, password } = data;
  try {
    await Joi.validate({
      userId,
      ...data
    }, userValidator);

    const emailAddress = _.get(emails[0], 'emailAddress');

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }
    data.email = emailAddress;

    await userData.editUser(userId, data);

    const user = await userData.getUserByParam(USER_TABLE, {
      email: emailAddress
    });
    user.emails = await userData.getUserEmails(userId);
    user.phones = await userData.getUserPhones(userId);
    const address = await userData.getAddressInfo(userId);

    return {
      userId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      emails: user.emails,
      phones: user.phones,
      userType: user.userType,
      addresses: address ? [address] : [],
      agreement: user.agreement,
      status: user.status
    };
  } catch (err) {
    error('Error editing user ' + err.message);
    throw err;
  }
};

const addCompanyInfo = async(userId, data) => {
  try {
    await Joi.validate({ userId, ...data }, businessInfoValidator);

    const { companyAddress, city, state, longitude, latitude } = data;
    if (!longitude || !latitude) {
      const address = `${companyAddress}, ${city}, ${state}`;
      const coordinates = await locationService.getCoordinates(address);

      debug(`Google map coordinates for ${address} is: `, coordinates);
      data.longitude = coordinates.lng;
      data.latitude = coordinates.lat;
    }

    const companyIds = await userData.addCompanyInfo(userId, data);

    return {
      companyId: companyIds[0],
      ...data
    };
  } catch (err) {
    error('Error updating business ' + err.message);
    throw err;
  }
};

const updateCompanyInfo = async(userId, company) => {
  try {
    await Joi.validate({ userId, ...company }, updateBusinessValidator);

    const { companyAddress, city, state, longitude, latitude } = company;

    if (!longitude || !latitude) {
      const address = `${companyAddress}, ${city}, ${state}`;
      const coordinates = await locationService.getCoordinates(address);

      debug(`Google map coordinates for ${address} is: `, coordinates);
      company.longitude = coordinates.lng;
      company.latitude = coordinates.lat;
    }

    await userData.updateCompanyInfo(company);

    return company;
  } catch (err) {
    error('Error updating business ' + err.message);
    throw err;
  }
};

const addDeliveryInfo = async(userId, data) => {
  try {
    await Joi.validate({
      userId,
      ...data
    }, deliveryInfoValidator);

    const {
      street,
      city,
      state,
      longitude,
      latitude
    } = data.address;

    if (!longitude || !latitude) {
      const address = `${street}, ${city}, ${state}`;

      const coordinates = await locationService.getCoordinates(address);

      debug(`Google map coordinates for ${address} is: `, coordinates);
      data.address.longitude = coordinates.lng;
      data.address.latitude = coordinates.lat;
    }

    const deliveryIds = await userData.addDeliveryInfo(userId, data);

    return {
      deliveryId: deliveryIds[0],
      ...data
    };
  } catch (err) {
    error('Error updating delivery info ', err);
    throw err;
  }
};

const getCompanyInfo = async userId => {
  await Joi.validate(userId, Joi.number().required());
  const user = await userData.getUserByParam(USER_COMPANY_TABLE, {
    [`${USER_COMPANY_TABLE}.userId`]: userId
  });
  const businessInfo = await userData.getCompanyInfo(user.companyId);

  return businessInfo;
};

const getCompanyCrews = async userId => {
  await Joi.validate(userId, Joi.number().required());

  const user = await userData.getUserByParam(USER_COMPANY_TABLE, {
    [`${USER_COMPANY_TABLE}.userId`]: userId
  });
  const crews = await userData.getCompanyCrews(user.companyId);

  return crews;
};

const deleteCompanyCrew = async crewId => {
  debug('Delete crew for ' + crewId);

  try {
    await Joi.validate(crewId, Joi.number().required());

    await userData.updateUserByParams(USER_TABLE, {
      userId: crewId
    }, {
      active: false
    });
    return crewId;
  } catch (err) {
    error('Error deleting crew', err);
    throw err;
  }
};

const addCompanyCrew = async(userId, data) => {
  const {
    password,
    email
  } = data;

  try {
    await Joi.validate({
      userId,
      ...data
    }, crewValidator);

    const user = await userData.getUserByParam(USER_TABLE, {
      email
    });
    if (user) {
      debug('Email address has already been taken');
      throwError(422, 'Email address has already been taken');
    }

    data.password = await bcrypt.hash(password, 10);

    const company = await userData.getUserByParam(USER_COMPANY_TABLE, {
      [`${USER_COMPANY_TABLE}.userId`]: userId
    });
    data.companyId = company.companyId;

    const userIds = await userData.addCompanyCrew(data);
    const companyInfo = await userData.getCompanyInfo(data.companyId);

    const options = {
      email,
      companyName: companyInfo.companyName,
      firstName: data.firstName,
      password
    };
    emailService.sendUserCreationMail(options);

    return userIds[0];
  } catch (err) {
    error('Error creating company crew', err);
    throw err;
  }
};

const getUserProducts = async userId => {
  await Joi.validate(userId, Joi.number().required());
  const userProducts = await userData.getUserProducts({ userId });

  return userProducts;
};

const updateUserProducts = async(userId, userProducts) => {
  try {
    await Joi.validate({
      userId,
      userProducts
    }, updateUserProductsValidator);
    await userData.updateUserProducts(userId, userProducts);

    return await userData.getUserProducts({ userId });
  } catch (err) {
    error('Error updating user products ' + err.message);
    throw err;
  }
};

const updateUserAddress = async(userId, data) => {
  try {
    await Joi.validate(data, updateAddressValidator);

    const { street, city, state, longitude, latitude } = data;
    if (!longitude || !latitude) {
      const coords = await getCoordinates(street, city, state);
      debug(`Google map coordinates for ${street}, ${city}, ${state} is:`, coords);

      data.longitude = coords.longitude;
      data.latitude = coords.latitude;
    }

    data.userId = userId;
    await userData.addOrUpdateAddressInfo(data);
    return data;
  } catch (err) {
    error('Error updating user address ' + err.message);
    throw err;
  }
};

const getUserAddress = async(userId) => {
  try {
    return await userData.getAddressInfo(userId);
  } catch (err) {
    error('Error fetching user address ' + err.message);
    throw err;
  }
};

const getCoordinates = async(street, city, state) => {
  const coordinates = await locationService.getCoordinates(`${street}, ${city}, ${state}`);
  return {
    longitude: coordinates.lng,
    latitude: coordinates.lat
  };
};

module.exports = {
  getUserObject,
  acceptAgreement,
  updateStatus,
  editUser,
  addCompanyInfo,
  updateCompanyInfo,
  addDeliveryInfo,
  getCompanyInfo,
  addCompanyCrew,
  getCompanyCrews,
  deleteCompanyCrew,
  getUserProducts,
  updateUserProducts,
  getUserAddress,
  updateUserAddress,
  getCoordinates
};
