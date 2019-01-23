
exports.up = function(knex, Promise) {
  return knex.schema.createTable('user_deliveries', function (table) {
      table.integer('userId').notNullable();
      table.integer('deliveryId').notNullable();
      table.unique(['userId', 'deliveryId']);
      table.timestamp('createdAt').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists('user_deliveries');
};
