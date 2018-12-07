'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.createTable('user_profile', function(table) {
    table.increments('profileId').primary();
    table.integer('userId').notNullable();
    table.string('firstName').notNullable();
    table.string('lastName').notNullable();
    table.text('comment').nullable();
    table.string('status').notNullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('user_profile');
};
