'use strict';

const _ = require('lodash');
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
  login(req, res) {
    authSvc
      .login(req.body)
      .then(token => handleSuccess(res, 'Login successful', token))
      .catch(err => handleError(err, res, err.message, error));
  },

  register(req, res) {
    const {body} = req;
    const email = _.get(body, 'emails[0].emailAddress');
    const phone = _.get(body, 'phones[0].phoneNumber');

    authSvc
      .register(body)
      .then(async data => {
        try {
          debug('setting up email verification');
          await authSvc.verifyEmail(data.userId, email);

          debug('setting up phone verification');
          await authSvc.verifyPhone(data.userId, phone);

          debug('Verification link sent successfully');

          // send back result
          return handleSuccess(res, 'Registration successful', data);

        } catch (err) {
          error('Error sending verification for Email/Phone: ', err);
        }

      })
      .catch(err => handleError(err, res, err.message, error));
  },

  validateToken(req, res) {
    const { token, verifyType } = req.params;
    debug('Validate a token: ' + token + ' with type: ' + verifyType);

    let validateSvc;
    if (verifyType === verificationTypes.Email) {
      validateSvc = authSvc.validateEmailToken(token);
    } else if (verifyType === verificationTypes.SMS) {
      validateSvc = authSvc.validatePhoneToken(token);
    } else {
      return handleError(verificationError, res, verificationError.message, error);
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
