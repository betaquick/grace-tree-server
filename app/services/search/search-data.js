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
    let where = {
      [`${USER_PHONE_TABLE}.primary`]: true,
      [`${USER_TABLE}.active`]: true,
      [`${USER_PROFILE_TABLE}.status`]: UserStatus.Ready
    };

    if (includePause === 'true') {
      where = {
        [`${USER_PHONE_TABLE}.primary`]: true,
        [`${USER_TABLE}.active`]: true
      };
    }

    const query = knex(USER_ADDRESS_TABLE)
      .select(
        `${USER_TABLE}.userId`,
        'email',
        'phoneNumber',
        'firstName',
        'lastName',
        'userAddressId',
        'street',
        'city',
        'state',
        'zip',
        'deliveryInstruction',
        'longitude',
        'latitude',
        `${PRODUCT_TABLE}.productDesc`,
        `${USER_PROFILE_TABLE}.status`,
        knex.raw(`
          (
            6371 *
            acos(
              cos(radians(${latitude})) *
              cos(radians(latitude)) *
              cos(
                radians(longitude) - radians(${longitude})
              ) + 
              sin(radians(${latitude})) *
              sin(radians(latitude))
            )
          ) distance
        `)
      )
      .orderBy('distance')
      .having('distance', '<', radius)
      .limit(15)
      .join(USER_PROFILE_TABLE, `${USER_ADDRESS_TABLE}.userId`, '=', `${USER_PROFILE_TABLE}.userId`)
      .join(USER_TABLE, `${USER_ADDRESS_TABLE}.userId`, '=', `${USER_TABLE}.userId`)
      .leftJoin(USER_PHONE_TABLE, `${USER_TABLE}.userId`, '=', `${USER_PHONE_TABLE}.userId`)
      .where(`${USER_PHONE_TABLE}.primary`, 1)
      .leftJoin(USER_PRODUCT_TABLE, `${USER_ADDRESS_TABLE}.userId`, `${USER_PRODUCT_TABLE}.userId`)
      .leftJoin(PRODUCT_TABLE, `${USER_PRODUCT_TABLE}.productId`, `${PRODUCT_TABLE}.productId`)
      .where(where);
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
      });
  }
};

module.exports = searchData;
