'use strict';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const googleMapsClient = require('@google/maps').createClient({
  key: process.env.GOOGLE_MAP_KEY,
  Promise: Promise
});
const error = require('debug')('grace-tree:location-service:error');
const debug = require('debug')('grace-tree:location-service:debug');
const { throwError } = require('../../controllers/util/controller-util');

const getCoordinates = async address => {
  try {
    const googleMapResponse = await googleMapsClient.geocode({ address, components: { country: 'US' } }).asPromise();
    const googleMapResults = googleMapResponse.json.results;
    const result = googleMapResults[0];

    if (result.partial_match) {
      debug(result);
      throwError(422, 'The address you entered is invalid');
    }

    return result.geometry.location;
  } catch (err) {
    error(err);
    throwError(422, 'The address you entered is invalid');
  }
};

module.exports = {
  googleMapsClient,
  getCoordinates
};
