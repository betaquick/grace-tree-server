'use strict';

const googleMapsClient = require('@google/maps').createClient({
  key: process.env.GOOGLE_MAP_KEY,
  Promise: Promise
});
const error = require('debug')('grace-tree:location-service:error');
const { throwError } = require('../../controllers/util/controller-util');

const getCoordinates = async address => {
  try {
    const googleMapResponse = await googleMapsClient.geocode({ address, components: { country: 'US' } }).asPromise();
    const googleMapResults = googleMapResponse.json.results;
    const result = googleMapResults[0];

    if (result.partial_match) {
      debug(result);
      throwError(422, 'Error retrieving coordinates from address');
    }

    return result.geometry.location;
  } catch (err) {
    error(err);
    throwError(422, 'Error retrieving coordinates from address');
  }
};

module.exports = {
  googleMapsClient,
  getCoordinates
};
