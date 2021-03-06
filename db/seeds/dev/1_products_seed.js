'use strict';

const {
  CHIPS, FILLDIRT, GRINDINGS,
  LOGS, PINE, POPLAR, ROUNDS
} = require('../../../constants/products.constants');

exports.seed = function(knex) {
  return knex('product')
    .truncate()
    .then(() => {
      return knex('product').insert([
        {productCode: CHIPS, productDesc: 'Chips'},
        {productCode: FILLDIRT, productDesc: 'Fill Dirt'},
        {productCode: GRINDINGS, productDesc: 'Grindings'},
        {productCode: LOGS, productDesc: 'Logs'},
        {productCode: PINE, productDesc: 'Pine'},
        {productCode: POPLAR, productDesc: 'Poplar'},
        {productCode: ROUNDS, productDesc: 'Rounds'}
      ]);
    });
};
