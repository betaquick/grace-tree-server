'use strict';

const error = require('debug')('grace-tree:auth-service:error');
const debug = require('debug')('grace-tree:auth-service:debug');
const Joi = require('joi');

const userData = require('../user/user-data');
const {
  statusValidator
} = require('./user-validation');
const {
  USER_TABLE,
  USER_PROFILE_TABLE
} = require('../../../constants/table.constants');

const acceptAgreement = async userId => {
  debug('Accept agreement for ' + userId);

  try {
    await Joi.validate(userId, Joi.number().required());

    const where = {
      [`${USER_PROFILE_TABLE}.userId`]: userId
    };
    const user = await userData.getUserByParam(USER_TABLE, where);

    const params = {
      agreement: true
    };

    await userData.updateUserByParams(USER_PROFILE_TABLE, { userId }, params);
    return user;
  } catch (err) {
    error('Error accepting agreement', err);
    throw err;
  }
};

const updateStatus = async(userId, status) => {
  debug('Update status for ' + userId);

  try {
    await Joi.validate({ userId, status }, statusValidator);

    const where = {
      [`${USER_TABLE}.userId`]: userId
    };
    const user = await userData.getUserByParam(USER_TABLE, where);

    await userData.updateUserByParams(USER_PROFILE_TABLE, { userId }, { status });
    user.status = status;
    return user;
  } catch (err) {
    error('Error updating user status', err);
    throw err;
  }
};

module.exports = { acceptAgreement, updateStatus };
