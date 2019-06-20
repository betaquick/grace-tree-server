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

  forgotPassword(req, res) {
    authSvc
      .forgotPassword(req.body)
      .then(() => handleSuccess(res, `An e-mail has been sent to ${req.body.email} with further instructions.`))
      .catch(err => handleError(err, res, err.message, error));
  },

  getUserByToken(req, res) {
    const token = req.params.token;

    debug('Retrieve a user' + token);

    authSvc
      .findUserByToken(token)
      .then(user =>
        handleSuccess(res, 'Get user successful', { user })
      )
      .catch(err =>
        handleError(err, res, 'Error fetching user', error)
      );
  },

  resetPassword(req, res) {
    authSvc
      .resetPassword(req.body)
      .then(() => handleSuccess(res, 'Password reset successfully'))
      .catch(err => handleError(err, res, err.message, error));
  },

  register(req, res) {
    const { body } = req;
    const email = _.get(body, 'emails[0].emailAddress');
    const phone = _.get(body, 'phones[0].phoneNumber');
    const userType = _.get(body, 'userType');

    authSvc
      .register(body)
      .then(async data => {
        try {
          const userId = _.get(data, 'user.userId');
          debug('setting up email verification');
          await authSvc.verifyEmail(userId, email, userType);

          debug('setting up phone verification');
          await authSvc.verifyPhone(userId, phone, userType);

          debug('Verification link sent successfully');

          await authSvc.notifyAdmin(userId, data.user);

          // send back result
          return handleSuccess(res, 'Registration successful', data);

        } catch (err) {
          error('Error sending verification for Email/Phone: ', err);
        }

      })
      .catch(err => handleError(err, res, err.message, error));
  },

  verify(req, res) {
    const { userId } = req.user;
    const body = req.body;
    const { verifyType } = body;

    let verifySvc;
    if (verifyType === verificationTypes.Email) {
      const email = _.get(body, 'body.emailAddress');
      verifySvc = authSvc.verifyEmail(userId, email);
    } else if (verifyType === verificationTypes.SMS) {
      const phone = _.get(body, 'body.phoneNumber');
      verifySvc = authSvc.verifyPhone(userId, phone);
    } else {
      return handleError(verificationError, res, verificationError.message, error);
    }

    verifySvc
      .then(user =>
        handleSuccess(res, 'Verification sent successful', { user })
      )
      .catch(err =>
        handleError(err, res, 'Error sending verification for Email/Phone', error)
      );
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
