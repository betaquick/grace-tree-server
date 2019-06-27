'use strict';

const Joi = require('joi');

const getTemplateValidator = Joi.number().required();

const newTemplateValidator = Joi.object().keys({
  name: Joi.string().required().max(255),
  content: Joi.string().required(),
  public: Joi.boolean().truthy([1, '1', true, 'true']).falsy([0, '0', false, 'false']).optional(),
  userId: Joi.number().required()
});

const updateTemplateValidator = Joi.object().keys({
  templateId: Joi.number().strip(),
  name: Joi.string().required().max(255),
  content: Joi.string().required(),
  public: Joi.boolean().truthy([1, '1', true, 'true']).falsy([0, '0', false, 'false']).optional()
});

module.exports = {
  getTemplateValidator,
  newTemplateValidator,
  updateTemplateValidator
};
