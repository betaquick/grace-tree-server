'use strict';

const error = require('debug')('grace-tree:user-controller:error');

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
  }
};
