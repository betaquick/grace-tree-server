'use strict';

const { UserStatus } = require('@betaquick/grace-tree-constants');

const knex = require('knex')(require('../../../db/knexfile').getKnexInstance());
const {
  USER_TABLE,
  USER_ADDRESS_TABLE,
  USER_PHONE_TABLE,
  USER_PROFILE_TABLE
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

    return knex(USER_ADDRESS_TABLE)
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
        'status',
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
      .join(USER_PROFILE_TABLE, `${USER_ADDRESS_TABLE}.userId`, '=', `${USER_PROFILE_TABLE}.userId`)
      .join(USER_TABLE, `${USER_ADDRESS_TABLE}.userId`, '=', `${USER_TABLE}.userId`)
      .leftJoin(USER_PHONE_TABLE, `${USER_ADDRESS_TABLE}.userId`, '=', `${USER_PHONE_TABLE}.userId`)
      .where(where);
  }
};

module.exports = searchData;
