'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.table('template', table => {
    table.dropColumn('name');
    table.dropColumn('public');
    table.string('notificationType');
    table.renameColumn('content', 'message');
    table.renameColumn('userId', 'companyId');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('template', table => {
    table.string('name').notNullable();
    table.boolean('public').notNullable().defaultTo(false);
    table.dropColumn('notificationType');
    table.renameColumn('message', 'content');
    table.renameColumn('companyId', 'userId');
  });
};
