'use strict';

const debug = require('debug')('grace-tree:search-data:debug');

const {
  UserStatus, DeliveryStatusCodes
} = require('@betaquick/grace-tree-constants');
const _ = require('lodash');

const knex = require('knex')(require('../../../db/knexfile').getKnexInstance());
const {
  USER_TABLE,
  USER_ADDRESS_TABLE,
  USER_PHONE_TABLE,
  USER_PROFILE_TABLE,
  USER_PRODUCT_TABLE,
  USER_DELIVERY_TABLE,
  USER_EMAIL_TABLE,
  DELIVERY_TABLE,
  PRODUCT_TABLE
} = require('../../../constants/table.constants');

const searchData = {
  searchUsers(latitude, longitude, includePause, radius = 10) {

    let ReadyConstraint = ` AND ${USER_PROFILE_TABLE}.status = '${UserStatus.Ready}'`;
    if (includePause === 'true') {
      ReadyConstraint = '';
    }
    debug('DEbug query', { ReadyConstraint, includePause });
    const query = knex.select(
      'limited_tbl.*',
      `${PRODUCT_TABLE}.productDesc`,
      'usd.status as deliveryStatus', 'usd.deliveryId'
    )
      .from(
        knex.raw(
          `(SELECT ${USER_TABLE}.userId, 
               ${USER_TABLE}.active,
               email, phoneNumber, emailAddress,
               firstName, lastName, userAddressId,
               street, city, state, zip, deliveryInstruction, longitude, latitude, 
               ${USER_PROFILE_TABLE}.status, 
               ( 6371 * Acos(Cos(Radians(${latitude})) * Cos(Radians(latitude)) * 
                             Cos( 
                              Radians(longitude) - Radians(${longitude})) + 
                               Sin( 
                                Radians(${latitude})) * 
                               Sin(Radians(latitude))) ) 
                        distance 
        FROM   ${USER_ADDRESS_TABLE}
          INNER JOIN ${USER_PROFILE_TABLE} 
              ON ${USER_ADDRESS_TABLE}.userId = ${USER_PROFILE_TABLE}.userId 
          INNER JOIN ${USER_TABLE} 
              ON ${USER_ADDRESS_TABLE}.userId = ${USER_TABLE}.userId 
              AND ${USER_TABLE}.active = 1
          LEFT JOIN ${USER_PHONE_TABLE}
          ON ${USER_PHONE_TABLE}.userId  = ${USER_ADDRESS_TABLE}.userId
          LEFT JOIN ${USER_EMAIL_TABLE}
          ON ${USER_EMAIL_TABLE}.userId = ${USER_ADDRESS_TABLE}.userId 
            AND ${USER_EMAIL_TABLE}.isVerified = 1 
        WHERE  ${USER_TABLE}.active = true `.concat(ReadyConstraint)
               + ` AND longitude IS NOT NULL 
               AND latitude IS NOT NULL
        HAVING distance < ${radius}
        ORDER  BY distance ASC
        LIMIT  300) limited_tbl 
         LEFT JOIN ${USER_PRODUCT_TABLE}
                ON limited_tbl.userId = ${USER_PRODUCT_TABLE}.userId
                AND ${USER_PRODUCT_TABLE}.status = true
         LEFT JOIN ${PRODUCT_TABLE} 
                ON ${USER_PRODUCT_TABLE}.productId = ${PRODUCT_TABLE}.productId
         LEFT JOIN ${USER_DELIVERY_TABLE} usd
                ON limited_tbl.userId = usd.userId
         LEFT JOIN ${DELIVERY_TABLE}
                ON usd.deliveryId = ${DELIVERY_TABLE}.deliveryId
                AND ${DELIVERY_TABLE}.statusCode 
                in ('${DeliveryStatusCodes.Scheduled}', '${DeliveryStatusCodes.Requested}')`)
      );

    return query
      .then(results => {
        return _.chain(results)
          .groupBy(detail => detail.userId)
          .map(users => {
            let user = users[0];
            user.userId = users[0].userId;
            user.phoneNumber = _.uniq(_.map(users, u => u.phoneNumber)).filter(p => p);
            user.productDesc = _.uniq(_.map(users, u => u.productDesc)).filter(desc => desc);
            user.validEmails = _.uniq(_.map(users, u => u.emailAddress)).filter(e => e);
            user.deliveries = _.uniqBy(_.map(users, u => ({
              deliveryId: u.deliveryId,
              status: u.deliveryStatus
            })), 'deliveryId').filter(d => d.deliveryId);
            return user;
          })
          .value();
      })
      .then(values => _.sortBy(values, 'distance'));
  }
};

module.exports = searchData;
