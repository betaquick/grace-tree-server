'use strict';

const Joi = require('joi');
const userTypes = require('@betaquick/grace-tree-constants').UserTypes;

const loginValidator = Joi.object().keys({
  email: Joi.string()
    .email()
    .required(),
  password: Joi.string().required()
});

const registrationValidator = Joi.object().keys({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  password: Joi.string().required(),
  confirmPassword: Joi.string().required().valid(Joi.ref('password')).options({
    language: {
      any: {
        allowOnly: 'field must match password field'
      }
    }
  }),
  phones: Joi.array().required(),
  emails: Joi.array().required(),
  userType: Joi.string().valid([
    userTypes.Crew,
    userTypes.General,
    userTypes.TreeAdmin
  ]).required()
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
  loginValidator,
  registrationValidator,
  emailValidator,
  phoneValidator
};
