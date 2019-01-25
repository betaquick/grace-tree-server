'use strict';
exports.up = function(knex, Promise) {
  return knex.schema.createTable('deliveries', function(table) {
    table.increments('deliveryId').primary();
    table.integer('companyId').notNullable();
    table.text('details');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('deliveries');
};
