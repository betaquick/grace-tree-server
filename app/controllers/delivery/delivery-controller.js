'use strict';

const error = require('debug')('grace-tree:user-controller:error');
const deliverySvc = require('../../services/delivery/delivery-service');

const { handleError, handleSuccess } = require('../util/controller-util');

module.exports = {
  getDeliveryInfo(req, res) {
    const { userId } = req.user;
    const { recipientId } = req.params;

    deliverySvc
      .getDeliveryInfo(userId, recipientId)
      .then(deliveryInfo => {
        handleSuccess(res, 'Delivery info retrieved successfully', deliveryInfo);
      })
      .catch(err => handleError(err, res, 'Error fetching delivery info', error));

  },

  createDelivery(req, res) {
    const { userId } = req.user;
    const { body } = req;

    deliverySvc
      .addDelivery(userId, body)
      .then(async delivery => {
        try {
          await deliverySvc.sendDeliveryNotification(delivery);
          handleSuccess(res, 'Delivery added successfully', { delivery });
        } catch (err) {
          error('Error sending verification for Email/Phone: ', err);
        }
      })
      .catch(err => handleError(err, res, 'Error Creating Delivery', error));
  },

  getCompanyDeliveries(req, res) {
    const { userId } = req.user;

    deliverySvc
      .getCompanyDeliveries(userId)
      .then(deliveries => {
        handleSuccess(res, 'Deliveries retrieved successfully', { deliveries });
      })
      .catch(err => handleError(err, res, 'Error Fetching Deliveries', error));
  },

  getUserDeliveries(req, res) {
    const { userId } = req.user;

    deliverySvc
      .getUserDeliveries(userId)
      .then(deliveries => {
        handleSuccess(res, 'Deliveries retrieved successfully', { deliveries });
      })
      .catch(err => handleError(err, res, 'Error Fetching Deliveries', error));
  },

  getUserPendingDeliveries(req, res) {
    const { userId } = req.user;

    deliverySvc
      .getUserPendingDeliveries(userId)
      .then(deliveries => {
        handleSuccess(res, 'Deliveries retrieved successfully', { deliveries });
      })
      .catch(err => handleError(err, res, 'Error Fetching Deliveries', error));
  },

  getUserRecentDeliveries(req, res) {
    const { userId } = req.user;

    deliverySvc
      .getUserRecentDeliveries(userId)
      .then(deliveries => {
        handleSuccess(res, 'Deliveries retrieved successfully', { deliveries });
      })
      .catch(err => handleError(err, res, 'Error Fetching Deliveries', error));
  },

  updateDeliveryStatus(req, res) {
    const { deliveryId } = req.params;
    const { statusCode } = req.body;
    deliverySvc
      .updateDeliveryStatus(deliveryId, statusCode)
      .then(deliveryId => {
        handleSuccess(res, 'Delivery updated successfully', deliveryId);
      })
      .catch(err => handleError(err, res, 'Error updating delivery', error));
  },

  getDelivery(req, res) {
    const { deliveryId } = req.params;

    deliverySvc
      .getDelivery(deliveryId)
      .then(delivery => {
        handleSuccess(res, 'Delivery retrieved successfully', delivery);
      })
      .catch(err => handleError(err, res, 'Error Fetching Delivery', error));
  },

  updateDelivery(req, res) {
    const { userId } = req.user;
    const { body } = req;
    deliverySvc
      .updateDelivery(userId, body)
      .then(delivery => {
        handleSuccess(res, 'Delivery updated successfully', delivery);
      })
      .catch(err => handleError(err, res, 'Error updating Delivery', error));
  },

  addUserToDelivery(req, res) {
    const { userId, deliveryId } = req.body;
    deliverySvc
      .addUserToDelivery(deliveryId, userId)
      .then(() => {
        handleSuccess(res, 'User added to delivery');
      })
      .catch(err => handleError(err, res, 'Error adding user', error));
  },

  removeUserFromDelivery(req, res) {
    const { userId, deliveryId } = req.body;
    deliverySvc
      .removeUserFromDelivery(deliveryId, userId)
      .then(() => {
        handleSuccess(res, 'User removed from delivery');
      })
      .catch(err => handleError(err, res, 'Error removing user', error));
  },

  deleteDelivery(req, res) {
    const { deliveryId } = req.body;

    deliverySvc
      .deleteDelivery(deliveryId)
      .then(() => {
        handleSuccess(res, 'Delivery deleted.');
      })
      .catch(err => handleError(err, res, 'Error deleting delivery', error));

  }
};
