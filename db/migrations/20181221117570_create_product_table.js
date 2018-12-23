'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.createTable('product', function(table) {
    table.increments('productId').primary();
    table.string('productCode').notNullable();
    table.string('productDesc').notNullable();
    table.boolean('active').notNullable().defaultTo(true);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('product');
};
