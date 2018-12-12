'use strict';

const Joi = require('joi');

const registrationValidator = Joi.object().keys({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  phones: Joi.array().required(),
  emails: Joi.array().required()
});

const emailValidator = Joi.object().keys({
  userId: Joi.number().required(),
  emailAddress: Joi.string().email().required()
});

const phoneValidator = Joi.object().keys({
  userId: Joi.number().required(),
  phoneNumber: Joi.string().required()
});

module.exports = {
  registrationValidator,
  emailValidator,
  phoneValidator
};
