'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.table('user_email', function(table) {
    table.string('verificationCode').nullable().alter();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('user_email', function(table) {
    table.string('verificationCode', 30).nullable().alter();
  });
};
