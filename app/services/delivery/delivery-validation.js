'use strict';

const Joi = require('joi');

const userDeliverySchema = Joi.object().keys({
    userId: Joi.number().required(),
});

const deliveryInfoValidator = Joi.object().keys({
    userId: Joi.number().required(),
    companyId: Joi.number().required(),
    users: Joi.array().required(),
    details: Joi.string()
});

const updateDeliveryInfoValidator = Joi.object().keys({
    deliveryId: Joi.number().required(),
    companyId: Joi.number().required(),
    details: Joi.string()
});

module.exports = {
    deliveryInfoValidator,
    updateDeliveryInfoValidator
};
