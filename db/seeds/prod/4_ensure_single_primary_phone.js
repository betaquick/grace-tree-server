'use strict';

const { USER_PHONE_TABLE } = require('../../../constants/table.constants');

const findUsersWithMultiplePrimaryPhones = (knex) => {
  return knex(USER_PHONE_TABLE)
    .select('userId', 'primary', 'phoneNumber')
    .where({primary: true})
    .groupBy('userId')
    .havingRaw('count(*) > ?', [1]);
};


const unsetPrimaryPhone = (knex, userIds = [], trx) => {
  return knex(USER_PHONE_TABLE)
    .whereIn('userId', userIds)
    .transacting(trx)
    .update({ primary: false });
};

const getNewPrimaryPhoneNumbers = (knex, userIds = []) => {
  return knex(USER_PHONE_TABLE)
    .select('userId', 'userPhoneId')
    .whereIn('userId', userIds)
    .groupBy('userId')
    .orderBy('createdAt', 'desc');
};


const getSetPrimaryPhoneUpdateQueries = (knex, userPhoneIds = [], trx) => {
  return userPhoneIds.map(({ userPhoneId }) =>
    knex(USER_PHONE_TABLE)
      .where({ userPhoneId })
      .transacting(trx)
      .update({ primary: true }));
};


exports.seed = async(knex, Promise) => {
  try {
    const multiPrimaryPhones = await findUsersWithMultiplePrimaryPhones(knex);
    const userIds = multiPrimaryPhones.map(({ userId }) => userId);

    const newPrimaryPhoneNumberIds = await getNewPrimaryPhoneNumbers(knex, userIds);
    return knex.transaction(trx => {
      return unsetPrimaryPhone(knex, userIds, trx)
        .then(() => Promise.all(getSetPrimaryPhoneUpdateQueries(knex, newPrimaryPhoneNumberIds, trx)))
        .then(trx.commit)
        .catch(trx.rollback);
    });
  } catch (error) {
    console.error('Seed failed with error: ', error);
    throw error;
  }
};
