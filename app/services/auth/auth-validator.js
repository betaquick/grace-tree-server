'use strict';

const Joi = require('joi');

const loginValidator = Joi.object().keys({
  email: Joi.string()
    .email()
    .required(),
  password: Joi.string().required()
});

module.exports = {
  loginValidator
};
