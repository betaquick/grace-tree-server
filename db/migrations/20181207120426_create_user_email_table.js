'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.createTable('user_email', function(table) {
    table.increments('userEmailId').primary();
    table.integer('userId').notNullable();
    table.string('emailAddress').notNullable();
    table.boolean('primary').defaultTo(false);
    table.boolean('isVerified').defaultTo(false);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('user_email');
};
