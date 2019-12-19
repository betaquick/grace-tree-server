'use strict';

const { DeliveryStatusCodes, UserDeliveryStatus } = require('@betaquick/grace-tree-constants');

const knex = require('knex')(require('../../../db/knexfile').getKnexInstance());
const {
  DELIVERY_TABLE,
  USER_DELIVERY_TABLE,
  USER_PROFILE_TABLE,
  USER_COMPANY_TABLE,
  COMPANY_PROFILE_TABLE,
  USER_ADDRESS_TABLE,
  USER_PRODUCT_TABLE,
  PRODUCT_TABLE,
  DELIVERY_PRODUCT_TABLE
} = require('../../../constants/table.constants');

const _ = require('lodash');

module.exports = {
  getDeliveries(assignedByUserId) {
    return knex(knex.raw(`${USER_DELIVERY_TABLE} ud`))
      .select(
        knex.raw('DISTINCT ud.deliveryId'),
        knex.raw(`(SELECT COUNT(*) FROM ${USER_DELIVERY_TABLE} ud1 WHERE ud1.deliveryId = ud.deliveryId) usersCount`),
        knex.raw(`(SELECT userId FROM ${USER_DELIVERY_TABLE} ud2 WHERE ud2.deliveryId = ud.deliveryId AND isAssigned=true LIMIT 1) userId`),
        `${DELIVERY_TABLE}.*`,
        'firstName',
        'lastName',
        `${USER_ADDRESS_TABLE}.street`, `${USER_ADDRESS_TABLE}.zip`,
        `${USER_ADDRESS_TABLE}.city`, `${USER_ADDRESS_TABLE}.state`,
        `${DELIVERY_PRODUCT_TABLE}.productId`,
        `${PRODUCT_TABLE}.productDesc`
      )
      .where({ assignedByUserId })
      .join(DELIVERY_TABLE, 'ud.deliveryId', '=', `${DELIVERY_TABLE}.deliveryId`)
      .join(USER_PROFILE_TABLE, 'ud.userId', '=', `${USER_PROFILE_TABLE}.userId`)
      .join(USER_ADDRESS_TABLE, 'ud.userId', '=', `${USER_ADDRESS_TABLE}.userId`)
      .leftJoin(DELIVERY_PRODUCT_TABLE, 'ud.deliveryId', '=', `${DELIVERY_PRODUCT_TABLE}.deliveryId`)
      .leftJoin(PRODUCT_TABLE, `${DELIVERY_PRODUCT_TABLE}.productId`, `${PRODUCT_TABLE}.productId`)
      .then(results => {
        return _.chain(results)
          .groupBy(detail => detail.deliveryId)
          .map(deliveries => {
            let delivery = deliveries[0];
            delivery.deliveryProducts = _.uniq(_.map(deliveries, d => d.productDesc)).filter(prod => prod);
            delete delivery.productId;
            delete delivery.productDesc;
            return delivery;
          })
          .orderBy('createdAt', 'desc')
          .value();
      });
  },

  getProductDescriptions(productIds = []) {
    return knex(PRODUCT_TABLE)
      .whereIn('productId', productIds)
      .select('productDesc');
  },

  getScheduledDeliveries() {
    return knex(knex.raw(`${USER_DELIVERY_TABLE} ud`))
      .select(
        knex.raw('DISTINCT ud.deliveryId'),
        knex.raw(`(SELECT COUNT(*) FROM ${USER_DELIVERY_TABLE} ud1 WHERE ud1.deliveryId = ud.deliveryId) usersCount`),
        knex.raw(`(SELECT userId FROM ${USER_DELIVERY_TABLE} ud2 WHERE ud2.deliveryId = ud.deliveryId AND isAssigned=true LIMIT 1) userId`),
        `${DELIVERY_TABLE}.*`
      )
      .where({
        statusCode: DeliveryStatusCodes.Scheduled
      })
      .join(DELIVERY_TABLE, 'ud.deliveryId', '=', `${DELIVERY_TABLE}.deliveryId`)
      .orderBy(`${DELIVERY_TABLE}.createdAt`, 'desc');
  },

  getCompanyDelivery(deliveryId) {
    return knex(USER_DELIVERY_TABLE)
      .select(
        '*',
        knex.raw('recipient.status userStatus'),
        knex.raw(`${USER_DELIVERY_TABLE}.status deliveryStatus`),
        knex.raw(`${DELIVERY_TABLE}.statusCode statusCode`),
        knex.raw(`${DELIVERY_TABLE}.createdAt createdAt`),
        'crew.firstName as crewFirstName',
        'crew.lastName as crewLastName',
        'recipient.firstName as firstName',
        'recipient.lastName as lastName',
        'deliveryProduct.productId as deliveryProduct',
        `${USER_DELIVERY_TABLE}.deliveryId as deliveryId`
      )
      .where(`${USER_DELIVERY_TABLE}.deliveryId`, deliveryId)
      .join(`${USER_PROFILE_TABLE} as recipient`, `${USER_DELIVERY_TABLE}.userId`, '=', 'recipient.userId')
      .join(DELIVERY_TABLE, `${USER_DELIVERY_TABLE}.deliveryId`, '=', `${DELIVERY_TABLE}.deliveryId`)
      .join(USER_ADDRESS_TABLE, 'recipient.userId', '=', `${USER_ADDRESS_TABLE}.userId`)
      .join(`${USER_PROFILE_TABLE} as crew`, `${DELIVERY_TABLE}.assignedToUserId`, 'crew.userId')
      .leftJoin(`${DELIVERY_PRODUCT_TABLE} as deliveryProduct`, 'deliveryProduct.deliveryId', `${USER_DELIVERY_TABLE}.deliveryId`)
      .leftJoin(USER_PRODUCT_TABLE, function() {
        this.on('recipient.userId', `${USER_PRODUCT_TABLE}.userId`);
      })
      .leftJoin(PRODUCT_TABLE, `${USER_PRODUCT_TABLE}.productId`, `${PRODUCT_TABLE}.productId`)
      .then(results => {
        return _.chain(results)
          .groupBy(detail => detail.userId)
          .map(users => {
            let user = users[0];
            user.products = _.uniqBy(_.map(users, u => ({ productId: u.productId, productDesc: u.productDesc })), 'productId');
            user.productDesc = _.uniq(_.map(users, u => ((u.productDesc && u.status) ? u.productDesc : false))).filter(desc => desc);
            user.deliveryProducts = (_.uniq(_.map(users, u => u.deliveryProduct)).filter(dProd => dProd)) || [];
            delete user.userProductId;
            delete user.productId;
            delete user.profileId;
            delete user.productCode;
            return user;
          })
          .value();
      });
  },

  getCompanyPendingDeliveries(assignedByUserId) {
    return knex(knex.raw(`${USER_DELIVERY_TABLE} ud`))
      .select(
        knex.raw('DISTINCT ud.deliveryId'),
        knex.raw(`(SELECT COUNT(*) FROM ${USER_DELIVERY_TABLE} ud1 WHERE ud1.deliveryId = ud.deliveryId) usersCount`),
        knex.raw(`(SELECT userId FROM ${USER_DELIVERY_TABLE} ud2 WHERE ud2.deliveryId = ud.deliveryId AND isAssigned=true LIMIT 1) userId`),
        `${DELIVERY_TABLE}.*`,
        'firstName',
        'lastName'
      )
      .where({
        assignedByUserId,
        statusCode: DeliveryStatusCodes.Scheduled
      })
      .join(DELIVERY_TABLE, 'ud.deliveryId', '=', `${DELIVERY_TABLE}.deliveryId`)
      .join(USER_PROFILE_TABLE, 'ud.userId', '=', `${USER_PROFILE_TABLE}.userId`);
  },

  getCompanyRecentDeliveries(assignedByUserId) {
    return knex(knex.raw(`${USER_DELIVERY_TABLE} ud`))
      .select(
        knex.raw('DISTINCT ud.deliveryId'),
        knex.raw(`(SELECT COUNT(*) FROM ${USER_DELIVERY_TABLE} ud1 WHERE ud1.deliveryId = ud.deliveryId) usersCount`),
        knex.raw(`(SELECT userId FROM ${USER_DELIVERY_TABLE} ud2 WHERE ud2.deliveryId = ud.deliveryId AND isAssigned=true LIMIT 1) userId`),
        `${DELIVERY_TABLE}.*`,
        'firstName',
        'lastName'
      )
      .where({ assignedByUserId })
      .join(DELIVERY_TABLE, 'ud.deliveryId', '=', `${DELIVERY_TABLE}.deliveryId`)
      .join(USER_PROFILE_TABLE, 'ud.userId', '=', `${USER_PROFILE_TABLE}.userId`)
      .orderBy(`${DELIVERY_TABLE}.createdAt`, 'desc')
      .limit(5);
  },

  getUserDeliveries(userId) {
    return knex(USER_DELIVERY_TABLE)
      .select(
        '*',
        knex.raw(`${DELIVERY_TABLE}.createdAt createdAt`)
      )
      .where({
        [`${USER_DELIVERY_TABLE}.userId`]: userId,
        isAssigned: 1
      })
      .join(DELIVERY_TABLE, `${USER_DELIVERY_TABLE}.deliveryId`, '=', `${DELIVERY_TABLE}.deliveryId`)
      .join(USER_PROFILE_TABLE, `${DELIVERY_TABLE}.assignedToUserId`, '=', `${USER_PROFILE_TABLE}.userId`)
      .join(USER_COMPANY_TABLE, `${DELIVERY_TABLE}.assignedToUserId`, '=', `${USER_COMPANY_TABLE}.userId`)
      .join(COMPANY_PROFILE_TABLE, `${USER_COMPANY_TABLE}.companyId`, '=', `${COMPANY_PROFILE_TABLE}.companyId`)
      .orderBy(`${DELIVERY_TABLE}.createdAt`, 'desc');
  },

  getUserPendingDeliveries(userId) {
    return knex(USER_DELIVERY_TABLE)
      .where({
        [`${USER_DELIVERY_TABLE}.userId`]: userId,
        statusCode: DeliveryStatusCodes.Scheduled,
        isAssigned: 1
      })
      .join(DELIVERY_TABLE, `${USER_DELIVERY_TABLE}.deliveryId`, '=', `${DELIVERY_TABLE}.deliveryId`)
      .join(USER_PROFILE_TABLE, `${DELIVERY_TABLE}.assignedToUserId`, '=', `${USER_PROFILE_TABLE}.userId`)
      .join(USER_COMPANY_TABLE, `${DELIVERY_TABLE}.assignedToUserId`, '=', `${USER_COMPANY_TABLE}.userId`)
      .join(COMPANY_PROFILE_TABLE, `${USER_COMPANY_TABLE}.companyId`, '=', `${COMPANY_PROFILE_TABLE}.companyId`);
  },

  getUserRecentDeliveries(userId) {
    return knex(USER_DELIVERY_TABLE)
      .select(
        '*',
        knex.raw(`${DELIVERY_TABLE}.createdAt createdAt`)
      )
      .where({
        [`${USER_DELIVERY_TABLE}.userId`]: userId,
        isAssigned: 1
      })
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
      .where(`${DELIVERY_TABLE}.deliveryId`, deliveryId)
      .join(USER_PROFILE_TABLE, `${DELIVERY_TABLE}.assignedToUserId`, '=', `${USER_PROFILE_TABLE}.userId`)
      .join(USER_COMPANY_TABLE, `${DELIVERY_TABLE}.assignedToUserId`, '=', `${USER_COMPANY_TABLE}.userId`)
      .join(COMPANY_PROFILE_TABLE, `${USER_COMPANY_TABLE}.companyId`, '=', `${COMPANY_PROFILE_TABLE}.companyId`)
      .leftJoin(`${DELIVERY_PRODUCT_TABLE} as deliveryProduct`, 'deliveryProduct.deliveryId', `${DELIVERY_TABLE}.deliveryId`)
      .leftJoin(PRODUCT_TABLE, 'deliveryProduct.productId', `${PRODUCT_TABLE}.productId`)
      .select('*')
      .then(deliveries => {
        let delivery = deliveries[0];
        delivery.deliveryProducts = _.uniq(_.map(deliveries, d => d.productDesc)).filter(prod => prod);
        delete delivery.deliveryProductId;
        delete delivery.productCode;
        delete delivery.productId;
        return delivery;
      });
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
      userDeliveryStatus,
      isAssigned
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
            status: userDeliveryStatus,
            isAssigned,
            updatedAt: knex.fn.now()
          };
        });
        return knex(USER_DELIVERY_TABLE).transacting(trx).insert(userDeliveries);
      })
      .then(() => deliveryId);
  },

  insertDeliveryProducts(deliveryId, productIds = [], trx) {
    const deliveryProductMap = productIds.map(productId => ({
      deliveryId, productId
    }));

    return knex(DELIVERY_PRODUCT_TABLE)
      .transacting(trx)
      .insert(deliveryProductMap);
  },

  removeDeliveryProducts(deliveryId, trx) {
    return knex(DELIVERY_PRODUCT_TABLE)
      .transacting(trx)
      .where({ deliveryId })
      .del();
  },

  updateDelivery(deliveryInfo, trx) {
    const {
      deliveryId,
      assignedToUserId,
      details,
      additionalCompanyText,
      additionalRecipientText,
      statusCode,
      userId,
      isAssigned
    } = deliveryInfo;

    return knex(DELIVERY_TABLE)
      .transacting(trx)
      .where({ deliveryId })
      .update({
        assignedToUserId,
        details,
        additionalRecipientText,
        additionalCompanyText,
        statusCode,
        createdAt: knex.fn.now()
      })
      .then(() => {
        const userDelivery = {
          deliveryId,
          isAssigned,
          updatedAt: knex.fn.now()
        };
        return knex(USER_DELIVERY_TABLE)
          .transacting(trx)
          .where({ deliveryId, userId })
          .update(userDelivery);
      });
  },

  acceptDeliveryRequest(userId, deliveryId, trx) {
    return knex(USER_DELIVERY_TABLE)
      .transacting(trx)
      .where({ userId, deliveryId })
      .update({ status: UserDeliveryStatus.Accepted, updatedAt: knex.fn.now() });
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
