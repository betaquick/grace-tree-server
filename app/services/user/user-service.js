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
  userValidator,
  updateUserProductsValidator,
  crewValidator
} = require('./user-validation');
const {
  USER_TABLE,
  USER_PROFILE_TABLE,
  USER_COMPANY_TABLE
} = require('../../../constants/table.constants');
const { throwError } = require('./../../controllers/util/controller-util');

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

const getCompanyCrews = async userId => {
  await Joi.validate(userId, Joi.number().required());

  const user = await userData.getUserByParam(USER_COMPANY_TABLE, { [`${USER_COMPANY_TABLE}.userId`]: userId });
  const crews = await userData.getCompanyCrews(user.companyId);

  return crews;
};

const deleteCompanyCrew = async crewId => {
  debug('Delete crew for ' + crewId);

  try {
    await Joi.validate(crewId, Joi.number().required());

    await userData.updateUserByParams(USER_TABLE, { userId: crewId }, { active: false });
    return crewId;
  } catch (err) {
    error('Error deleting crew', err);
    throw err;
  }
};

const addCompanyCrew = async(userId, data) => {
  const { password, email } = data;

  try {
    await Joi.validate({ userId, ...data }, crewValidator);

    const user = await userData.getUserByParam(USER_TABLE, { email });
    if (user) {
      debug('Email address has already been taken');
      throwError(422, 'Email address has already been taken');
    }

    data.password = await bcrypt.hash(password, 10);

    const company = await userData.getUserByParam(USER_COMPANY_TABLE, { [`${USER_COMPANY_TABLE}.userId`]: userId });
    data.companyId = company.companyId;

    const userIds = await userData.addCompanyCrew(data);
    return userIds[0];
  } catch (err) {
    error('Error creating company crew', err);
    throw err;
  }
};

const getUserProducts = async userId => {
  await Joi.validate(userId, Joi.number().required());
  const userProducts = await userData.getUserProducts(userId);

  return userProducts;
};

const updateUserProducts = async(userId, userProducts) => {
  try {
    await Joi.validate({ userId, userProducts }, updateUserProductsValidator);
    await userData.updateUserProducts(userId, userProducts);

    return await userData.getUserProducts(userId);
  } catch (err) {
    error('Error updating user products ' + err.message);
    throw err;
  }
};

module.exports = {
  acceptAgreement,
  updateStatus,
  editUser,
  addCompanyInfo,
  updateCompanyInfo,
  addDeliveryInfo,
  getCompanyInfo,
  addCompanyCrew,
  getCompanyCrews,
  deleteCompanyCrew,
  getUserProducts,
  updateUserProducts
};
