'use strict';

const Joi = require('joi');
const {UserTypes, PhoneTypes} = require('@betaquick/grace-tree-constants');

const loginValidator = Joi.object().keys({
  email: Joi.string()
    .email()
    .required(),
  password: Joi.string().required()
});

const resetPasswordValidator = Joi.object().keys({
  password: Joi.string().required(),
  confirmPassword: Joi.string().required().valid(Joi.ref('password')).options({
    language: {
      any: {
        allowOnly: 'field must match password field'
      }
    }
  }),
  token: Joi.string().required()
});

const phoneListSchema = Joi.object().keys({
  phoneNumber: Joi.string().required(),
  primary: Joi.boolean().required(),
  phoneType: Joi.string().valid([
    PhoneTypes.HOME,
    PhoneTypes.MOBILE,
    PhoneTypes.OFFICE,
    PhoneTypes.WORK
  ]).required()
});

const emailListSchema = Joi.object().keys({
  emailAddress: Joi.string().required(),
  primary: Joi.boolean().required()
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
  phones: Joi.array().items(phoneListSchema).required().when('userType', {
    is: UserTypes.TreeAdmin, then: Joi.array().length(1), otherwise: Joi.array().length(3)
  }),
  emails: Joi.array().items(emailListSchema).required().when('userType', {
    is: UserTypes.TreeAdmin, then: Joi.array().length(1), otherwise: Joi.array().length(2)
  }),
  userType: Joi.string().valid([
    UserTypes.Crew,
    UserTypes.General,
    UserTypes.TreeAdmin
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
  resetPasswordValidator,
  registrationValidator,
  emailValidator,
  phoneValidator
};
