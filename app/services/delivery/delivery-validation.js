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
  products: Joi.array().items(Joi.number()).min(1).when('statusCode', {
    is: DeliveryStatusCodes.Requested,
    then: Joi.any().strip(),
    otherwise: Joi.required()
  }),
  userDeliveryStatus: Joi.string().valid([
    UserDeliveryStatus.Pending,
    UserDeliveryStatus.Accepted
  ]).required(),
  isAssigned: Joi.any().valid([true, false, 1, 0])
});

const updateDeliveryValidator = Joi.object().keys({
  deliveryId: Joi.number().required(),
  assignedToUserId: Joi.number().required(),
  assignedByUserId: Joi.number().required(),
  userId: Joi.number().required(),
  details: Joi.string().allow('').optional(),
  additionalRecipientText: Joi.string().allow('').strip(),
  additionalCompanyText: Joi.string().allow('').strip(),
  recipientMessage: Joi.string().strip(),
  crewMessage: Joi.string().strip(),
  statusCode: Joi.string().valid([
    DeliveryStatusCodes.Requested,
    DeliveryStatusCodes.Scheduled,
    DeliveryStatusCodes.Delivered,
    DeliveryStatusCodes.Expired
  ]).required(),
  products: Joi.array().items(Joi.number()).min(1).required(),
  userDeliveryStatus: Joi.string().valid([
    UserDeliveryStatus.Pending,
    UserDeliveryStatus.Accepted
  ]).optional(),
  isAssigned: Joi.any().valid([true, false, 1, 0])
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
  updateDeliveryValidator,
  updateDeliveryInfoValidator,
  updateDeliveryStatusValidator
};
