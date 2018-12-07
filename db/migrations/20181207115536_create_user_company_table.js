'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.createTable('user_company', function(table) {
    table.increments('userCompanyId').primary();
    table.integer('userId').notNullable();
    table.integer('companyId').notNullable();
    table.string('userRole').notNullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('user_company');
};
