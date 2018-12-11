'use strict';

const error = require('debug')('grace-tree:auth-controller:error');
const authSvc = require('../../services/auth/auth-service');
const { handleError, handleSuccess } = require('../util/controller-util');

module.exports = {
  register(req, res) {
    authSvc
      .register(req.body)
      .then(data => handleSuccess(res, 'Registration successful', data))
      .catch(err => handleError(err, res, err.message, error));
  }
};
