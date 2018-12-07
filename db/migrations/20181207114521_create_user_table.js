'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.createTable('user', function(table) {
    table.increments('userId').primary();
    table.string('email').notNullable();
    table.string('password').notNullable();
    table.boolean('active').notNullable().defaultTo(true);
    table.string('userType').notNullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('user');
};
