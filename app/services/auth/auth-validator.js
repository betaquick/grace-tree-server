'use strict';

const Joi = require('joi');

const registerationValidator = Joi.object().keys({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  comment: Joi.string(),
  phones: Joi.array().required(),
  emails: Joi.array().required(),
  userAddress: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  zip: Joi.string().required(),
  deliveryPosition: Joi.string().required(),
  description: Joi.object().required(),
  selfPickup: Joi.number().required()
});

const emailValidator = Joi.object().keys({
  userId: Joi.number().required(),
  emailAddress: Joi.string().required()
});

const phoneValidator = Joi.object().keys({
  userId: Joi.number().required(),
  phoneNumber: Joi.string().required()
});

module.exports = {
  registerationValidator,
  emailValidator,
  phoneValidator
};
