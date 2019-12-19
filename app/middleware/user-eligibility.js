'use strict';
const error = require('debug')('grace-tree:middleware:role:error');
const { UserTypes } = require('@betaquick/grace-tree-constants');

const isAdmin = user => user.userType === UserTypes.TreeAdmin;

/**
 * Check to see if that user making the request is deactivating his account OR
 * Admin deactivating user NOT Admin account itself
 * @param {number} userId id of the user to be deactivated
 * @param {{userId}} reqUser user object of user making request
 * @returns {boolean} true if sanity checks fail
 */
const isNotOwnAccountOrAdminUserSelfDeleting = (userId, reqUser) =>
  (!isAdmin(reqUser) && reqUser.userId !== userId) || (isAdmin(reqUser) && userId === reqUser.userId);
/**
 * @module Middleware/UserEligibility
 *
 * @param {string} [userIdKey = userId] - User ID key in `req.params`
 *
 * Throws an error if user doesn't own resource
 * */
module.exports = (userIdKey, allowAdmin) => (exports[userIdKey] = function(req, res, next) {
  const userId = parseInt(req.params[userIdKey], 10);

  error(`Attempt to deactivate user #${userId} by user `, req.user);

  if (allowAdmin && !req.user) {
    error(500, 'Role middleware used before Auth Middleware');
    return res.status(500).send({
      status: 500,
      error: true,
      message: 'Oops! An error occurred!'
    });
  }

  if (isNotOwnAccountOrAdminUserSelfDeleting(userId, req.user)) {
    return res.status(403).send({
      status: 403,
      error: true,
      message: 'Sorry! You\'re not eligible to perform this action!'
    });
  }

  return next();
});
