'use strict';

const Joi = require('joi');

const statusValidator = Joi.object().keys({
  userId: Joi.number().required(),
  status: Joi.string().required()
});

module.exports = {
  statusValidator
};
