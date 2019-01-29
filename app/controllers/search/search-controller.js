'use strict';

const error = require('debug')('grace-tree:user-controller:error');
const debug = require('debug')('grace-tree:user-controller:debug');

const searchSvc = require('../../services/search/search-service');
const { handleError, handleSuccess } = require('../util/controller-util');

module.exports = {
  searchUsers(req, res) {
    const { address, radius } = req.query;

    debug(`Filter users in ${address} within ${radius}`);

    searchSvc
      .searchUsers(address, radius)
      .then(users =>
        handleSuccess(res, 'Filtered users successfully', { users })
      )
      .catch(err => handleError(err, res, 'Error filtering users', error));
  }
};
