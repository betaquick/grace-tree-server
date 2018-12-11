'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.table('user_email', function(table) {
    table.string('verificationCode', 30).nullable().after('primary');
    table.timestamp('verificationCodeExpiry').nullable().after('verificationCode');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('user_email', function(table) {
    table.dropColumn('verificationCode');
  });
};
