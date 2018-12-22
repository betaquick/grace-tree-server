'use strict';

exports.seed = function(knex) {
  return knex('product')
    .truncate()
    .then(() => {
      return knex('product').insert([
        {productCode: 'chips', productDesc: 'Wood Chips'},
        {productCode: 'fillDirt', productDesc: 'Fill Dirt'},
        {productCode: 'grindings', productDesc: 'Grindings'},
        {productCode: 'logs', productDesc: 'Wood logs'},
        {productCode: 'pine', productDesc: 'Pine'},
        {productCode: 'poplar', productDesc: 'Poplar'},
        {productCode: 'rounds', productDesc: 'Rounds'}
      ]);
    });
};
