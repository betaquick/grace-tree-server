'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.table('user_profile', table => {
    table.boolean('getEstimateInfo').notNullable().defaultTo(false);
    table.text('service_needs');
    table.boolean('self_pickup').notNullable().defaultTo(false);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('user_profile', table => {
    table.dropColumn('getEstimateInfo');
    table.dropColumn('service_needs');
    table.dropColumn('self_pickup');
  });
};
