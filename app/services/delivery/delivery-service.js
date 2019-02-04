'use strict';

const knex = require('knex')(require('../../../db/knexfile').getKnexInstance());
const Joi = require('joi');

const deliveryData = require('./delivery-data');
const userData = require('../user/user-data');
const userSvc = require('../user/user-service');

const {
  deliveryInfoValidator,
  updateDeliveryInfoValidator
} = require('./delivery-validation');

const {
  USER_ADDRESS_TABLE
} = require('../../../constants/table.constants');

const getDeliveryInfo = async(userId, recipientId) => {
  await Joi.validate(recipientId, Joi.number().required());

  const recipient = await userData.getUserByParam(USER_ADDRESS_TABLE, { [`${USER_ADDRESS_TABLE}.userId`]: recipientId });
  recipient.products = await userData.getUserProducts({ userId: recipientId, status: true });

  const company = await userSvc.getCompanyInfo(userId);
  company.userId = userId;

  const crews = await userSvc.getCompanyCrews(userId);

  return { recipient, company, crews };
};

const getCompanyDeliveries = async userId => {
  try {
    return await deliveryData.getDeliveries(userId);
  } catch (err) {
    throw err;
  }
};

const getDelivery = async(deliveryId) => {
  try {
    return await deliveryData.getSingleDelivery(deliveryId);
  } catch (err) {
    throw err;
  }
};

const addDelivery = async(assignedByUserId, data) => {
  let transaction;
  try {
    const deliveryItem = {
      assignedByUserId,
      ...data
    };
    await Joi.validate(deliveryItem, deliveryInfoValidator);

    transaction = await getTransaction();
    await deliveryData.addDelivery(deliveryItem, transaction);
    transaction.commit();

    return deliveryItem;
  } catch (err) {
    if (transaction) transaction.rollback();
    throw err;
  }
};

const updateDelivery = async(userId, deliveryInfo) => {
  let transaction;
  try {
    const {
      companyId
    } = await userSvc.getCompanyInfo(userId);
    deliveryInfo.assignedToUserId = companyId;

    await Joi.validate(deliveryInfo, updateDeliveryInfoValidator);

    transaction = await getTransaction();

    deliveryData.updateDelivery(deliveryInfo, transaction);
    transaction.commit();
  } catch (err) {
    if (transaction) transaction.rollback();
    throw err;
  }
};

const addUserToDelivery = async(deliveryId, userId) => {
  let transaction;
  try {
    transaction = await getTransaction();
    deliveryData.addUserToDelivery(deliveryId, userId, transaction);
    transaction.commit();
  } catch (err) {
    if (transaction) transaction.rollback();
    throw err;
  }
};


const removeUserFromDelivery = async(deliveryId, userId) => {
  let transaction;
  try {
    transaction = await getTransaction();
    deliveryData.removeUserFromDelivery(deliveryId, userId, transaction);
    transaction.commit();
  } catch (err) {
    if (transaction) transaction.rollback();
    throw err;
  }
};

const deleteDelivery = async(deliveryId) => {
  let transaction;
  try {
    transaction = await getTransaction();
    await deliveryData.deleteDelivery(deliveryId, transaction);
    transaction.commit();
  } catch (err) {
    if (transaction) transaction.rollback();
    throw err;
  }
};

async function getTransaction() {
  return new Promise(function(resolve, reject) {
    knex.transaction(function(trx) {
      resolve(trx);
    });
  });
};

module.exports = {
  getDeliveryInfo,
  addDelivery,
  getCompanyDeliveries,
  getDelivery,
  updateDelivery,
  addUserToDelivery,
  removeUserFromDelivery,
  deleteDelivery
};
