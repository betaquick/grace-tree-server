'use strict';

const Joi = require('joi');

const notificationValidator = Joi.object().keys({
  sender: Joi.number().required(),
  recipient: Joi.number().required(),
  message: Joi.string().required()
});

module.exports = {
  notificationValidator
};
