'use strict';

const knex = require('knex')(require('../../../db/knexfile').getKnexInstance());
const Joi = require('joi');
const error = require('debug')('grace-tree:delivery-service:error');
const debug = require('debug')('grace-tree:delivery-service:debug');
const moment = require('moment');
const _ = require('lodash');

const { UserTypes, DeliveryStatusCodes, Placeholders } = require('@betaquick/grace-tree-constants');

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
  USER_TABLE
} = require('../../../constants/table.constants');

const getDeliveryInfo = async(userId, recipientId) => {
  await Joi.validate(recipientId, Joi.number().required());

  const recipient = await userData
    .getUserByParam(USER_ADDRESS_TABLE, { [`${USER_ADDRESS_TABLE}.userId`]: recipientId });
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

const sendDeliveryNotification = async(delivery, templateContent) => {
  const {
    assignedToUserId,
    users,
    additionalRecipientText,
    additionalCompanyText
  } = delivery;

  users.forEach(async recipientId => {
    try {
      const assignedUser = await userSvc.getUserObject(assignedToUserId);
      const assignedUserPhone = _.get(_.find(assignedUser.phones, p => p.primary), 'phoneNumber');
      const companyName = _.get(assignedUser, 'company.companyName', 'Unknown');
      const company = _.get(assignedUser, 'company');

      const recipient = await userSvc.getUserObject(recipientId);
      const recipientPhone = _.get(_.find(recipient.phones, p => p.primary), 'phoneNumber');
      const recipientAddress = _.head(recipient.addresses);
      const { street, city, state, zip } = recipientAddress;

      let options = {
        email: assignedUser.email,
        firstName: assignedUser.firstName,
        lastName: assignedUser.lastName,
        recipientName: `${recipient.firstName} ${recipient.lastName}`,
        phoneNumber: recipientPhone,
        address: `${street}, ${city}, ${state}, ${zip}`,
        additionalCompanyText
      };

      const hydrateOptions = {
        recipient, assignedUser, company, additionalCompanyText, additionalRecipientText
      };
      emailService.sendCompanyDeliveryNotificationMail(options);

      options = {
        toNumber: assignedUserPhone,
        firstName: assignedUser.firstName,
        recipientName: `${recipient.firstName} ${recipient.lastName}`,
        phoneNumber: recipientPhone,
        address: `${street}, ${city}, ${state}, ${zip}`
      };
      smsService.sendCompanyDeliveryNotificationSMS(options);

      options = {
        email: recipient.email,
        firstName: recipient.firstName,
        companyName,
        phoneNumber: assignedUserPhone,
        address: `${street}, ${city}, ${state}, ${zip}`,
        additionalRecipientText
      };
      const hydratedText = hydrateTemplate(templateContent, hydrateOptions);
      emailService.sendUserDeliveryNotificationMail(options, hydratedText);

      options = {
        toNumber: recipientPhone,
        companyName,
        phoneNumber: assignedUserPhone
      };
      smsService.sendUserDeliveryNotificationSMS(options);
    } catch (err) {
      error('Error sending delivery notification', err);
      throw err;
    }
  });
};

/**
 *
 * @param {string} template raw template with placeholders
 * @param {Object} lookup data needed for hydration
 * @returns {string}
 */
const hydrateTemplate = (template, lookup) => {
  const { street, city, state, zip } = _.head(lookup.recipient.addresses) || {};
  const recipientAddress = `${street}, ${city} ${state}, ${zip}`;
  const { Cstreet, Ccity, Cstate, Czip } = lookup.company.companyAddress || {};
  const companyAddress = `${Cstreet}, ${Ccity}, ${Cstate}, ${Czip}`;
  const recipientPhone = _.get(_.find(lookup.recipient.phones, p => p.primary), 'phoneNumber');
  const assignedUserPhone = _.get(_.find(lookup.assignedUser.phones, p => p.primary), 'phoneNumber');
  try {
    return template.replace(new RegExp(Placeholders.RecipientFirstName, 'g'), lookup.recipient.firstName)
      .replace(new RegExp(Placeholders.RecipientLastName, 'g'), lookup.recipient.lastName)
      .replace(new RegExp(Placeholders.AssignedUserFirstName, 'g'), lookup.assignedUser.firstName)
      .replace(new RegExp(Placeholders.AssignedUserLastName, 'g'), lookup.assignedUser.lastName)
      .replace(new RegExp(Placeholders.RecipientPhoneNumber, 'g'), recipientPhone)
      .replace(new RegExp(Placeholders.AssignedUserPhoneNumber, 'g'), assignedUserPhone)
      .replace(new RegExp(Placeholders.AdditionalCompanyText, 'g'), lookup.additionalCompanyText || '')
      .replace(new RegExp(Placeholders.AdditionalRecipientText, 'g'), lookup.additionalRecipientText || '')
      .replace(new RegExp(Placeholders.RecipientAddress, 'g'), recipientAddress)
      .replace(new RegExp(Placeholders.CompanyName, 'g'), lookup.company.companyName)
      .replace(new RegExp(Placeholders.CompanyAddress, 'g'), companyAddress);
  } catch (error) {
    return null;
  }
};

const sendRequestNotification = async delivery => {
  const {
    deliveryId,
    assignedToUserId,
    users
  } = delivery;

  users.forEach(async recipientId => {
    try {
      const recipient = await userSvc.getUserObject(recipientId);
      const phoneNumber = _.get(_.find(recipient.phones, p => p.primary), 'phoneNumber');

      const crew = await userSvc.getUserObject(assignedToUserId);
      const companyName = _.get(crew, 'company.companyName', 'Unknown');

      let options = {
        userId: recipient.userId,
        email: recipient.email,
        firstName: recipient.firstName,
        companyName,
        deliveryId
      };

      emailService.sendDeliveryRequestNotificationMail(options);

      options = {
        phoneNumber,
        companyName,
        userId: recipient.userId,
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
    const assignedUser = await userSvc.getUserObject(delivery.assignedToUserId);
    const recipient = await userSvc.getUserObject(userId);

    const assignedUserPhone = _.get(_.find(assignedUser.phones, p => p.primary), 'phoneNumber');

    let options = {
      email: assignedUser.email,
      firstName: assignedUser.firstName,
      recipientName: `${recipient.firstName} ${recipient.lastName}`
    };
    emailService.sendDeliveryAccceptedNotificationMail(options);

    options = {
      phoneNumber: assignedUserPhone,
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

const filterDeliveries = (delivery, filter) => {
  const createdAt = moment(delivery.createdAt);
  const dateDiff = moment().diff(createdAt, 'days');

  return dateDiff === filter;
};

const sendWarningNotification = async delivery => {
  const recipient = await userData.getUserByParam(USER_TABLE, {
    [`${USER_TABLE}.userId`]: delivery.userId
  });
  const recipientPhone = await userData.getUserPhone(delivery.userId);
  const { companyName } = await userData.getCompanyInfoByUserId(delivery.userId);

  let options = {
    email: recipient.email,
    firstName: recipient.firstName,
    companyName
  };
  emailService.sendWarningNotificationMail(options);

  options = {
    toNumber: recipientPhone.phoneNumber,
    companyName
  };
  smsService.sendWarningNotificationSMS(options);
};

const expireDeliveryJob = async() => {
  debug('Update deliveries cron job');
  try {
    const deliveries = await deliveryData.getScheduledDeliveries();
    const warningDeliveries = deliveries.filter(delivery => filterDeliveries(delivery, 2));
    const expiredDeliveries = deliveries.filter(delivery => filterDeliveries(delivery, 3));

    const warningDeliveriesMap = warningDeliveries.map(delivery => sendWarningNotification(delivery));
    const expiredDeliveriesMap = expiredDeliveries.map(
      delivery => deliveryData.updateDeliveryStatus(delivery.deliveryId, DeliveryStatusCodes.Expired
      ));
    await Promise.all([...warningDeliveriesMap, ...expiredDeliveriesMap]);

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
