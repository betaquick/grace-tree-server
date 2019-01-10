'use strict';

const Joi = require('joi');
const { UserStatus, PhoneTypes } = require('@betaquick/grace-tree-constants');

const phoneListSchema = Joi.object().keys({
  phoneNumber: Joi.string().required(),
  primary: Joi.any().valid([true, false, 1, 0]),
  phoneType: Joi.string().valid([
    PhoneTypes.HOME,
    PhoneTypes.MOBILE,
    PhoneTypes.OFFICE
  ]).required()
});

const emailListSchema = Joi.object().keys({
  emailAddress: Joi.string().required(),
  primary: Joi.any().valid([true, false, 1, 0])
});

const userValidator = Joi.object().keys({
  userId: Joi.number().required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  phones: Joi.array().items(phoneListSchema).required(),
  emails: Joi.array().items(emailListSchema).required(),
  password: Joi.string(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).options({
    language: {
      any: {
        allowOnly: 'field must match password field'
      }
    }
  })
});

const businessInfoValidator = Joi.object().keys({
  userId: Joi.number().required(),
  companyName: Joi.string().required(),
  companyAddress: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  zip: Joi.string().required(),
  website: Joi.string().required()
});

const updateBusinessValidator = businessInfoValidator.append({
  companyAddressId: Joi.number().required(),
  companyId: Joi.number().required()
});

const productsValidator = Joi.object().keys({
  productId: Joi.number().required(),
  status: Joi.boolean().required()
});

const deliveryInfoValidator = Joi.object().keys({
  userId: Joi.number().required(),
  userProducts: Joi.array().items(productsValidator),
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
  updateBusinessValidator,
  deliveryInfoValidator,
  statusValidator
};
