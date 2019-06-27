'use strict';

const error = require('debug')('grace-tree:template-service:error');
const debug = require('debug')('grace-tree:template-service:debug');

const stringify = require('json-stringify-safe');

const Joi = require('joi');
const { throwError } = require('../../controllers/util/controller-util');

const templateData = require('./template-data');

const { getTemplateValidator, newTemplateValidator, updateTemplateValidator } = require('./template-validator');

module.exports = {
  listTemplates(userId) {
    return templateData.listTemplates(userId);
  },

  async findTemplateById(templateId) {
    try {
      await Joi.validate(templateId, getTemplateValidator);

      const template = await templateData.getTemplate({ templateId });

      if (!template) {
        throwError(404, 'Template not found');
      }
      return template;
    } catch (err) {
      error('Error fetching a template ' + error.message);
      throw err;
    }
  },

  async createTemplate(data) {
    debug('Create new template: ' + stringify(data));
    await Joi.validate(data, newTemplateValidator);

    return templateData.insertTemplate(data)
      .then(([templateId]) => this.findTemplateById(templateId))
      .catch(err => {
        error('Error creating a template ' + err.message);
        throw err;
      });
  },

  async editTemplate(templateId, data) {
    debug('Updating template #' + templateId + ' with data: ', stringify(data));
    await Joi.validate(data, updateTemplateValidator);

    const template = await this.findTemplateById(templateId);

    if (template.public) {
      throwError(409, 'Template is a default preset, duplicate to modify');
    }

    return templateData.updateTemplate(templateId, data)
      .then(() => this.findTemplateById(templateId))
      .catch(err => {
        error('Error updating template ' + err.message);
        throw err;
      });
  }
};
