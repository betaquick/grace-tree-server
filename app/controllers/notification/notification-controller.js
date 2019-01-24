'use strict';

const error = require('debug')('grace-tree:user-controller:error');

const notificationSvc = require('../../services/notification/notification-service');
const { handleError, handleSuccess } = require('../util/controller-util');

module.exports = {
  getNotifications(req, res) {
    const { userId } = req.user;

    notificationSvc
      .getNotifications(userId)
      .then(notifications => handleSuccess(res, 'Notifications retrieved successful', { notifications }))
      .catch(err => handleError(err, res, err.message, error));
  },

  getNotification(req, res) {
    const { userId } = req.user;
    const { notificationId } = req.params;

    notificationSvc
      .getNotification(userId, notificationId)
      .then(notification => handleSuccess(res, 'Notification retrieved successful', { notification }))
      .catch(err => handleError(err, res, err.message, error));
  }
};
