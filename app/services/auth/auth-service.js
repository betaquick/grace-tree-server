'use strict';

const _ = require('lodash');
const error = require('debug')('grace-tree:auth-service:error');
const debug = require('debug')('grace-tree:auth-service:debug');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const bcrypt = require('bcryptjs');

const User = require('../user/user-data');

const { loginValidator } = require('./auth-validator');
const { SECRET_KEY } = require('./../../config/config');
const { throwError, isUserValid } = require('./../../controllers/util/controller-util');

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
  const roles = await User.getUserRoles(user.userId);
  const tokenUser = _.pick(user, ['user_id', 'email', 'first_name', 'last_name', 'created_at']);

  return createJWT({ roles, ...tokenUser });
};

const login = async data => {
  const { email, password } = data;
  debug('Starting login process for email: ' + email);

  try {
    await Joi.validate(data, loginValidator);

    let user = await User.getUserWithSecrets({ email });
    isUserValid(user);

    const match = await bcrypt.compare(password, user.password);
    if (match) {
      const token = await generateTokenFromUser(user);
      user = _.omit(user, ['password']);

      return { token, user };
    }
    throwError(422, 'Password mismatch');
  } catch (err) {
    error('Error logging in user', err);
    throw err;
  }
};

module.exports = { login };
