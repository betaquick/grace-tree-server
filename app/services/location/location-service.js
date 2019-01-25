'use strict';

const googleMapsClient = require('@google/maps').createClient({
  key: process.env.GOOGLE_MAP_KEY,
  Promise: Promise
});

const error = require('debug')('grace-tree:location-service:error');
const { throwError } = require('../../controllers/util/controller-util');

const getCoordinates = async address => {
  try {
    const googleMapResponse = await googleMapsClient.geocode({ address }).asPromise();
    const googleMapResults = googleMapResponse.json.results;

    return googleMapResults[0].geometry.location;
  } catch (err) {
    error(err);
    throwError(422, 'Error retrieving coordinates from address');
  }
};

module.exports = {
  getCoordinates
};
