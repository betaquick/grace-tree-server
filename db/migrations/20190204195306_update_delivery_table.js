'use strict';
exports.up = function(knex, Promise) {
  return knex.schema.table('delivery', function(table) {
    table.renameColumn('companyId', 'assignedToUserId');
    table.renameColumn('userId', 'assignedByUserId');
    table.string('statusCode', 4).nullable().after('additionalCompanyText');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('delivery', function(table) {
    table.renameColumn('companyId', 'assignedToUserId');
    table.renameColumn('companyId', 'assignedByUserId');
    table.dropColumn('statusCode');
  });
};
