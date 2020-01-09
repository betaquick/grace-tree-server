'use strict';

const { error, debug } = require('./../../../debug')('grace-tree:notification-service');

const stringify = require('json-stringify-safe');
const Joi = require('joi');
const { UserTypes } = require('@betaquick/grace-tree-constants');

const userData = require('../user/user-data');
const notificationData = require('./notification-data');
const { notificationValidator } = require('./notification-validation');
const {
  USER_TABLE
} = require('../../../constants/table.constants');
const { throwError } = require('./../../controllers/util/controller-util');

const getNotifications = async userId => {
  debug('Retrieving notification for: ' + userId);

  try {

    await Joi.validate(userId, Joi.number().required());

    const where = {
      [`${USER_TABLE}.userId`]: userId
    };
    const user = await userData.getUserByParam(USER_TABLE, where);

    if (user.userType === UserTypes.General) {
      return notificationData.getRecipientNotifications(userId);
    }

    return notificationData.getNotifications(userId);
  } catch (err) {
    error('Error retrieving notifications ' + err.message);
    throw err;
  }
};

const getNotification = async(userId, notificationId) => {
  debug('Retrieving notification for: ' + notificationId);

  try {
    await Joi.validate(userId, Joi.number().required());
    await Joi.validate(notificationId, Joi.number().required());

    const where = {
      [`${USER_TABLE}.userId`]: userId
    };
    const user = await userData.getUserByParam(USER_TABLE, where);

    if (user.userType === UserTypes.General) {
      await notificationData.updateReadReceipt(notificationId);
    }

    const notification = await notificationData.getNotification(notificationId);

    if (!notification) {
      throwError(422, 'Notification doesn\'t exist');
    }

    return notification;
  } catch (err) {
    error('Error retrieving notification ' + err.message);
    throw err;
  }
};

const addNotification = async(sender, data) => {
  const notification = { sender, ...data };
  debug('Add notification ' + stringify(notification));

  try {
    await Joi.validate(notification, notificationValidator);

    const notificationIds = await notificationData.addNotification(notification);
    return notificationIds[0];
  } catch (err) {
    error('Error adding notification ' + err.message);
    throw err;
  }
};

module.exports = {
  getNotifications,
  getNotification,
  addNotification
};
