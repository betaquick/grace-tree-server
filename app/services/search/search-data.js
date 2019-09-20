'use strict';

const { UserStatus } = require('@betaquick/grace-tree-constants');
const _ = require('lodash');

const knex = require('knex')(require('../../../db/knexfile').getKnexInstance());
const {
  USER_TABLE,
  USER_ADDRESS_TABLE,
  USER_PHONE_TABLE,
  USER_PROFILE_TABLE,
  USER_PRODUCT_TABLE,
  PRODUCT_TABLE
} = require('../../../constants/table.constants');

const searchData = {
  searchUsers(latitude, longitude, includePause, radius = 10) {

    let ReadyConstraint = ` AND ${USER_PROFILE_TABLE}.status = '${UserStatus.Ready}'`;
    if (includePause === 'true') {
      ReadyConstraint = '';
    }
    const query = knex.select(
      'limited_tbl.*',
      `${PRODUCT_TABLE}.productDesc`
    )
      .from(
        knex.raw(
          `(SELECT ${USER_TABLE}.userId, 
               ${USER_TABLE}.active,
               email, phoneNumber, 
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
          ON ${USER_PHONE_TABLE}.userPhoneId = (SELECT userPhoneId 
            FROM   ${USER_PHONE_TABLE} up 
            WHERE  up.userId = ${USER_ADDRESS_TABLE}.userId 
            AND up.primary = 1
            LIMIT  1) 
        WHERE  ${USER_TABLE}.active = true `.concat(ReadyConstraint)
               + ` AND longitude IS NOT NULL 
               AND latitude IS NOT NULL
        HAVING 'distance' < ${radius}
        ORDER  BY distance ASC
        LIMIT  15) limited_tbl 
         LEFT JOIN ${USER_PRODUCT_TABLE}
                ON limited_tbl.userId = ${USER_PRODUCT_TABLE}.userId
                AND ${USER_PRODUCT_TABLE}.status = true
         LEFT JOIN ${PRODUCT_TABLE} 
                ON ${USER_PRODUCT_TABLE}.productId = ${PRODUCT_TABLE}.productId`)
      );
    return query
      .then(results => {
        return _.chain(results)
          .groupBy(detail => detail.userId)
          .map(users => {
            let user = users[0];
            user.phoneNumber = _.uniq(_.map(users, u => u.phoneNumber)).filter(p => p);
            user.productDesc = _.uniq(_.map(users, u => u.productDesc)).filter(desc => desc);
            return user;
          })
          .value();
      })
      .then(values => _.sortBy(values, 'distance'));
  }
};

module.exports = searchData;
