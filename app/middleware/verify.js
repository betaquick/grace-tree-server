'use strict';

const debug = require('debug')('grace-tree:server:debug');
const error = require('debug')('grace-tree:server:error');
const stringify = require('json-stringify-safe');

const auth = require('./auth');
const userData = require('../services/user/user-data');

module.exports = function(req, res, next) {
  auth(req, res, async request => {
    const { userId } = request.user;
    const params = {
      userId,
      primary: 1,
      isVerified: 1
    };
    const emailVerification = await userData.getUserByParam('user_email', params);
    const phoneVerification = await userData.getUserByParam('user_phone', params);

    if (emailVerification && phoneVerification) {
      debug('Verification successful:', stringify(emailVerification), stringify(phoneVerification));
      return next();
    }
    
    error('Email verified:', !!emailVerification);
    error('Phone verified:', !!phoneVerification);
    return res.status(401).send({
      status: 401,
      error: true,
      body: {
        isEmailVerified: !!emailVerification,
        isPhoneVerified: !!phoneVerification,
        user: req.user
      },
      message: 'Please verify your email or phone'
    });
  });
};
