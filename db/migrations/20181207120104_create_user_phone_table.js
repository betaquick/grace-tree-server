'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.createTable('user_phone', function(table) {
    table.increments('userPhoneId').primary();
    table.integer('userId').notNullable();
    table.string('phoneNumber').notNullable();
    table.boolean('primary').defaultTo(false);
    table.string('phoneType').notNullable();
    table.boolean('isVerified').defaultTo(false);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('user_phone');
};
