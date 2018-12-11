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
  registerationValidator,
  emailValidator,
  phoneValidator
} = require('./auth-validator');
const { SECRET_KEY } = require('./../../config/config');
const { randomBytesAsync, throwError } = require('./../../controllers/util/controller-util');

const USER_EMAIL = 'user_email';
const USER_PHONE = 'user_phone';

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
  debug('Starting registration process: ' + stringify(data));

  try {
    await Joi.validate(data, registerationValidator);

    const emailAddress = _.get(data.emails[0], 'emailAddress');
    let user = await userData.getUserByParam(USER_EMAIL, { emailAddress });
    if (user) {
      throwError(422, 'Email address has already been taken');
    }

    const randomBytes = await randomBytesAsync(16);
    const hex = randomBytes.toString('hex');
    data.password = await bcrypt.hash(hex, 10);
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

    await userData.updateUserByParams('user', { userId }, { email: emailAddress });
    await userData.updateUserByParams(USER_EMAIL, { userId, primary: 1 }, params);

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

    await userData.updateUserByParams(USER_PHONE, { userId, primary: 1 }, params);

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

module.exports = { register, verifyEmail, verifyPhone };
