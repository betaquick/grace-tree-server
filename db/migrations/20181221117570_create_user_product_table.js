'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.createTable('user_product', function(table) {
    table.increments('userProductId').primary();
    table.integer('userId').notNullable();
    table.integer('productId').notNullable();
    table.boolean('status').notNullable().defaultTo(false);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('user_product');
};
