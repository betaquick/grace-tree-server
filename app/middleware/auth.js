'use strict';

const debug = require('debug')('grace-tree:server:debug');
const error = require('debug')('grace-tree:server:error');

const jwt = require('jsonwebtoken');
const config = require('../config/config');
const userData = require('../services/user/user-data');
const {
  USER_TABLE
} = require('../../constants/table.constants');

module.exports = function(req, res, next) {
  if (!req.headers.authorization) {
    error('Error: Authorization is not set in header');
    return res.status(401).send({
      status: 401,
      error: true,
      message: 'Please make sure your request has an Authorization header'
    });
  }

  const token = req.headers.authorization;

  // verifies secret and checks exp
  jwt.verify(token, config.SECRET_KEY, async(err, decoded) => {
    if (err) {
      error('Authentication failed');
      return res.status(401).send({
        status: 401,
        error: true,
        message: 'Failed to authenticate token'
      });
    } else {
      debug('Authorization success');
      // if everything is good, save to request for use in other routes

      const user = await userData.getUserByParam(USER_TABLE, { [`${USER_TABLE}.userId`]: decoded.userId });
      if (!user) {
        error('Error: User not found');
        return res.status(404).send({
          status: 404,
          error: true,
          message: 'User not found'
        });
      }

      if (user.active === 0) {
        error('Error: User\'s account has been disabled.');
        return res.status(422).send({
          status: 422,
          error: true,
          message: 'User\'s account has been disabled.'
        });
      }

      req.user = user;

      return next();
    }
  });
};
