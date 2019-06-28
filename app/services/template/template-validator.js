'use strict';

const Joi = require('joi');

const getTemplateValidator = Joi.number().required();

const updateTemplateValidator = Joi.object().keys({
  templateId: Joi.number().strip(),
  message: Joi.string().required(),
  companyId: Joi.number().required(),
  notificationType: Joi.string().required().strip()
});

module.exports = {
  getTemplateValidator,
  updateTemplateValidator
};
