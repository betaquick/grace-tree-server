'use strict';

const error = require('debug')('grace-tree:user-controller:error');

const notificationSvc = require('../../services/notification/notification-service');
const { handleError, handleSuccess } = require('../util/controller-util');

module.exports = {
  getNotifications(req, res) {
    const { userId } = req.user;

    notificationSvc
      .getNotifications(userId)
      .then(products => handleSuccess(res, 'Notifications retrieved successful', { products }))
      .catch(err => handleError(err, res, err.message, error));
  },

  getNotification(req, res) {
    const { userId } = req.user;
    const { notificationId } = req.params;

    notificationSvc
      .getNotification(userId, notificationId)
      .then(products => handleSuccess(res, 'Notifications retrieved successful', { products }))
      .catch(err => handleError(err, res, err.message, error));
  }
};
