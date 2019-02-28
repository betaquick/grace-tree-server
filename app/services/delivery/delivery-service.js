'use strict';

const knex = require('knex')(require('../../../db/knexfile').getKnexInstance());
const Joi = require('joi');
const error = require('debug')('grace-tree:delivery-service:error');
const debug = require('debug')('grace-tree:delivery-service:debug');
const moment = require('moment');
const { UserTypes, DeliveryStatusCodes } = require('@betaquick/grace-tree-constants');

const emailService = require('../messaging/email-service');
const smsService = require('../messaging/sms-service');
const deliveryData = require('./delivery-data');
const userData = require('../user/user-data');
const userSvc = require('../user/user-service');

const {
  deliveryInfoValidator,
  updateDeliveryValidator,
  updateDeliveryStatusValidator
} = require('./delivery-validation');

const {
  USER_ADDRESS_TABLE,
  USER_COMPANY_TABLE,
  USER_TABLE
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
    error('Error getting company deliveries', err);
    throw err;
  }
};

const getUserDeliveries = async userId => {
  try {
    return await deliveryData.getUserDeliveries(userId);
  } catch (err) {
    error('Error getting user deliveries', err);
    throw err;
  }
};

const getPendingDeliveries = async(userId, userType) => {
  try {
    if (userType === UserTypes.General) {
      return await deliveryData.getUserPendingDeliveries(userId);
    }

    return await deliveryData.getCompanyPendingDeliveries(userId);
  } catch (err) {
    error(`Error getting ${userType} pending deliveries`, err);
    throw err;
  }
};

const getRecentDeliveries = async(userId, userType) => {
  try {
    if (userType === UserTypes.General) {
      return await deliveryData.getUserRecentDeliveries(userId);
    }

    return await deliveryData.getCompanyRecentDeliveries(userId);
  } catch (err) {
    error(`Error getting ${userType} recent deliveries`, err);
    throw err;
  }
};

const getDelivery = async(deliveryId, userType) => {
  try {
    if (userType === UserTypes.General) {
      return await deliveryData.getUserDelivery(deliveryId);
    }

    return await deliveryData.getCompanyDelivery(deliveryId);

  } catch (err) {
    error('Error getting delivery', err);
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
    deliveryItem.deliveryId = await deliveryData.addDelivery(deliveryItem, transaction);
    transaction.commit();

    return deliveryItem;
  } catch (err) {
    if (transaction) transaction.rollback();
    error('Error adding new delivery', err);
    throw err;
  }
};

const updateDelivery = async(deliveryId, data) => {
  let transaction;
  try {
    const deliveryItem = {
      deliveryId,
      ...data
    };
    await Joi.validate(deliveryItem, updateDeliveryValidator);

    transaction = await getTransaction();
    await deliveryData.updateDelivery(deliveryItem, transaction);
    transaction.commit();

    return deliveryItem;
  } catch (err) {
    if (transaction) transaction.rollback();
    error('Error adding new delivery', err);
    throw err;
  }
};

const acceptDeliveryRequest = async(userId, deliveryId) => {
  let transaction;
  try {
    await Joi.validate(userId, Joi.number().required());
    await Joi.validate(deliveryId, Joi.number().required());

    transaction = await getTransaction();
    await deliveryData.acceptDeliveryRequest(userId, deliveryId, transaction);
    transaction.commit();

    return { userId, deliveryId };
  } catch (err) {
    if (transaction) transaction.rollback();
    throw err;
  }
};

const sendDeliveryNotification = async delivery => {
  const {
    assignedToUserId,
    users,
    additionalRecipientText,
    additionalCompanyText
  } = delivery;

  users.forEach(async recipientId => {
    try {
      const assignedUser = await userData.getUserByParam(USER_TABLE, {
        [`${USER_TABLE}.userId`]: assignedToUserId
      });
      const recipient = await userData.getUserByParam(USER_TABLE, {
        [`${USER_TABLE}.userId`]: recipientId
      });
      const companyPhone = await userData.getUserPhone(assignedToUserId);
      const recipientPhone = await userData.getUserPhone(recipientId);
      const { street, city, state, zip } = await userData.getAddressInfo(recipientId);

      let options = {
        email: assignedUser.email,
        firstName: assignedUser.firstName,
        recipientName: `${recipient.firstName} ${recipient.lastName}`,
        phoneNumber: recipientPhone.phoneNumber,
        address: `${street}, ${city}, ${state}, ${zip}`,
        additionalCompanyText
      };
      emailService.sendCompanyDeliveryNotificationMail(options);

      options = {
        toNumber: companyPhone.phoneNumber,
        firstName: assignedUser.firstName,
        recipientName: `${recipient.firstName} ${recipient.lastName}`,
        phoneNumber: recipientPhone.phoneNumber,
        address: `${street}, ${city}, ${state}, ${zip}`
      };
      smsService.sendCompanyDeliveryNotificationSMS(options);

      const { companyId } = await userData.getUserByParam(USER_COMPANY_TABLE, {
        [`${USER_COMPANY_TABLE}.userId`]: assignedToUserId
      });
      const { companyName } = await userData.getCompanyInfo(companyId);

      options = {
        email: recipient.email,
        firstName: recipient.firstName,
        companyName,
        phoneNumber: companyPhone.phoneNumber,
        additionalRecipientText
      };
      emailService.sendUserDeliveryNotificationMail(options);

      options = {
        toNumber: recipientPhone.phoneNumber,
        companyName,
        phoneNumber: companyPhone.phoneNumber
      };
      smsService.sendUserDeliveryNotificationSMS(options);
    } catch (err) {
      error('Error sending delivery notification', err);
      throw err;
    }
  });
};

const sendRequestNotification = async delivery => {
  const {
    deliveryId,
    assignedToUserId,
    users
  } = delivery;

  users.forEach(async recipientId => {
    try {
      const recipient = await userData.getUserByParam(USER_TABLE, {
        [`${USER_TABLE}.userId`]: recipientId
      });
      const recipientPhone = await userData.getUserPhone(recipientId);

      const { companyId } = await userData.getUserByParam(USER_COMPANY_TABLE, {
        [`${USER_COMPANY_TABLE}.userId`]: assignedToUserId
      });
      const { companyName } = await userData.getCompanyInfo(companyId);

      let options = {
        userId: recipientId,
        email: recipient.email,
        firstName: recipient.firstName,
        companyName,
        deliveryId
      };
      emailService.sendDeliveryRequestNotificationMail(options);

      options = {
        phoneNumber: recipientPhone.phoneNumber,
        companyName,
        userId: recipientId,
        deliveryId
      };
      smsService.sendDeliveryRequestNotificationSMS(options);
    } catch (err) {
      error('Error sending delivery notification', err);
      throw err;
    }
  });
};

const sendAcceptedNotification = async(userId, deliveryId) => {
  try {
    const delivery = await deliveryData.getUserDelivery(deliveryId);
    const assignedUser = await userData.getUserByParam(USER_TABLE, {
      [`${USER_TABLE}.userId`]: delivery.assignedToUserId
    });
    const recipient = await userData.getUserByParam(USER_TABLE, {
      [`${USER_TABLE}.userId`]: userId
    });
    const companyPhone = await userData.getUserPhone(delivery.assignedToUserId);

    let options = {
      email: assignedUser.email,
      firstName: assignedUser.firstName,
      recipientName: `${recipient.firstName} ${recipient.lastName}`
    };
    emailService.sendDeliveryAccceptedNotificationMail(options);

    options = {
      phoneNumber: companyPhone.phoneNumber,
      recipientName: `${recipient.firstName} ${recipient.lastName}`
    };
    smsService.sendDeliveryAccceptedNotificationSMS(options);
  } catch (err) {
    error('Error sending delivery notification', err);
    throw err;
  }
};

const updateDeliveryStatus = async(deliveryId, statusCode) => {
  debug('Updating status', deliveryId, statusCode);
  try {
    await Joi.validate({ deliveryId, statusCode }, updateDeliveryStatusValidator);

    await deliveryData.updateDeliveryStatus(deliveryId, statusCode);

    return deliveryId;
  } catch (err) {
    error('Error updating status', err);
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

const expireDeliveryJob = async() => {
  debug('Update deliveries cron job');
  try {
    const deliveries = await deliveryData.getScheduledDeliveries();
    deliveries.forEach(async delivery => {
      const createdAt = moment(delivery.createdAt);
      const dateDiff = moment().diff(createdAt, 'days');

      if (dateDiff === 2) {
        const recipient = await userData.getUserByParam(USER_TABLE, {
          [`${USER_TABLE}.userId`]: delivery.userId
        });
        const companyPhone = await userData.getUserPhone(delivery.assignedToUserId);
        const recipientPhone = await userData.getUserPhone(delivery.userId);

        const { companyId } = await userData.getUserByParam(USER_COMPANY_TABLE, {
          [`${USER_COMPANY_TABLE}.userId`]: delivery.assignedToUserId
        });
        const { companyName } = await userData.getCompanyInfo(companyId);

        let options = {
          email: recipient.email,
          firstName: recipient.firstName,
          companyName,
          phoneNumber: companyPhone.phoneNumber,
          additionalRecipientText: delivery.additionalRecipientText
        };
        emailService.sendUserDeliveryNotificationMail(options);

        options = {
          toNumber: recipientPhone.phoneNumber,
          companyName,
          phoneNumber: companyPhone.phoneNumber
        };
        smsService.sendUserDeliveryNotificationSMS(options);
      }

      if (dateDiff >= 3) {
        await deliveryData.updateDeliveryStatus(delivery.deliveryId, DeliveryStatusCodes.Expired);
      }
    });

    return deliveries;
  } catch (err) {
    error('Error updating status', err);
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
  acceptDeliveryRequest,
  sendDeliveryNotification,
  sendRequestNotification,
  sendAcceptedNotification,
  getCompanyDeliveries,
  getUserDeliveries,
  getPendingDeliveries,
  getRecentDeliveries,
  getDelivery,
  updateDelivery,
  addUserToDelivery,
  updateDeliveryStatus,
  removeUserFromDelivery,
  deleteDelivery,
  expireDeliveryJob
};
