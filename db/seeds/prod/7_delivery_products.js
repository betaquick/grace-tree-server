'use strict';

const {
  DELIVERY_TABLE, USER_DELIVERY_TABLE,
  DELIVERY_PRODUCT_TABLE, USER_PRODUCT_TABLE
} = require('../../../constants/table.constants');

const { DeliveryStatusCodes } = require('@betaquick/grace-tree-constants');
const _ = require('lodash');

exports.seed = async(knex, Promise) => {

  const data = await knex.select(
    'currentTbl.*',
    'productId'
  )
    .from(knex.raw(`( select ${USER_DELIVERY_TABLE}.userId, ${USER_DELIVERY_TABLE}.deliveryId from ${USER_DELIVERY_TABLE} where ${USER_DELIVERY_TABLE}.deliveryId 
     in (select deliveryId from ${DELIVERY_TABLE} where statusCode not in ('${DeliveryStatusCodes.Expired}', '${DeliveryStatusCodes.Delivered}') 
     group by userId )) as currentTbl LEFT JOIN ${USER_PRODUCT_TABLE} ON currentTbl.userId = ${USER_PRODUCT_TABLE}.userId AND ${USER_PRODUCT_TABLE}.status = 1
     `));

  const deliveryProducts = [];

  await Promise.resolve(_.chain(data)
    .groupBy(({ deliveryId }) => deliveryId)
    .map(userDeliveryData => {
      let uDData = userDeliveryData[0];

      uDData.deliveries = _.uniq(_.map(userDeliveryData, u => u.deliveryId)).filter(deliveryId => deliveryId) || [];
      uDData.products = _.uniq(_.map(userDeliveryData, u => u.productId)).filter(pId => pId) || [];

      uDData.deliveries.forEach(deliveryId => {
        uDData.products.forEach(productId => {
          deliveryProducts.push({ deliveryId, productId });
        });
      });
    })
    .value());

  return knex(DELIVERY_PRODUCT_TABLE)
    .insert(deliveryProducts);
};
