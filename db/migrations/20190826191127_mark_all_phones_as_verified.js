'use strict';

exports.up = function(knex, Promise) {
  return knex('user_phone')
    .update({ isVerified: 1 });
};

exports.down = function(knex, Promise) {
};
