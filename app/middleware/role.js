'use strict';

const error = require('debug')('grace-tree:middleware:role:error');

/**
 * @module Middleware/Role
 * @param {Array} roles - the roles of users to permit
 *
 * Sets and checks if the request has the specifies role
 * */
module.exports = (roles = []) => (exports[roles] = function(req, res, next) {
  if (!req.user) {
    error(500, 'Role middleware used before Auth Middleware');
    return res.status(500).send({
      status: 500,
      error: true,
      message: 'Oops! An error occurred!'
    });
  }

  let hasRole = roles.some(role => role === req.user.userType);
  if (hasRole) return next();

  return res.status(403).send({
    status: 403,
    error: true,
    message: 'Oops! You\'re not eligible to perform this action!'
  });

});
