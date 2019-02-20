'use strict';

const Joi = require('joi');
const { DeliveryStatusCodes, UserDeliveryStatus } = require('@betaquick/grace-tree-constants');

const deliveryInfoValidator = Joi.object().keys({
  assignedByUserId: Joi.number().required(),
  assignedToUserId: Joi.number().required(),
  users: Joi.array().required(),
  details: Joi.string().allow('').optional(),
  additionalRecipientText: Joi.string().allow('').optional(),
  additionalCompanyText: Joi.string().allow('').optional(),
  statusCode: Joi.string().valid([
    DeliveryStatusCodes.Requested,
    DeliveryStatusCodes.Scheduled,
    DeliveryStatusCodes.Delivered,
    DeliveryStatusCodes.Expired
  ]).required(),
  userDeliveryStatus: Joi.string().valid([
    UserDeliveryStatus.Pending,
    UserDeliveryStatus.Accepted
  ]).required()
});

const updateDeliveryInfoValidator = Joi.object().keys({
  deliveryId: Joi.number().required(),
  assignedToUserId: Joi.number().required(),
  details: Joi.string().allow('').optional(),
  additionalRecipientText: Joi.string().allow('').optional(),
  additionalCompanyText: Joi.string().allow('').optional()
});

const updateDeliveryStatusValidator = Joi.object().keys({
  deliveryId: Joi.number().required(),
  statusCode: Joi.string().required()
});

module.exports = {
  deliveryInfoValidator,
  updateDeliveryInfoValidator,
  updateDeliveryStatusValidator
};
