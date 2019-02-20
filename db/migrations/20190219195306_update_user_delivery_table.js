'use strict';
exports.up = function(knex, Promise) {
  return knex.schema.table('user_delivery', function(table) {
    table.string('status', 4).nullable().after('deliveryId');
    table.timestamp('updatedAt').nullable().after('createdAt');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('user_delivery', function(table) {
    table.dropColumn('status');
    table.dropColumn('updatedAt');
  });
};
