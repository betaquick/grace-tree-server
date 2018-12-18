'use strict';

const Joi = require('joi');
const statusTypes = require('@betaquick/grace-tree-constants').StatusTypes;

const statusValidator = Joi.object().keys({
  userId: Joi.number().required(),
  status: Joi.string().valid([
    statusTypes.Pause,
    statusTypes.Ready,
    statusTypes.Stop
  ]).required()
});

module.exports = {
  statusValidator
};
