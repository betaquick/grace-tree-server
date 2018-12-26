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
  loginValidator,
  registrationValidator,
  emailValidator,
  phoneValidator
} = require('./auth-validator');
const { SECRET_KEY } = require('./../../config/config');
const { randomBytesAsync, throwError } = require('./../../controllers/util/controller-util');
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

// Santize user details for the UI
function sanitizeUser(user) {
  return {
    email: user.email,
    emails: user.emails,
    firstName: user.firstName,
    lastName: user.lastName,
    phones: user.phones,
    userId: user.userId,
    userType: user.userType
  };
}

const login = async data => {
  const { email, password } = data;
  debug('Starting login process for email: ' + email);

  try {
    await Joi.validate(data, loginValidator);

    const user = await userData.getUserByParam(USER_TABLE, { email });

    if (!_.has(user, 'userId')) {
      throwError(422, 'Incorrect login credentials');
    }

    if (!user.active) {
      throwError(422, 'User\'s account has been disabled.');
    }
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      const token = await generateTokenFromUser(user);
      return { token, user: sanitizeUser(user) };
    }
    throwError(422, 'Incorrect login credentials');
  } catch (err) {
    error('Error logging in user', err);
    throw err;
  }
};

const register = async data => {
  const { password, emails } = data;
  debug('Starting registration process: ' + stringify(data));

  try {
    await Joi.validate(data, registrationValidator);

    const emailAddress = _.get(emails[0], 'emailAddress');
    const user = await userData.getUserByParam(USER_EMAIL_TABLE, { emailAddress });
    if (user) {
      debug('Email address has already been taken');
      throwError(422, 'Email address has already been taken');
    }

    data.password = await bcrypt.hash(password, 10);
    data.email = emailAddress;

    const userIds = await userData.insertUser(data);
    data.userId = userIds[0];

    const token = await generateTokenFromUser(data);

    return { token, user: sanitizeUser(data) };
  } catch (err) {
    error('Error registering user', err);
    throw err;
  }
};

const verifyEmail = async(userId, emailAddress) => {
  debug('Starting validation process for email: ' + emailAddress + ' with userId: ' + userId);

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

const verifyPhone = async(userId, phoneNumber) => {
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

    const email = await userData.getUserByParam(USER_EMAIL_TABLE, { verificationCode: token });

    if (!_.has(email, 'verificationCodeExpiry')) {
      throwError(422, 'Token is not valid');
    }

    if (moment().isAfter(email.verificationCodeExpiry)) {
      throwError(422, 'Token provided has expired');
    }

    const params = {
      verificationCode: null,
      verificationCodeExpiry: null,
      isVerified: true
    };
    const where = {
      userId: email.userId,
      emailAddress: email.emailAddress
    };
    await userData.updateUserByParams(USER_EMAIL_TABLE, where, params);

    return email;
  } catch (err) {
    error('Error validating email', err);
    throw err;
  }
};

const validatePhoneToken = async token => {
  try {
    await Joi.validate(token, Joi.string().required());

    const phone = await userData.getUserByParam(USER_PHONE_TABLE, { verificationCode: token });

    if (!_.has(phone, 'verificationCodeExpiry')) {
      throwError(422, 'Token is not valid');
    }

    if (moment().isAfter(phone.verificationCodeExpiry)) {
      throwError(422, 'Token provided has expired');
    }

    const params = {
      verificationCode: null,
      verificationCodeExpiry: null,
      isVerified: true
    };
    const where = {
      userId: phone.userId,
      phoneNumber: phone.phoneNumber
    };
    await userData.updateUserByParams(USER_PHONE_TABLE, where, params);

    return phone;
  } catch (err) {
    error('Error validating email', err);
    throw err;
  }
};


module.exports = { login, register, verifyEmail, verifyPhone, validateEmailToken, validatePhoneToken };
