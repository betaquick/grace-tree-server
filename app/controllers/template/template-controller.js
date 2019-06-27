'use strict';

const error = require('debug')('grace-tree:user-controller:error');
const debug = require('debug')('grace-tree:user-controller:debug');
const stringify = require('json-stringify-safe');

const templateSvc = require('../../services/template/template-service');
const { handleError, handleSuccess } = require('../util/controller-util');

module.exports = {
  listTemplates: (req, res) => {
    debug('Retrieve list of template types');

    templateSvc
      .listTemplates(req.user.userId)
      .then(templates =>
        handleSuccess(res, 'List templates successful', { templates })
      )
      .catch(err =>
        handleError(err, res, 'Error in fetching templates', error)
      );
  },

  getTemplate: (req, res) => {
    const id = req.params.id;

    debug('Retrieve a template ' + id);

    templateSvc
      .findTemplateById(id)
      .then(template =>
        handleSuccess(res, 'Get a template successful', { template })
      )
      .catch(err =>
        handleError(err, res, 'Error in getting a template', error)
      );
  },

  createTemplate: (req, res) => {
    const data = req.body;
    data.userId = req.user.userId;


    debug('Creating a new template: ' + stringify(data));


    templateSvc
      .createTemplate(data)
      .then(template =>
        handleSuccess(res, 'Template created successfully', { template })
      )
      .catch(err => handleError(err, res, 'Error creating a template', error));
  },

  editTemplate: (req, res) => {
    const templateId = req.params.id;
    const { body } = req;

    debug('Updating user with data: ', stringify(body));

    templateSvc
      .editTemplate(templateId, body)
      .then(template =>
        handleSuccess(res, 'Template updated successfully', { template })
      )
      .catch(err => handleError(err, res, 'Error updating template', error));
  }
};
