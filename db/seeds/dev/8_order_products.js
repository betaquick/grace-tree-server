'use strict';

const {
  CHIIPS, FILLDIRT, GRINDINGS,
  LOGS, PINE, POPLAR, ROUNDS
} = require('../../../constants/products.constants');

exports.seed = knex => knex('product').update({ order: 1 }).where({ productCode: CHIIPS })
  .then(() => knex('product').update({ order: 2 }).where({ productCode: LOGS }))
  .then(() => knex('product').update({ order: 3 }).where({ productCode: ROUNDS }))
  .then(() => knex('product').update({ order: 4, productDesc: 'Pine OK?' }).where({ productCode: PINE }))
  .then(() => knex('product').update({ order: 5, productDesc: 'Poplar OK?' }).where({ productCode: POPLAR }))
  .then(() => knex('product').update({ order: 6 }).where({ productCode: GRINDINGS }))
  .then(() => knex('product').update({ order: 7 }).where({ productCode: FILLDIRT }));
