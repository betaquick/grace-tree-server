'use strict';

const debug = require('debug')('grace-tree:server:debug');
const error = require('debug')('grace-tree:server:error');
const stringify = require('json-stringify-safe');

const auth = require('./auth');
const userData = require('../services/user/user-data');

module.exports = function(req, res, next) {
  req.fromVerify = true;

  auth(req, res, async request => {
    const { userId } = request.user;
    const params = {
      primary: 1
    };
    const email = await userData.getUserByParam('user_email', { 'user_email.userId': userId, ...params });
    const phone = await userData.getUserByParam('user_phone', { 'user_phone.userId': userId, ...params });

    if (email.isVerified === 1 && phone.isVerified === 1) {
      debug('Verification successful:', stringify(email), stringify(phone));
      return next();
    }

    error('Email verified:', email.isVerified === 1);
    error('Phone verified:', phone.isVerified === 1);
    return res.status(401).send({
      status: 401,
      error: true,
      body: {
        isEmailVerified: email.isVerified === 1,
        isPhoneVerified: phone.isVerified === 1,
        user: {
          ...req.user,
          emailAddress: email.emailAddress,
          phoneNumber: phone.phoneNumber
        }
      },
      message: 'Please verify your email or phone'
    });
  });
};
