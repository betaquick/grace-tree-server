'use strict';

const knex = require('knex')(require('../../../db/knexfile').getKnexInstance());
const {
  PRODUCT_TABLE
} = require('../../../constants/table.constants');

module.exports = {
  getProducts() {
    return knex(PRODUCT_TABLE).where({ active: true }).select('*');
  }
};
