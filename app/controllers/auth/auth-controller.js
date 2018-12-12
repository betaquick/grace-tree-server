'use strict';

const debug = require('debug')('grace-tree:auth-controller:debug');
const error = require('debug')('grace-tree:auth-controller:error');
const verificationTypes = require('@betaquick/grace-tree-constants').VerificationTypes;

const authSvc = require('../../services/auth/auth-service');
const { handleError, handleSuccess } = require('../util/controller-util');

module.exports = {
  register(req, res) {
    authSvc
      .register(req.body)
      .then(data => handleSuccess(res, 'Registration successful', data))
      .catch(err => handleError(err, res, err.message, error));
  },

  verify(req, res) {
    const { verifyType } = req.body;
    const { userId } = req.user;
    debug('verifying for ' + verifyType);

    let verifySvc;
    if (verifyType === verificationTypes.Email) {
      verifySvc = authSvc.verifyEmail(userId, req.body);
    } else {
      verifySvc = authSvc.verifyPhone(userId, req.body);
    }

    verifySvc
      .then(data => handleSuccess(res, 'Verification link sent successfully', data))
      .catch(err => handleError(err, res, err.message, error));
  }
};
