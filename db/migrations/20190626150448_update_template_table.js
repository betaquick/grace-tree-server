'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.table('template', table => {
    table.string('name').notNullable();
    table.boolean('public').notNullable().defaultTo(false);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('template', table => {
    table.dropColumn('name');
    table.dropColumn('public');
  });
};
