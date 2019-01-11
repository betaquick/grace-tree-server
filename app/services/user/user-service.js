'use strict';

const error = require('debug')('grace-tree:auth-service:error');
const debug = require('debug')('grace-tree:auth-service:debug');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const _ = require('lodash');

const userData = require('../user/user-data');
const {
  statusValidator,
  businessInfoValidator,
  updateBusinessValidator,
  deliveryInfoValidator,
  userValidator
} = require('./user-validation');
const {
  USER_TABLE,
  USER_PROFILE_TABLE,
  USER_COMPANY_TABLE
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
  const { emails, password } = data;
  try {
    await Joi.validate({ userId, ...data }, userValidator);

    const emailAddress = _.get(emails[0], 'emailAddress');

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }
    data.email = emailAddress;

    await userData.editUser(userId, data);

    const user = await userData.getUserByParam(USER_TABLE, { email: emailAddress });

    return {
      userId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      emails,
      phones: data.phones,
      userType: user.userType
    };
  } catch (err) {
    error('Error editing user ' + err.message);
    throw err;
  }
};

const addCompanyInfo = async(userId, data) => {
  try {
    await Joi.validate({ userId, ...data }, businessInfoValidator);

    const companyIds = await userData.addCompanyInfo(userId, data);

    return { companyId: companyIds[0], ...data };
  } catch (err) {
    error('Error updating business ' + err.message);
    throw err;
  }
};

const updateCompanyInfo = async(userId, company) => {
  try {
    await Joi.validate({ userId, ...company }, updateBusinessValidator);

    await userData.updateCompanyInfo(company);

    return company;
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

const getCompanyInfo = async userId => {
  await Joi.validate(userId, Joi.number().required());
  const user = await userData.getUserByParam(USER_COMPANY_TABLE, { [`${USER_COMPANY_TABLE}.userId`]: userId });
  const businessInfo = await userData.getCompanyInfo(user.companyId);

  return businessInfo;
};

module.exports = { acceptAgreement, updateStatus, editUser, addCompanyInfo, updateCompanyInfo, addDeliveryInfo, getCompanyInfo };
