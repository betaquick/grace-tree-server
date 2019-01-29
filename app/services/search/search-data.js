'use strict';

const knex = require('knex')(require('../../../db/knexfile').getKnexInstance());
const {
  USER_ADDRESS_TABLE,
  USER_PROFILE_TABLE
} = require('../../../constants/table.constants');

const searchData = {
  searchUsers(latitude, longitude, radius = 30) {
    return knex(USER_ADDRESS_TABLE)
      .select(
        knex.raw(`
          *,
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
      .join(USER_PROFILE_TABLE, `${USER_ADDRESS_TABLE}.userId`, '=', `${USER_PROFILE_TABLE}.userId`);
  }
};

module.exports = searchData;
