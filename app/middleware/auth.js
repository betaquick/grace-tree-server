'use strict';

const debug = require('debug')('grace-tree:server:debug');
const error = require('debug')('grace-tree:server:error');

const jwt = require('jsonwebtoken');
const config = require('../config/config');
const userService = require('../services/user/user-service');

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
      const user = await userService.getUserObject(decoded.userId);
      debug(`Authorization success for ${user.email}`);

      if (!user) {
        error('Error: User not found');
        return res.status(404).send({
          status: 404,
          error: true,
          message: 'User not found'
        });
      }

      if (!user.active) {
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
