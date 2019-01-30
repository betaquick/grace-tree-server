'use strict';

const Joi = require('joi');

const deliveryInfoValidator = Joi.object().keys({
  userId: Joi.number().required(),
  companyId: Joi.number().required(),
  users: Joi.array().required(),
  details: Joi.string().allow('').optional(),
  additionalRecipientText: Joi.string().allow('').optional(),
  additionalCompanyText: Joi.string().allow('').optional()
});

const updateDeliveryInfoValidator = Joi.object().keys({
  deliveryId: Joi.number().required(),
  companyId: Joi.number().required(),
  details: Joi.string().allow('').optional(),
  additionalRecipientText: Joi.string().allow('').optional(),
  additionalCompanyText: Joi.string().allow('').optional()
});

module.exports = {
  deliveryInfoValidator,
  updateDeliveryInfoValidator
};
