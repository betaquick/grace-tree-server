'use strict';

const error = require('debug')('grace-tree:user-controller:error');
const debug = require('debug')('grace-tree:user-controller:debug');
const stringify = require('json-stringify-safe');

const userSvc = require('../../services/user/user-service');
const { handleError, handleSuccess } = require('../util/controller-util');

module.exports = {
  onboarding(req, res) {
    const { user } = req;
    handleSuccess(res, 'Onboarding loaded successful', { user });
  },

  acceptAgreement(req, res) {
    const { userId } = req.user;
    userSvc
      .acceptAgreement(userId)
      .then(user => handleSuccess(res, 'Agreement accepted successful', { user }))
      .catch(err => handleError(err, res, err.message, error));
  },

  updateStatus(req, res) {
    const { status } = req.params;
    const { userId } = req.user;
    userSvc
      .updateStatus(userId, status)
      .then(user => handleSuccess(res, 'User status updated successful', { user }))
      .catch(err => handleError(err, res, err.message, error));
  },

  updateProfile(req, res) {
    const { userId } = req.user;
    const { body } = req;

    debug('Updating user with data: ', stringify(body));

    userSvc
      .editUser(userId, body)
      .then(user =>
        handleSuccess(res, 'User updated successfully', { user })
      )
      .catch(err => handleError(err, res, 'Error updating user', error));
  }
};
