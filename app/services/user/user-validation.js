'use strict';

const Joi = require('joi');
const statusTypes = require('@betaquick/grace-tree-constants').StatusTypes;

const userValidator = Joi.object().keys({
  userId: Joi.number().required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  password: Joi.string().required(),
  addresses: Joi.array().required()
});

const statusValidator = Joi.object().keys({
  userId: Joi.number().required(),
  status: Joi.string().valid([
    statusTypes.Pause,
    statusTypes.Ready,
    statusTypes.Stop
  ]).required()
});

module.exports = {
  userValidator,
  statusValidator
};
