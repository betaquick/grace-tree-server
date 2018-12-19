'use strict';

const _ = require('lodash');
const error = require('debug')('grace-tree:auth-service:error');
const debug = require('debug')('grace-tree:auth-service:debug');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const stringify = require('json-stringify-safe');
const moment = require('moment');

const userData = require('../user/user-data');
const emailService = require('../util/email-service');
const smsService = require('../util/sms-service');

const {
  registrationValidator,
  emailValidator,
  phoneValidator
} = require('./auth-validator');
const { SECRET_KEY } = require('./../../config/config');
const { randomBytesAsync, throwError, isUserValid } = require('./../../controllers/util/controller-util');
const {
  USER_TABLE,
  USER_EMAIL_TABLE,
  USER_PHONE_TABLE
} = require('../../../constants/table.constants');

/**
 * create a JSON Web Token from the data model
 * */
const createJWT = model => {
  return jwt.sign(model, SECRET_KEY, {
    expiresIn: 60 * 60 * 24 // expires in a day
  });
};

/**
 * return token from user
 * */
const generateTokenFromUser = async user => {
  const tokenUser = _.pick(user, ['userId', 'email', 'firstName', 'lastName']);

  return createJWT({ ...tokenUser });
};

const register = async data => {
  const { password, emails } = data;
  debug('Starting registration process: ' + stringify(data));

  try {
    await Joi.validate(data, registrationValidator);

    const emailAddress = _.get(emails[0], 'emailAddress');
    const user = await userData.getUserByParam(USER_EMAIL_TABLE, { emailAddress });
    if (user) {
      throwError(422, 'Email address has already been taken');
    }

    data.password = await bcrypt.hash(password, 10);
    data.email = emailAddress;

    const userIds = await userData.insertUser(data);
    data.userId = userIds[0];

    const token = await generateTokenFromUser(data);

    return { token, userId: userIds[0] };
  } catch (err) {
    error('Error registering user', err);
    throw err;
  }
};

const verifyEmail = async(userId, data) => {
  const { emailAddress } = data;
  debug('Starting validation process for email: ' + emailAddress);

  try {
    await Joi.validate({ userId, emailAddress }, emailValidator);

    const randomBytes = await randomBytesAsync(10);
    const token = randomBytes.toString('hex');
    const params = {
      emailAddress,
      verificationCode: token,
      verificationCodeExpiry: moment().add(1, 'd').format('YYYY-MM-DD HH:mm:ss')
    };

    await userData.updateUserByParams(USER_TABLE, { userId }, { email: emailAddress });
    await userData.updateUserByParams(USER_EMAIL_TABLE, { userId, primary: 1 }, params);

    const options = {
      email: emailAddress,
      token
    };

    await emailService.sendVerificationMail(options);

    return userId;
  } catch (err) {
    error('Error verifying email', err);
    throw err;
  }
};

const verifyPhone = async(userId, data) => {
  const { phoneNumber } = data;
  debug('Starting validation process for phone: ' + phoneNumber);

  try {
    await Joi.validate({ userId, phoneNumber }, phoneValidator);

    const randomBytes = await randomBytesAsync(16);
    const token = randomBytes.toString('hex');
    const params = {
      phoneNumber,
      verificationCode: token,
      verificationCodeExpiry: moment().add(1, 'd').format('YYYY-MM-DD HH:mm:ss')
    };

    await userData.updateUserByParams(USER_PHONE_TABLE, { userId, primary: 1 }, params);

    const options = {
      phoneNumber,
      token
    };

    await smsService.sendVerificationSMS(options);

    return userId;
  } catch (err) {
    error('Error verifying phone number', err);
    throw err;
  }
};

const validateEmailToken = async token => {
  try {
    await Joi.validate(token, Joi.string().required());

    const user = await userData.getUserByParam(USER_EMAIL_TABLE, { verificationCode: token });
    isUserValid(user);

    if (moment().isAfter(user.verificationCodeExpiry)) {
      throwError(422, 'Token provided has expired');
    }

    const params = {
      verificationCode: null,
      verificationCodeExpiry: null,
      isVerified: true
    };
    const where = {
      userId: user.userId,
      emailAddress: user.emailAddress
    };
    await userData.updateUserByParams(USER_EMAIL_TABLE, where, params);

    return user;
  } catch (err) {
    error('Error validating email', err);
    throw err;
  }
};

const validatePhoneToken = async token => {
  try {
    await Joi.validate(token, Joi.string().required());

    const user = await userData.getUserByParam(USER_PHONE_TABLE, { verificationCode: token });
    isUserValid(user);

    if (moment().isAfter(user.verificationCodeExpiry)) {
      throwError(422, 'Token provided has expired');
    }

    const params = {
      verificationCode: null,
      verificationCodeExpiry: null,
      isVerified: true
    };
    const where = {
      userId: user.userId,
      phoneNumber: user.phoneNumber
    };
    await userData.updateUserByParams(USER_PHONE_TABLE, where, params);

    return user;
  } catch (err) {
    error('Error validating email', err);
    throw err;
  }
};


module.exports = { register, verifyEmail, verifyPhone, validateEmailToken, validatePhoneToken };
