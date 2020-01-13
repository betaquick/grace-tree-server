'use strict';

const { error, debug } = require('./../../../debug')('grace-tree:template-service');

const stringify = require('json-stringify-safe');

const Joi = require('joi');
const { throwError } = require('../../controllers/util/controller-util');

const templateData = require('./template-data');

const { updateTemplateValidator } = require('./template-validator');

module.exports = {
  listTemplates(userId) {
    return templateData.listTemplates(userId);
  },

  async findTemplateById(templateId) {
    try {
      const template = await templateData.getTemplate({ templateId });
      if (!template) {
        throwError(404, 'Template not found');
      }
      return template;
    } catch (err) {
      error('Error fetching a template ' + err.message);
      throw err;
    }
  },

  async findTemplateForNotification(companyId, notificationType) {
    try {
      const template = await templateData.getTemplate({ companyId, notificationType });
      if (!template) {
        throwError(404, 'Template not found');
      }
      return template;
    } catch (err) {
      error('Error fetching a template ' + err.message);
      throw err;
    }
  },

  async editTemplate(templateId, data) {
    debug('Updating template #' + templateId + ' with data: ', stringify(data));
    await Joi.validate(data, updateTemplateValidator);

    return templateData.updateTemplate(templateId, data)
      .then(() => this.findTemplateById(templateId))
      .catch(err => {
        error('Error updating template ' + err.message);
        throw err;
      });
  }
};
