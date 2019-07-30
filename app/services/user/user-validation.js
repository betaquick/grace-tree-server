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
  website: Joi.string().required(),
  latitude: Joi.string().optional().allow([null, '']),
  longitude: Joi.string().optional().allow([null, ''])
});

const updateBusinessValidator = businessInfoValidator.append({
  companyAddressId: Joi.number().required(),
  companyId: Joi.number().required()
});

const productsValidator = Joi.object().keys({
  productId: Joi.number().required(),
  status: Joi.boolean().required()
});

const updateUserProductsValidator = Joi.object().keys({
  userId: Joi.number().required(),
  userProducts: Joi.array().items(productsValidator)
});

const deliveryInfoValidator = Joi.object().keys({
  userId: Joi.number().optional(),
  userProducts: Joi.array().items(productsValidator),
  address: Joi.object().keys({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zip: Joi.string().required(),
    latitude: Joi.string().optional().allow([null, '']),
    longitude: Joi.string().optional().allow([null, '']),
    deliveryInstruction: Joi.string().required().min(1)
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

const crewValidator = Joi.object().keys({
  userId: Joi.number().required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  password: Joi.string().required(),
  confirmPassword: Joi.string().required().valid(Joi.ref('password')).options({
    language: {
      any: {
        allowOnly: 'field must match password field'
      }
    }
  }),
  email: Joi.string().email().required()
});

const updateAddressValidator = Joi.object().keys({
  userAddressId: Joi.number().optional(),
  street: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  zip: Joi.string().required(),
  latitude: Joi.string().optional(),
  longitude: Joi.string().optional(),
  deliveryInstruction: Joi.string().required().min(1)
});

module.exports = {
  userValidator,
  businessInfoValidator,
  updateBusinessValidator,
  deliveryInfoValidator,
  statusValidator,
  updateUserProductsValidator,
  crewValidator,
  updateAddressValidator
};
