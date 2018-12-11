'use strict';

const debug = require('debug')('grace-tree:server:debug');
const error = require('debug')('grace-tree:server:error');

const jwt = require('jsonwebtoken');
const config = require('../config/config');

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
  jwt.verify(token, config.SECRET_KEY, function(err, decoded) {
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
      req.user = decoded;

      return next(req);
    }
  });
};
