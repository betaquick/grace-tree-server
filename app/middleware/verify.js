'use strict';

const debug = require('debug')('grace-tree:server:debug');
const error = require('debug')('grace-tree:server:error');
const _ = require('lodash');
const { UserTypes } = require('@betaquick/grace-tree-constants');

module.exports = async function(req, res, next) {
  const { user } = req;

  if (user.userType === UserTypes.Crew) {
    debug('Crew verification successful');
    return next();
  }

  const emailVerified = _.find(user.emails, e => e.isVerified);
  const phoneVerified = _.find(user.phones, p => p.isVerified);

  if (emailVerified && phoneVerified) {
    debug('User phone and email verified');
    return next();
  }


  error('Email verified status: ', (emailVerified) ? 'verified' : 'verified');
  error('Phone verified status: ', (phoneVerified) ? 'verified' : 'verified');

  let isEmailVerified;
  let isPhoneVerified;

  if (emailVerified) {
    isEmailVerified = true;
  } else {
    isEmailVerified = false;
  }

  if (phoneVerified) {
    isPhoneVerified = true;
  } else {
    isPhoneVerified = false;
  }

  return res.status(401).send({
    status: 401,
    error: true,
    body: {
      isEmailVerified,
      isPhoneVerified,
      user
    },
    message: 'Please verify your email and phone'
  });
};
