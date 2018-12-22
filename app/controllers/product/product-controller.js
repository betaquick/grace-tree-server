'use strict';

const error = require('debug')('grace-tree:user-controller:error');

const productSvc = require('../../services/product/product-service');
const { handleError, handleSuccess } = require('../util/controller-util');

module.exports = {
  getProducts(req, res) {
    productSvc
      .getProducts()
      .then(products => handleSuccess(res, 'Products retrieved successful', { products }))
      .catch(err => handleError(err, res, err.message, error));
  }
}