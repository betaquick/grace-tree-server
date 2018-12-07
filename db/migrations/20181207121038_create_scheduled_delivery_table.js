'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.createTable('scheduled_delivery', function(table) {
    table.increments('deliveryId').primary();
    table.integer('userId').notNullable();
    table.integer('userAddressId').notNullable();
    table.string('deliveryPosition').notNullable();
    table.text('description').notNullable();
    table.boolean('selfPickup').defaultTo(false);
    table.string('deliveryStatus').notNullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('scheduled_delivery');
};
