'use strict';

const knex = require('knex')(require('../../../db/knexfile').getKnexInstance());
const { TEMPLATE_TABLE } = require('../../../constants/table.constants');

module.exports = {
  listTemplates(userId) {
    return knex(TEMPLATE_TABLE)
      .where({ userId })
      .orWhere({ public: 1 })
      .select('*');
  },

  getTemplate(condition) {
    return knex(TEMPLATE_TABLE)
      .first()
      .where(condition);
  },

  insertTemplate(template) {
    return knex(TEMPLATE_TABLE)
      .insert(template);
  },

  updateTemplate(templateId, template) {
    return knex(TEMPLATE_TABLE)
      .where({ templateId })
      .update(template);
  }
};
