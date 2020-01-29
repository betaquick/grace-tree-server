'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.table('product', function(table) {
    table.integer('order').nullable().after('active');
    table.string('hint').nullable().after('productDesc');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('product', function(table) {
    table.dropColumn('order');
    table.dropColumn('hint');
  });
};
