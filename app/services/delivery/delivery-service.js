'use strict';

const knex = require('knex')(require('../../../db/knexfile').getKnexInstance());
const Joi = require('joi');

const deliveryData = require('./delivery-data');

const {
  deliveryInfoValidator,
  updateDeliveryInfoValidator
} = require('./delivery-validation');

const userSvc = require('../../services/user/user-service');


const getCompanyDeliveries = async(userId) => {
  try {
    const {
      companyId
    } = await userSvc.getCompanyInfo(userId);
    return await deliveryData.getDeliveries(companyId);
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

const addDelivery = async(userId, data) => {
  let transaction;
  try {
    const company = await userSvc.getCompanyInfo(userId);

    data.companyId = company.companyId;
    const deliveryItem = {
      userId,
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
    deliveryInfo.companyId = companyId;

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
  addDelivery,
  getCompanyDeliveries,
  getDelivery,
  updateDelivery,
  addUserToDelivery,
  removeUserFromDelivery,
  deleteDelivery
};
