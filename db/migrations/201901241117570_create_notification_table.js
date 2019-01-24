'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.createTable('notification', function(table) {
    table.increments('notificationId').primary();
    table.integer('sender').notNullable();
    table.integer('recipient').notNullable();
    table.text('message').notNullable();
    table.boolean('read').defaultTo(false);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('notification');
};
