'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.table('user_profile', function(table) {
    table.boolean('agreement').notNullable().defaultTo(false).after('status');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('user_profile', function(table) {
    table.dropColumn('agreement');
  });
};
