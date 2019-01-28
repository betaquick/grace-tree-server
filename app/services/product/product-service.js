'use strict';

const debug = require('debug')('grace-tree:service:debug');

const productData = require('./product-data');

module.exports = {
  getProducts() {
    debug('Retrieving products');

    return productData.getProducts();
  }
};
