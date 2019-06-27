'use strict';

const error = require('debug')('grace-tree:user-controller:error');
const { DeliveryStatusCodes, UserStatus } = require('@betaquick/grace-tree-constants');

const userSvc = require('../../services/user/user-service');
const templateSvc = require('../../services/template/template-service');
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

    let delivery;

    const { templateId } = body;

    deliverySvc
      .addDelivery(userId, body)
      .then(async response => {
        delivery = response;
        if (delivery.statusCode === DeliveryStatusCodes.Requested) {
          return deliverySvc.sendRequestNotification(delivery);
        }

        const template = await templateSvc.findTemplateById(templateId);
        return deliverySvc.sendDeliveryNotification(delivery, template.content);
      })
      .then(() => handleSuccess(res, 'Delivery added successfully', { delivery }))
      .catch(err => handleError(err, res, 'Error Creating Delivery', error));
  },

  updateDelivery(req, res) {
    const { deliveryId } = req.params;
    const { body } = req;

    let delivery;

    deliverySvc
      .updateDelivery(deliveryId, body)
      .then(response => {
        delivery = response;

        if (delivery.statusCode === DeliveryStatusCodes.Requested) {
          return deliverySvc.sendRequestNotification(delivery);
        }

        return deliverySvc.sendDeliveryNotification(delivery);
      })
      .then(() => handleSuccess(res, 'Delivery updated successfully', { delivery }))
      .catch(err => handleError(err, res, 'Error updating delivery', error));
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

  getPendingDeliveries(req, res) {
    const { userId, userType } = req.user;

    deliverySvc
      .getPendingDeliveries(userId, userType)
      .then(deliveries => {
        handleSuccess(res, 'Deliveries retrieved successfully', { deliveries });
      })
      .catch(err => handleError(err, res, 'Error Fetching Deliveries', error));
  },

  getRecentDeliveries(req, res) {
    const { userId, userType } = req.user;

    deliverySvc
      .getRecentDeliveries(userId, userType)
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
    const { userType } = req.user;
    const { deliveryId } = req.params;

    deliverySvc
      .getDelivery(deliveryId, userType)
      .then(delivery => {
        handleSuccess(res, 'Delivery retrieved successfully', delivery);
      })
      .catch(err => handleError(err, res, 'Error Fetching Delivery', error));
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
  },

  acceptDeliveryRequest(req, res) {
    const { userId, deliveryId } = req.params;
    let delivery;

    deliverySvc
      .acceptDeliveryRequest(userId, deliveryId)
      .then(response => {
        delivery = response;
        return deliverySvc.sendAcceptedNotification(userId, deliveryId);
      })
      .then(() => userSvc.updateStatus(userId, UserStatus.Ready))
      .then(() => handleSuccess(res, 'Delivery request accepted successfully', delivery))
      .catch(err => handleError(err, res, 'Error accepting delivery request', error));
  },

  expireDeliveryJob(req, res) {
    deliverySvc
      .expireDeliveryJob()
      .then(() => {
        handleSuccess(res, 'Delivery updated successfully');
      })
      .catch(err => handleError(err, res, 'Error updating delivery', error));
  }
};
