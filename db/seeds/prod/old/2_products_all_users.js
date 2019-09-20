'use strict';
const _ = require('lodash');

const { USER_PRODUCT_TABLE, PRODUCT_TABLE } = require('../../../../constants/table.constants');
/**
 * @param {*} knex
 * @returns {Promise<any>} users in db with current products
 */
function findUsersWithIncompleteProducts(knex) {
  const query = knex
    .select('userId', 'productId')
    .from(knex
      .raw(`${USER_PRODUCT_TABLE} where userId in
         (select userId from ${USER_PRODUCT_TABLE} 
          group by userId
           having count(distinct(productId)) <>  (select count(*) from ${PRODUCT_TABLE}))`));
  return query;
}

function getProductIds(knex) {
  return knex.select('productId')
    .from(PRODUCT_TABLE);
}

exports.seed = async(knex, Promise) => {
  try {
    const [productIds, usersWithProductIds] = await Promise.all([
      getProductIds(knex),
      findUsersWithIncompleteProducts(knex)
    ]);

    const grouped_users_products = (_.chain(usersWithProductIds).groupBy(data => data.userId)).value();
    const updates = [];
    for (let userId in grouped_users_products) {
      if (Object.prototype.hasOwnProperty.call(grouped_users_products, userId)) {
        userId = parseInt(userId, 10);
        const missingProductIds = _.difference(
          productIds.map(({productId}) => productId),
          (grouped_users_products[userId] || []).map(({productId}) => productId)
        );

        if (missingProductIds && missingProductIds.length) {
          console.log(`Adding ${missingProductIds.length} products for user ${userId}`);
        }

        (missingProductIds || []).forEach(productId => updates.push({ productId, userId, status: 0 }));
      }
    }

    if (!updates.length) {
      console.log('No missing products for any user');
      return Promise.resolve();
    }

    return knex(USER_PRODUCT_TABLE)
      .insert(updates);
  } catch (error) {
    console.error('Failed with error: ', error);
    throw error;
  }
};

// select userId, productId from user_product where userId in (select userId from user_product group by userId having count(distinct(productId)) <>  (select count(*) from product))
