'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.table('user', function(table) {
    table.string('resetPasswordToken').nullable().after('userType');
    table.timestamp('resetPasswordExpiry').nullable().after('resetPasswordToken');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('user', function(table) {
    table.dropColumn('resetPasswordToken');
    table.dropColumn('resetPasswordExpiry');
  });
};
