'use strict';

const debug = require('debug')('grace-tree:auth-controller:debug');
const error = require('debug')('grace-tree:auth-controller:error');
const verificationTypes = require('@betaquick/grace-tree-constants').VerificationTypes;

const authSvc = require('../../services/auth/auth-service');
const { handleError, handleSuccess } = require('../util/controller-util');
const verificationError = {
  name: 'ValidationError',
  code: 422,
  message: 'The verification type doesn\'t exist'
};

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
    } else if (verifyType === verificationTypes.SMS) {
      verifySvc = authSvc.verifyPhone(userId, req.body);
    } else {
      handleError(verificationError, res, verificationError.message, error);
    }

    verifySvc
      .then(data => handleSuccess(res, 'Verification link sent successfully', data))
      .catch(err => handleError(err, res, err.message, error));
  },

  validateToken(req, res) {
    const { token, verifyType } = req.params;
    debug('Validate a token' + token);

    let validateSvc;
    if (verifyType === verificationTypes.Email) {
      validateSvc = authSvc.validateEmailToken(token);
    } else if (verifyType === verificationTypes.SMS) {
      validateSvc = authSvc.validatePhoneToken(token);
    } else {
      handleError(verificationError, res, verificationError.message, error);
    }

    validateSvc
      .then(user =>
        handleSuccess(res, 'Token validation successful', { user })
      )
      .catch(err =>
        handleError(err, res, 'Error validating token', error)
      );
  }
};
