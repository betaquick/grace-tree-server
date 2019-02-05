'use strict';

const { DeliveryStatusCodes } = require('@betaquick/grace-tree-constants');

const knex = require('knex')(require('../../../db/knexfile').getKnexInstance());
const {
  DELIVERY_TABLE,
  USER_DELIVERY_TABLE
} = require('../../../constants/table.constants');

module.exports = {
  getDeliveries(assignedByUserId) {
    return knex(DELIVERY_TABLE)
      .where({ assignedByUserId })
      .select('*');
  },

  getSingleDelivery(deliveryId) {
    return knex(DELIVERY_TABLE)
      .where({ deliveryId: deliveryId })
      .first()
      .select('*');
  },

  addDelivery(deliveryInfo, trx) {
    const {
      assignedToUserId,
      assignedByUserId,
      details,
      additionalCompanyText,
      additionalRecipientText,
      users
    } = deliveryInfo;
    let deliveryId;
    return knex(DELIVERY_TABLE)
      .transacting(trx)
      .insert({
        assignedToUserId,
        assignedByUserId,
        details,
        additionalRecipientText,
        additionalCompanyText,
        statusCode: DeliveryStatusCodes.Scheduled
      })
      .then(deliveryIds => {
        deliveryId = deliveryIds[0];
        const userDeliveries = users.map(user => { return { deliveryId, userId: user }; });
        return knex(USER_DELIVERY_TABLE).transacting(trx).insert(userDeliveries);
      });
  },

  updateDelivery(deliveryInfo, trx) {
    const {
      deliveryId,
      details,
      additionalCompanyText,
      additionalRecipientText
    } = deliveryInfo;

    return knex(DELIVERY_TABLE)
      .transacting(trx)
      .where({ deliveryId })
      .update({ details, additionalRecipientText, additionalCompanyText });
  },

  addUserToDelivery(deliveryId, userId, trx) {
    return knex(USER_DELIVERY_TABLE)
      .transacting(trx)
      .insert({ deliveryId, userId });
  },

  removeUserFromDelivery(deliveryId, userId, trx) {
    return knex(USER_DELIVERY_TABLE)
      .transacting(trx)
      .where({ deliveryId, userId })
      .del();
  },

  deleteDelivery(deliveryId, trx) {
    return knex(DELIVERY_TABLE)
      .transacting(trx)
      .where({ deliveryId })
      .del()
      .then(() => knex(USER_DELIVERY_TABLE).transacting(trx).where({ deliveryId }).del());
  }

};
