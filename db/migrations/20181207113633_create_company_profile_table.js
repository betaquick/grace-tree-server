'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.createTable('company_profile', function(table) {
    table.increments('companyId').primary();
    table.string('companyName').notNullable();
    table.string('website').nullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('company_profile');
};
