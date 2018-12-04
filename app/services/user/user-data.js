'use strict';
const _ = require('lodash');

const knex = require('knex')(require('../../../db/knexfile').getKnexInstance());

module.exports = {
  getUserWithSecrets(param) {
    return knex('user')
      .first()
      .where(param);
  }
};
