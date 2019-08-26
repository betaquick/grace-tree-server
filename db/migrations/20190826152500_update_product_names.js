'use strict';
const oldAndNewProductNames = [
  { oldname: 'Wood Chips', newname: 'Chips' },
  { oldname: 'Wood logs', newname: 'Logs' }
];


exports.up = function(knex, Promise) {
  return knex.transaction((trx) => {
    const queries = oldAndNewProductNames.map(({ newname, oldname }) => knex('product')
      .update({ productDesc: newname })
      .where({ productDesc: oldname }));

    Promise.all(queries)
      .then(trx.commit)
      .catch(trx.rollback);
  });
};

exports.down = function(knex, Promise) {
  return knex.transaction((trx) => {
    const queries = oldAndNewProductNames.map(({ newname, oldname }) => knex('product')
      .update({ productDesc: oldname })
      .where({ productDesc: newname }));

    Promise.all(queries)
      .then(trx.commit)
      .catch(trx.rollback);
  });
};
