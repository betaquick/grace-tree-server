'use strict';

const error = require('debug')('grace-tree:auth-controller:error');
const authSvc = require('../../services/auth/auth-service');
const { handleError, handleSuccess } = require('../util/controller-util');

module.exports = {
  login(req, res) {
    authSvc
      .login(req.body)
      .then(token => handleSuccess(res, 'Login successful', token))
      .catch(err => handleError(err, res, err.message, error));
  }
};
