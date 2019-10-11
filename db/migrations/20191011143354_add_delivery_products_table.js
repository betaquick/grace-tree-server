'use strict';

const { DELIVERY_PRODUCT_TABLE } = require('../../constants/table.constants');

exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists(DELIVERY_PRODUCT_TABLE, function(table) {
    table.increments('deliveryProductId').primary();
    table.integer('deliveryId').notNullable();
    table.integer('productId').notNullable();
    table.index(['deliveryId']);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table(DELIVERY_PRODUCT_TABLE, function(table) {
    table.dropIndex([ 'deliveryId' ]);
  })
    .then(() => knex.schema.dropTableIfExists(DELIVERY_PRODUCT_TABLE));
};
