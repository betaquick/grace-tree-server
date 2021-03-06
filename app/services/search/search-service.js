'use strict';

const { error, debug } = require('./../../../debug')('grace-tree:search-service');
const Joi = require('joi');

const locationService = require('../location/location-service');
const searchData = require('./search-data');

const searchUsers = async(address, radius, includePause) => {
  try {
    await Joi.validate(address, Joi.string().required());

    const coordinates = await locationService.getCoordinates(address);
    debug(`Google map coordinates for ${address} is: `, coordinates);

    const longitude = coordinates.lng;
    const latitude = coordinates.lat;

    const users = await searchData.searchUsers(latitude, longitude, includePause, radius);

    return { users, coordinates };
  } catch (err) {
    error('Error updating user products ' + err.message);
    throw err;
  }
};

module.exports = {
  searchUsers
};
