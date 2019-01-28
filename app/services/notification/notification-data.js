'use strict';

const knex = require('knex')(require('../../../db/knexfile').getKnexInstance());
const {
  NOTIFICATION_TABLE,
  USER_PROFILE_TABLE
} = require('../../../constants/table.constants');

const notificationData = {
  getNotifications(sender) {
    return knex(NOTIFICATION_TABLE)
      .where({ sender })
      .join(USER_PROFILE_TABLE, `${NOTIFICATION_TABLE}.recipient`, '=', `${USER_PROFILE_TABLE}.userId`);
  },

  getRecipientNotifications(recipient) {
    return knex(NOTIFICATION_TABLE)
      .where({ recipient })
      .join(USER_PROFILE_TABLE, `${NOTIFICATION_TABLE}.sender`, '=', `${USER_PROFILE_TABLE}.userId`);
  },

  getNotification(notificationId) {
    return knex(NOTIFICATION_TABLE)
      .first()
      .where({ notificationId })
      .join(USER_PROFILE_TABLE, `${NOTIFICATION_TABLE}.sender`, '=', `${USER_PROFILE_TABLE}.userId`);
  },

  addNotification(notification) {
    return knex.transaction(trx =>
      knex(NOTIFICATION_TABLE)
        .transacting(trx)
        .insert(notification)
        .then(trx.commit)
        .catch(trx.rollback)
    );
  },

  updateReadReceipt(notificationId) {
    return knex(NOTIFICATION_TABLE)
      .where({ notificationId })
      .update({ read: true });
  }
};

module.exports = notificationData;
