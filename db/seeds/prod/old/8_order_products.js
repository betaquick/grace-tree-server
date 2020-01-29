'use strict';

const {
  CHIPS, FILLDIRT, GRINDINGS,
  LOGS, PINE, POPLAR, ROUNDS
} = require('../../../../constants/products.constants');

exports.seed = knex => knex('product')
  .update({ order: 1, hint: 'Want Chips?' })
  .where({ productCode: CHIPS })
  .then(() => knex('product')
    .update({ order: 2, hint: 'Want Logs? (Logs are longer than 22” and must be cut down to your preferred length)' })
    .where({ productCode: LOGS }))
  .then(() => knex('product')
    .update({ order: 3, hint: 'Want Rounds? (Rounds are standard firewood length, 18-22”)' })
    .where({ productCode: ROUNDS }))
  .then(() => knex('product')
    .update({ order: 4, productDesc: 'Pine OK?', hint: 'Would you accept Pine Species Wood?' })
    .where({ productCode: PINE }))
  .then(() => knex('product')
    .update({ order: 5, productDesc: 'Poplar OK?', hint: 'Would you accept Poplar Species Wood?' })
    .where({ productCode: POPLAR }))
  .then(() => knex('product')
    .update({ order: 6, hint: 'Want Grindings? (Grindings are what stump grinding produces. They are similar to Chips)' })
    .where({ productCode: GRINDINGS }))
  .then(() => knex('product')
    .update({ order: 7, hint: 'Want Fill Dirt? (Fill dirt is not clean; it’s intended to be used to fill holes or level ground)' })
    .where({ productCode: FILLDIRT }));
