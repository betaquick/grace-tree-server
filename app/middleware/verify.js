'use strict';

const debug = require('debug')('grace-tree:server:debug');
const error = require('debug')('grace-tree:server:error');
const stringify = require('json-stringify-safe');

const userData = require('../services/user/user-data');

module.exports = async function(req, res, next) {
  const { userId } = req.user;
  const params = {primary: 1};

  const email = await userData.getUserByParam('user_email', { 'user_email.userId': userId, ...params });
  const phone = await userData.getUserByParam('user_phone', { 'user_phone.userId': userId, ...params });

  if (email.isVerified === 1 && phone.isVerified === 1) {
    debug('Verification successful:', stringify(email), stringify(phone));
    return next();
  }

  error('Email verified status: ', Boolean(email.isVerified));
  error('Phone verified status: ', Boolean(phone.isVerified));

  return res.status(401).send({
    status: 401,
    error: true,
    body: {
      isEmailVerified: Boolean(email.isVerified),
      isPhoneVerified: Boolean(phone.isVerified),
      user: {
        ...req.user,
        emailAddress: email.emailAddress,
        phoneNumber: phone.phoneNumber
      }
    },
    message: 'Please verify your email and phone'
  });
};
