'use strict';

/**
 * @module Middleware/UserEligibility
 *
 * @param {string} [userIdKey = userId] - User ID key in `req.params`
 *
 * Throws an error if user doesn't own resource
 * */
module.exports = (userIdKey) => (exports[userIdKey] = function(req, res, next) {
  const userId = parseInt(req.params[userIdKey], 10);

  if (req.user.userId !== userId) {
    return res.status(403).send({
      status: 403,
      error: true,
      message: 'Sorry! You\'re not eligible to perform this action!'
    });
  }

  return next();
});
