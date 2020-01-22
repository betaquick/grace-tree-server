'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.alterTable('template', table => {
    table.text('description').notNullable();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.alterTable('template', table => {
    table.dropColumn('description');
  });
};
