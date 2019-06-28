'use strict';

const _ = require('lodash');
const error = require('debug')('grace-tree:auth-service:error');
const debug = require('debug')('grace-tree:auth-service:debug');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const stringify = require('json-stringify-safe');
const moment = require('moment');

const { UserTypes } = require('@betaquick/grace-tree-constants');

const userData = require('../user/user-data');
const userService = require('../user/user-service');
const emailService = require('../messaging/email-service');
const smsService = require('../messaging/sms-service');

const {
  loginValidator,
  resetPasswordValidator,
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


function isUserValid(user) {
  if (!_.has(user, 'userId')) {
    throwError(422, 'Incorrect user credentials');
  }

  if (!user.active) {
    throwError(422, 'User\'s account has been disabled.');
  }
}

const login = async data => {
  const { email, password } = data;
  debug('Starting login process for email: ' + email);

  try {
    await Joi.validate(data, loginValidator);

    const user = await userData.getUserByParam(USER_TABLE, { email });
    isUserValid(user);

    const match = await bcrypt.compare(password, user.password);
    if (match) {
      const token = await generateTokenFromUser(user);
      return { token, user: await userService.getUserObject(user.userId) };
    }
    throwError(422, 'Incorrect login credentials');
  } catch (err) {
    error('Error logging in user', err);
    throw err;
  }
};

const forgotPassword = async data => {
  const { email } = data;
  debug('Starting reset process for email: ' + email);

  try {
    await Joi.validate(email, Joi.string().email().required());

    const user = await userData.getUserByParam(USER_TABLE, { email });
    if (!_.has(user, 'userId')) {
      throwError(422, 'Email address doesn\'t exist');
    }

    if (!user.active) {
      throwError(422, 'User\'s account has been disabled.');
    }

    const randomBytes = await randomBytesAsync(16);
    const token = randomBytes.toString('hex');
    const params = {
      resetPasswordToken: token,
      resetPasswordExpiry: moment().add(1, 'd').format('YYYY-MM-DD HH:mm:ss')
    };

    await userData.updateUserByParams(USER_TABLE, { userId: user.userId }, params);

    const options = {
      email,
      firstName: user.firstName,
      token
    };

    emailService.sendResetMail(options);

    return user.userId;
  } catch (err) {
    error('Error resetting password', err);
    throw err;
  }
};

const findUserByToken = async token => {
  try {
    await Joi.validate(token, Joi.string().required());

    const user = await userData.getUserByParam(USER_TABLE, { resetPasswordToken: token });
    isUserValid(user);

    if (moment().isAfter(user.resetPasswordExpiry)) {
      throwError(422, 'Token provided has expired');
    }

    return await userService.getUserObject(user.userId);
  } catch (err) {
    error('Error fetching user', err);
    throw err;
  }
};

const resetPassword = async data => {
  const { password, token } = data;
  debug('Starting reset process for token: ' + token);

  try {
    await Joi.validate(data, resetPasswordValidator);

    const user = await userData.getUserByParam(USER_TABLE, { resetPasswordToken: token });
    isUserValid(user);

    if (moment().isAfter(user.resetPasswordExpiry)) {
      throwError(422, 'Token provided has expired');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const params = {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpiry: null
    };
    await userData.updateUserByParams(USER_TABLE, { userId: user.userId }, params);

    return await userService.getUserObject(user.userId);
  } catch (err) {
    error('Error resetting password', err);
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

    const [userId] = await userData.insertUser(data);
    data.userId = userId;

    const token = await generateTokenFromUser(data);

    return { token, user: await userService.getUserObject(userId) };
  } catch (err) {
    error('Error registering user', err);
    throw err;
  }
};

const verifyEmail = async(userId, emailAddress, userType) => {
  debug('Starting validation process for email: ' + emailAddress + ' with userId: ' + userId);

  try {
    await Joi.validate({ userId, emailAddress }, emailValidator);

    const randomBytes = await randomBytesAsync(16);
    const token = randomBytes.toString('hex');
    const params = {
      emailAddress,
      verificationCode: token,
      verificationCodeExpiry: moment().add(1, 'd').format('YYYY-MM-DD HH:mm:ss')
    };

    await userData.updateUserByParams(USER_TABLE, { userId }, { email: emailAddress });
    await userData.updateUserByParams(USER_EMAIL_TABLE, { userId, primary: 1 }, params);

    const user = await userData.getUserByParam(USER_TABLE, { userId });

    const options = {
      email: emailAddress,
      token,
      path: (user.userType === UserTypes.General) ? 'user-registration' : 'company-registration'
    };

    emailService.sendVerificationMail(options);

    return userId;
  } catch (err) {
    error('Error verifying email', err);
    throw err;
  }
};

const verifyPhone = async(userId, phoneNumber, userType) => {
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

    const user = await userData.getUserByParam(USER_TABLE, { userId });

    const options = {
      phoneNumber,
      token,
      path: (user.userType === UserTypes.General) ? 'user-registration' : 'company-registration'
    };

    smsService.sendVerificationSMS(options);

    return userId;
  } catch (err) {
    error('Error verifying phone number', err);
    throw err;
  }
};

const notifyAdmin = async(userId, userData) => {
  const { email, firstName, lastName, phones } = userData;
  debug('Notifying admin of registration: ' + email + ' with userId: ' + userId);
  const phoneNumbers = phones.map(p => p.phoneNumber).join(', ');
  const options = {
    email,
    fullname: `${firstName} ${lastName}`,
    phoneNumbers
  };
  emailService.sendAdminNotificationOfRegistration(options);
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

    const userPhone = await userData.getUserPhone(email.userId);
    const userEmail = await userData.getUserEmail(email.userId);

    return { email: userEmail, phone: userPhone };
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

    const userEmail = await userData.getUserEmail(phone.userId);
    const userPhone = await userData.getUserPhone(phone.userId);

    return { email: userEmail, phone: userPhone };
  } catch (err) {
    error('Error validating email', err);
    throw err;
  }
};


module.exports = {
  login,
  forgotPassword,
  findUserByToken,
  resetPassword,
  register,
  verifyEmail,
  verifyPhone,
  validateEmailToken,
  validatePhoneToken,
  notifyAdmin
};
