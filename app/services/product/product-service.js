'use strict';

const debug = require('debug')('fccc-admin:service:debug');

const productData = require('./product-data');

module.exports = {
  getProducts() {
    debug('Retrieving products');

    return productData.getProducts();
  },
}