'use strict';

const error = require('debug')('grace-tree:user-controller:error');
const deliverySvc = require('../../services/delivery/delivery-service');

const { handleError, handleSuccess } = require('../util/controller-util');

module.exports = {
  createDelivery(req, res) {
    try {
      const { userId } = req.user;
      const { body } = req;

      deliverySvc
        .addDelivery(userId, body)
        .then(delivery => {
          handleSuccess(res, 'Delivery added successfully', { delivery });

        })
        .catch(err => handleError(err, res, 'Error Creating Delivery', error));
    } catch (e){
      handleError(e, res, 'Error Creating Delivery', error);
    }
  },

  getCompanyDeliveries(req, res) {
    try {
      const { userId } = req.user;

      deliverySvc
        .getCompanyDeliveries(userId)
        .then(deliveries => {
          handleSuccess(res, 'Deliveries retrieved successfully', deliveries);
        })
        .catch(err => handleError(err, res, 'Error Fetching Deliveries', error));
    } catch (e) {
      handleError(e, res, 'Error Fetching Deliveries', error);
    }
  },

  getDelivery(req, res) {
    try {
      const { deliveryId } = req.params;

      deliverySvc
        .getDelivery(deliveryId)
        .then(delivery => {
          handleSuccess(res, 'Delivery retrieved successfully', delivery);
        })
        .catch(err => handleError(err, res, 'Error Fetching Delivery', error));
    } catch (e) {
      handleError(e, res, 'Error Fetching Delivery', error);
    }
  },

  updateDelivery(req, res) {
    try {
      const { userId } = req.user;
      const { body } = req;
      deliverySvc
        .updateDelivery(userId, body)
        .then(delivery => {
          handleSuccess(res, 'Delivery updated successfully', delivery);
        })
        .catch(err => handleError(err, res, 'Error updating Delivery', error));
    } catch (e) {
      handleError(e, res, 'Error updating Delivery', error);
    }
  },

  addUserToDelivery(req, res) {
    try {
      const { userId, deliveryId } = req.body;
      deliverySvc
        .addUserToDelivery(deliveryId, userId)
        .then(() => {
          handleSuccess(res, 'User added to delivery');
        })
        .catch(err => handleError(err, res, 'Error adding user', error));
    } catch (e) {
      handleError(e, res, 'Error adding user', error);
    }
  },

  removeUserFromDelivery(req, res) {
    try {
      const { userId, deliveryId } = req.body;
      deliverySvc
        .removeUserFromDelivery(deliveryId, userId)
        .then(() => {
          handleSuccess(res, 'User removed from delivery');
        })
        .catch(err => handleError(err, res, 'Error removing user', error));
    } catch (e) {
      handleError(e, res, 'Error removing user', error);
    }
  },

  deleteDelivery(req, res) {
    try {
      const { deliveryId } = req.body;

      deliverySvc
        .deleteDelivery(deliveryId)
        .then(() => {
          handleSuccess(res, 'Delivery deleted.');
        })
        .catch(err => handleError(err, res, 'Error deleting delivery', error));
    } catch (e) {
      handleError(e, res, 'Error deleting delivery', error);
    }
  }
};
