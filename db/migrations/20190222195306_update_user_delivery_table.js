'use strict';
exports.up = function(knex, Promise) {
  return knex.schema.table('user_delivery', function(table) {
    table.boolean('isAssigned').notNullable().defaultTo(true).after('status');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('user_delivery', function(table) {
    table.dropColumn('isAssigned');
  });
};
