'use strict';

const Joi = require('joi');
const { UserStatus, RoleTypes } = require('@betaquick/grace-tree-constants');

const userValidator = Joi.object().keys({
  userId: Joi.number().required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  password: Joi.string().required(),
  addresses: Joi.array().required()
});

const businessInfoValidator = Joi.object().keys({
  userId: Joi.number().required(),
  companyName: Joi.string().required(),
  companyAddress: Joi.string().required(),
  userRole: Joi.string().valid([
    RoleTypes.Admin,
    RoleTypes.Staff
  ]).required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  zip: Joi.string().required(),
  website: Joi.string().required()
});

const productsValidator = Joi.object().keys({
  productId: Joi.number().required(),
  status: Joi.boolean().required()
});

const deliveryInfoValidator = Joi.object().keys({
  userId: Joi.number().required(),
  products: Joi.array().items(productsValidator),
  address: Joi.object().keys({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zip: Joi.string().required()
  })
});

const statusValidator = Joi.object().keys({
  userId: Joi.number().required(),
  status: Joi.string().valid([
    UserStatus.Pause,
    UserStatus.Ready,
    UserStatus.Stop
  ]).required()
});

module.exports = {
  userValidator,
  businessInfoValidator,
  deliveryInfoValidator,
  statusValidator
};
