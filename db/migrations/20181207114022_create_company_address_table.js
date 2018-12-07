'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.createTable('company_address', function(table) {
    table.increments('companyAddressId').primary();
    table.integer('companyId').notNullable();
    table.text('companyAddress').notNullable();
    table.string('city').notNullable();
    table.string('state').notNullable();
    table.string('zip').notNullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('company_address');
};
