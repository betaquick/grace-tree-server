'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.createTable('user_address', function(table) {
    table.increments('userAddressId').primary();
    table.integer('userId').notNullable();
    table.text('userAddress').notNullable();
    table.string('city').notNullable();
    table.string('state').notNullable();
    table.string('zip').notNullable();
    table.text('deliveryInstruction').nullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('user_address');
};
