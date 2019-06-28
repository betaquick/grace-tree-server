'use strict';

const knex = require('knex')(require('../../../db/knexfile').getKnexInstance());
const Joi = require('joi');
const error = require('debug')('grace-tree:delivery-service:error');
const debug = require('debug')('grace-tree:delivery-service:debug');
const moment = require('moment');
const _ = require('lodash');

const { UserTypes, DeliveryStatusCodes, NotificationTypes } = require('@betaquick/grace-tree-constants');
const {
  CompanyDeliveryEmail, CompanyDeliveryRequestEmail,
  UserDeliveryEmail, UserDeliverySMS,
  CompanyDeliverySMS, DeliveryRequestSMS,
  DeliveryRequestAcceptanceEmail, DeliveryRequestAcceptanceSMS,
  DeliveryWarningSMS, DeliveryWarningEmail
} = NotificationTypes;

const emailService = require('../messaging/email-service');
const smsService = require('../messaging/sms-service');
const deliveryData = require('./delivery-data');
const userData = require('../user/user-data');
const userSvc = require('../user/user-service');
const templateHydration = require('../template/template-hydration-service');

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

const sendDeliveryNotification = async(delivery) => {
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
      let hydratedText = await templateHydration(company.companyId, CompanyDeliveryEmail, hydrateOptions);
      emailService.sendCompanyDeliveryNotificationMail(options, hydratedText);

      options = {
        toNumber: assignedUserPhone,
        assignedUser, recipient,
        recipientName: `${recipient.firstName} ${recipient.lastName}`,
        address: `${street}, ${city}, ${state}, ${zip}`,
        phoneNumber: recipientPhone
      };
      let hydratedSMS = await templateHydration(company.companyId, CompanyDeliverySMS, hydrateOptions);
      smsService.sendCompanyDeliveryNotificationSMS(options, hydratedSMS);

      options = {
        email: recipient.email,
        firstName: recipient.firstName,
        companyName,
        phoneNumber: assignedUserPhone,
        address: `${street}, ${city}, ${state}, ${zip}`,
        additionalRecipientText
      };
      hydratedText = await templateHydration(company.companyId, UserDeliveryEmail, hydrateOptions);
      emailService.sendUserDeliveryNotificationMail(options, hydratedText);

      options = {
        toNumber: recipientPhone,
        companyName,
        phoneNumber: assignedUserPhone
      };
      hydratedSMS = await templateHydration(company.companyId, UserDeliverySMS, hydrateOptions);
      smsService.sendUserDeliveryNotificationSMS(options, hydratedSMS);
    } catch (err) {
      error('Error sending delivery notification', err);
      throw err;
    }
  });
};

const sendRequestNotification = async(delivery, company) => {
  const {
    deliveryId,
    assignedToUserId,
    users
  } = delivery;
  users.forEach(async recipientId => {
    try {
      const recipient = await userSvc.getUserObject(recipientId);
      const phoneNumber = _.get(_.find(recipient.phones, p => p.primary), 'phoneNumber');

      const assignedUser = await userSvc.getUserObject(assignedToUserId);
      const companyName = _.get(company, 'companyName', 'Unknown');

      let options = {
        userId: recipient.userId,
        email: recipient.email,
        firstName: recipient.firstName,
        companyName,
        deliveryId
      };

      const hydrateOptions = {
        recipient, assignedUser, company, deliveryId
      };
      const hydratedText = await templateHydration(company.companyId, CompanyDeliveryRequestEmail, hydrateOptions);
      emailService.sendDeliveryRequestNotificationMail(options, hydratedText);

      options = {
        phoneNumber,
        companyName,
        userId: recipient.userId,
        deliveryId
      };
      const hydratedSMS = await templateHydration(company.companyId, DeliveryRequestSMS, hydrateOptions);
      smsService.sendDeliveryRequestNotificationSMS(options, hydratedSMS);

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
    const hydrateOptions = {
      recipient, assignedUser
    };
    const hydratedText = await templateHydration(delivery.companyId, DeliveryRequestAcceptanceEmail, hydrateOptions);
    emailService.sendDeliveryAcceptedNotificationMail(options, hydratedText);

    options = {
      phoneNumber: assignedUserPhone,
      recipientName: `${recipient.firstName} ${recipient.lastName}`
    };
    const hydratedSMS = await templateHydration(delivery.companyId, DeliveryRequestAcceptanceSMS, hydrateOptions);
    smsService.sendDeliveryAccceptedNotificationSMS(options, hydratedSMS);
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
  let recipient = await userData.getUserByParam(USER_TABLE, {
    [`${USER_TABLE}.userId`]: delivery.userId
  });
  const recipientProfile = await userData.getUserProfile(delivery.userId);
  recipient = { ...recipientProfile, ...recipient,
    addresses: [{ street: '', city: '', state: '', zip: '' }] };
  const recipientPhone = await userData.getUserPhone(delivery.userId);
  const { companyName, companyId } = await userData
    .getCompanyInfoByUserId(delivery.assignedByUserId || delivery.userId);
  let options = {
    email: recipient.email,
    firstName: recipient.firstName,
    companyName
  };
  const hydrateOptions = {
    recipient, company: { companyName,
      companyAddress: { street: '', city: '', state: '', zip: '' } }
  };
  const hydratedText = await templateHydration(companyId, DeliveryWarningEmail, hydrateOptions);
  emailService.sendWarningNotificationMail(options, hydratedText);

  options = {
    toNumber: recipientPhone.phoneNumber,
    companyName
  };
  const hydratedSMS = await templateHydration(companyId, DeliveryWarningSMS, hydrateOptions);
  smsService.sendWarningNotificationSMS(options, hydratedSMS);
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
  expireDeliveryJob,
  sendWarningNotification
};
