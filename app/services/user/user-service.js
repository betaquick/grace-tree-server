'use strict';

const error = require('debug')('grace-tree:auth-service:error');
const debug = require('debug')('grace-tree:auth-service:debug');
const Joi = require('joi');
const bcrypt = require('bcryptjs');

const userData = require('../user/user-data');
const {
  statusValidator,
  businessInfoValidator,
  deliveryInfoValidator,
  userValidator
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

const editUser = async(userId, data) => {
  const { password } = data;
  try {
    await Joi.validate({ userId, ...data }, userValidator);

    data.password = await bcrypt.hash(password, 10);
    const userIds = await userData.editUser(userId, data);

    return userIds[0];
  } catch (err) {
    error('Error editing user ' + err.message);
    throw err;
  }
};

const addBusinessInfo = async(userId, data) => {
  try {
    await Joi.validate({ userId, ...data }, businessInfoValidator);

    const companyIds = await userData.addBusinessInfo(userId, data);

    return { companyId: companyIds[0], ...data };
  } catch (err) {
    error('Error updating business ' + err.message);
    throw err;
  }
};

const addDeliveryInfo = async(userId, data) => {
  try {
    await Joi.validate({ userId, ...data }, deliveryInfoValidator);

    const deliveryIds = await userData.addDeliveryInfo(userId, data);

    return { deliveryId: deliveryIds[0], ...data };
  } catch (err) {
    error('Error updating delivery info ' + err.message);
    throw err;
  }
};

module.exports = { acceptAgreement, updateStatus, editUser, addBusinessInfo, addDeliveryInfo };
