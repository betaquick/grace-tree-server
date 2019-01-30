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
    const { companyId } = await userSvc.getCompanyInfo(userId);
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
  try {
    const company = await userSvc.getCompanyInfo(userId);

    data.companyId = company.companyId;
    const deliveryItem = { userId, ...data };

    await Joi.validate(deliveryItem, deliveryInfoValidator);

    await knex.transaction(trx => {
      deliveryData.addDelivery(deliveryItem, trx)
        .then(trx.commit);
    });
    return { ...data };
  } catch (err) {
    throw err;
  }
};

const updateDelivery = async(userId, deliveryInfo) => {
  try {
    const { companyId } = await userSvc.getCompanyInfo(userId);
    deliveryInfo.companyId = companyId;

    await Joi.validate(deliveryInfo, updateDeliveryInfoValidator);

    return knex.transaction(trx => {
      deliveryData.updateDelivery(deliveryInfo, trx)
        .then(trx.commit);
    });
  } catch (err) {
    throw err;
  }
};

const addUserToDelivery = async(deliveryId, userId) => {
  try {
    return knex.transaction(trx => {
      deliveryData.addUserToDelivery(deliveryId, userId, trx)
        .then(trx.commit);
    });
  } catch (err) {
    throw err;
  }
};


const removeUserFromDelivery = async(deliveryId, userId) => {
  try {
    return knex.transaction(trx => {
      deliveryData.removeUserFromDelivery(deliveryId, userId, trx)
        .then(trx.commit);
    });
  } catch (err) {
    throw err;
  }
};

const deleteDelivery = async(deliveryId) => {
  try {
    return knex.transaction(trx => {
      deliveryData.deleteDelivery(deliveryId, trx)
        .then(trx.commit);
    });
  } catch (err) {
    throw err;
  }
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
