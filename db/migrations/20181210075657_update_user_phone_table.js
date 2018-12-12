'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.table('user_phone', function(table) {
    table.string('verificationCode', 30).nullable().after('phoneType');
    table.timestamp('verificationCodeExpiry').nullable().after('verificationCode');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('user_phone', function(table) {
    table.dropColumn('verificationCode');
  });
};
