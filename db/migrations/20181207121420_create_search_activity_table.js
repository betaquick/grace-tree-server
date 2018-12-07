'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.createTable('search_activity', function(table) {
    table.increments('searchId').primary();
    table.integer('userId').notNullable();
    table.string('paramType').notNullable();
    table.text('searchParam').notNullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('search_activity');
};
