'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.table('company_address', function(table) {
    table.string('latitude').nullable().after('zip');
    table.string('longitude').nullable().after('latitude'); ;
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('company_address', function(table) {
    table.dropColumn('latitude');
    table.dropColumn('longitude');
  });
};
