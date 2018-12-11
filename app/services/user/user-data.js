'use strict';
const knex = require('knex')(require('../../../db/knexfile').getKnexInstance());

module.exports = {
  getUserByParam(table, params) {
    console.log('getUserByParam', params);
    return knex(table)
      .first()
      .where(params);
  },

  insertUser(user) {
    return knex.transaction(trx => {
      const {
        firstName,
        lastName,
        comment,
        phones,
        email,
        emails,
        password,
        userAddress,
        city,
        state,
        zip,
        deliveryPosition,
        description,
        selfPickup
      } = user;
      let userId;

      return knex('user')
        .transacting(trx)
        .insert({ email, password, userType: 'general' })
        .then(userIds => {
          userId = userIds[0];

          const emailMap = emails.map(e => {
            const { emailAddress, primary } = e;
            return {
              userId,
              emailAddress,
              primary
            };
          });
          return knex('user_email').transacting(trx).insert(emailMap);
        })
        .then(() => {
          const phoneMap = phones.map(phone => {
            const { phoneNumber, primary, phoneType } = phone;
            return {
              userId,
              phoneNumber,
              primary,
              phoneType
            };
          });
          return knex('user_phone').transacting(trx).insert(phoneMap);
        })
        .then(() => {
          const profile = {
            userId,
            firstName,
            lastName,
            comment,
            status: 'Pause'
          };
          return knex('user_profile').transacting(trx).insert(profile);
        })
        .then(() => {
          const address = {
            userId,
            userAddress,
            city,
            state,
            zip
          };
          return knex('user_address').transacting(trx).insert(address);
        })
        .then(addressIds => {
          const delivery = {
            userId,
            userAddressId: addressIds[0],
            deliveryPosition,
            description: `${description}`,
            selfPickup,
            deliveryStatus: 'Pause'
          };
          const deliveryIds = knex('scheduled_delivery').transacting(trx).insert(delivery);
          return Promise.all([userId, deliveryIds]);
        })
        .then(trx.commit)
        .catch(trx.rollback);
    });
  },

  updateUserByParams(table, where, params) {
    return knex(table)
      .where(where)
      .update(params);
  }
};
