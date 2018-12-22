'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.table('user_address', function(table) {
    table.renameColumn('userAddress', 'street');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('user_address', function(table) {
    table.renameColumn('street', 'userAddress');
  });
};
