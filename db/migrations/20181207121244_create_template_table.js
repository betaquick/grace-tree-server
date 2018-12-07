'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.createTable('template', function(table) {
    table.increments('templateId').primary();
    table.integer('userId').notNullable();
    table.text('content').notNullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('template');
};
