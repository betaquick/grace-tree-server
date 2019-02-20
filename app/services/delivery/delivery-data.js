'use strict';

const { DeliveryStatusCodes } = require('@betaquick/grace-tree-constants');

const knex = require('knex')(require('../../../db/knexfile').getKnexInstance());
const {
  DELIVERY_TABLE,
  USER_DELIVERY_TABLE,
  USER_PROFILE_TABLE,
  USER_COMPANY_TABLE,
  COMPANY_PROFILE_TABLE
} = require('../../../constants/table.constants');

module.exports = {
  getDeliveries(assignedByUserId) {
    return knex(DELIVERY_TABLE)
      .where({ assignedByUserId })
      .join(USER_DELIVERY_TABLE, `${DELIVERY_TABLE}.deliveryId`, '=', `${USER_DELIVERY_TABLE}.deliveryId`)
      .join(USER_PROFILE_TABLE, `${USER_DELIVERY_TABLE}.userId`, '=', `${USER_PROFILE_TABLE}.userId`);
  },

  getCompanyPendingDeliveries(assignedByUserId) {
    return knex(DELIVERY_TABLE)
      .where({
        assignedByUserId,
        statusCode: DeliveryStatusCodes.Scheduled
      })
      .join(USER_DELIVERY_TABLE, `${DELIVERY_TABLE}.deliveryId`, '=', `${USER_DELIVERY_TABLE}.deliveryId`)
      .join(USER_PROFILE_TABLE, `${USER_DELIVERY_TABLE}.userId`, '=', `${USER_PROFILE_TABLE}.userId`);
  },

  getCompanyRecentDeliveries(assignedByUserId) {
    return knex(DELIVERY_TABLE)
      .where({ assignedByUserId })
      .join(USER_DELIVERY_TABLE, `${DELIVERY_TABLE}.deliveryId`, '=', `${USER_DELIVERY_TABLE}.deliveryId`)
      .join(USER_PROFILE_TABLE, `${USER_DELIVERY_TABLE}.userId`, '=', `${USER_PROFILE_TABLE}.userId`)
      .orderBy(`${DELIVERY_TABLE}.createdAt`, 'desc')
      .limit(5);
  },

  getUserDeliveries(userId) {
    return knex(USER_DELIVERY_TABLE)
      .where({ [`${USER_DELIVERY_TABLE}.userId`]: userId })
      .join(DELIVERY_TABLE, `${USER_DELIVERY_TABLE}.deliveryId`, '=', `${DELIVERY_TABLE}.deliveryId`)
      .join(USER_PROFILE_TABLE, `${DELIVERY_TABLE}.assignedToUserId`, '=', `${USER_PROFILE_TABLE}.userId`)
      .join(USER_COMPANY_TABLE, `${DELIVERY_TABLE}.assignedToUserId`, '=', `${USER_COMPANY_TABLE}.userId`)
      .join(COMPANY_PROFILE_TABLE, `${USER_COMPANY_TABLE}.companyId`, '=', `${COMPANY_PROFILE_TABLE}.companyId`);
  },

  getUserPendingDeliveries(userId) {
    return knex(USER_DELIVERY_TABLE)
      .where({
        [`${USER_DELIVERY_TABLE}.userId`]: userId,
        statusCode: DeliveryStatusCodes.Scheduled
      })
      .join(DELIVERY_TABLE, `${USER_DELIVERY_TABLE}.deliveryId`, '=', `${DELIVERY_TABLE}.deliveryId`)
      .join(USER_PROFILE_TABLE, `${DELIVERY_TABLE}.assignedToUserId`, '=', `${USER_PROFILE_TABLE}.userId`)
      .join(USER_COMPANY_TABLE, `${DELIVERY_TABLE}.assignedToUserId`, '=', `${USER_COMPANY_TABLE}.userId`)
      .join(COMPANY_PROFILE_TABLE, `${USER_COMPANY_TABLE}.companyId`, '=', `${COMPANY_PROFILE_TABLE}.companyId`);
  },

  getUserRecentDeliveries(userId) {
    return knex(USER_DELIVERY_TABLE)
      .where({ [`${USER_DELIVERY_TABLE}.userId`]: userId })
      .join(DELIVERY_TABLE, `${USER_DELIVERY_TABLE}.deliveryId`, '=', `${DELIVERY_TABLE}.deliveryId`)
      .join(USER_PROFILE_TABLE, `${DELIVERY_TABLE}.assignedToUserId`, '=', `${USER_PROFILE_TABLE}.userId`)
      .join(USER_COMPANY_TABLE, `${DELIVERY_TABLE}.assignedToUserId`, '=', `${USER_COMPANY_TABLE}.userId`)
      .join(COMPANY_PROFILE_TABLE, `${USER_COMPANY_TABLE}.companyId`, '=', `${COMPANY_PROFILE_TABLE}.companyId`)
      .orderBy(`${USER_DELIVERY_TABLE}.createdAt`, 'desc')
      .limit(5);
  },

  updateDeliveryStatus(deliveryId, statusCode) {
    return knex(DELIVERY_TABLE)
      .where({ deliveryId })
      .update({ statusCode });
  },

  getUserDelivery(deliveryId) {
    return knex(DELIVERY_TABLE)
      .where({ deliveryId: deliveryId })
      .join(USER_PROFILE_TABLE, `${DELIVERY_TABLE}.assignedToUserId`, '=', `${USER_PROFILE_TABLE}.userId`)
      .join(USER_COMPANY_TABLE, `${DELIVERY_TABLE}.assignedToUserId`, '=', `${USER_COMPANY_TABLE}.userId`)
      .join(COMPANY_PROFILE_TABLE, `${USER_COMPANY_TABLE}.companyId`, '=', `${COMPANY_PROFILE_TABLE}.companyId`)
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
      users,
      statusCode,
      userDeliveryStatus
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
        statusCode
      })
      .then(deliveryIds => {
        deliveryId = deliveryIds[0];
        const userDeliveries = users.map(user => {
          return {
            deliveryId,
            userId: user,
            status:
            userDeliveryStatus
          };
        });
        return knex(USER_DELIVERY_TABLE).transacting(trx).insert(userDeliveries);
      })
      .then(() => deliveryId);
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
