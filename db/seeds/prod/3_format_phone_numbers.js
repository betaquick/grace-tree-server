'use strict';

const { USER_PHONE_TABLE } = require('../../../constants/table.constants');
const { formatPhoneNumber } = require('../../../app/services/util/commonUtils');

// alot of duplicate records in db
const cache = {};

exports.seed = async(knex, Promise) => {
  try {
    const phoneNumbers = await knex(USER_PHONE_TABLE)
      .select('userPhoneId', 'phoneNumber');

    const updatesQueries = [];

    return knex.transaction(trx => {
      phoneNumbers.forEach(({phoneNumber, userPhoneId}) => {
        if (!cache[phoneNumber]) {
          cache[phoneNumber] = formatPhoneNumber(phoneNumber);
        }

        updatesQueries.push(knex(USER_PHONE_TABLE)
          .transacting(trx)
          .where({ userPhoneId })
          .update({
            phoneNumber: cache[phoneNumber]
          }));
      });

      return Promise.all(updatesQueries)
        .then(trx.commit)
        .catch(trx.rollback);
    });
  } catch (error) {
    console.error('Seed failed with error: ', error);
    throw error;
  }
};
