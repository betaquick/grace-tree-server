'use strict';

const { debug } = require('./../../../debug')('grace-tree:product-service');

const productData = require('./product-data');

module.exports = {
  getProducts() {
    debug('Retrieving products');

    return productData.getProducts();
  }
};
