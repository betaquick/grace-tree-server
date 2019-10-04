'use strict';

const {
  USER_ADDRESS_TABLE
} = require('../../../constants/table.constants');
const { getCoordinates } = require('../../../app/services/location/location-service');

const updateAddress = (addressData, knex) => {
  const { userAddressId } = addressData;
  return knex(USER_ADDRESS_TABLE)
    .where({ userAddressId })
    .update(addressData);
};

const geocodeAndUpdate = async(data, knex) => {
  const { street, city, zip, state, userAddressId, userId, deliveryInstruction } = data;
  try {
    const geocoding = await getCoordinates(`${street}, ${city}, ${state}, ${zip} `);

    return updateAddress({
      street, zip, city, state, userAddressId, userId, deliveryInstruction,
      longitude: geocoding.lng, latitude: geocoding.lat
    }, knex);
  } catch (err) {
  }
};

exports.seed = async function(knex, Promise) {
  try {
    const nonGeocoded = await knex(USER_ADDRESS_TABLE)
      .whereNull('longitude')
      .orWhereNull('latitude');
    const updates = nonGeocoded.filter(({ street }) => street)
      .map(addrData => geocodeAndUpdate(addrData, knex));
    return Promise.all(updates);
  } catch (err) {
    console.error('DB Address updates failed with error: ', err);
  }
};
