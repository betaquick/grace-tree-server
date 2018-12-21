'use strict';
const constants = require('@betaquick/grace-tree-constants');

const knex = require('knex')(require('../../../db/knexfile').getKnexInstance());
const {
  USER_TABLE,
  USER_EMAIL_TABLE,
  USER_PHONE_TABLE,
  USER_ADDRESS_TABLE,
  USER_PROFILE_TABLE,
  USER_COMPANY_TABLE,
  COMPANY_ADDRESS_TABLE,
  COMPANY_PROFILE_TABLE
} = require('../../../constants/table.constants');

module.exports = {
  getUserByParam(table, params) {
    return knex(table)
      .first()
      .where(params)
      .join('user_profile', `${table}.userId`, '=', 'user_profile.userId');
  },

  insertUser(user) {
    return knex.transaction(trx => {
      const {
        firstName,
        lastName,
        phones,
        email,
        emails,
        password,
        userType
      } = user;
      let userId;

      return knex(USER_TABLE)
        .transacting(trx)
        .insert({ email, password, userType })
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
          return knex(USER_EMAIL_TABLE).transacting(trx).insert(emailMap);
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
          return knex(USER_PHONE_TABLE).transacting(trx).insert(phoneMap);
        })
        .then(() => {
          const profile = {
            userId,
            firstName,
            lastName,
            status: constants.StatusTypes.Pause
          };
          const profileIds = knex(USER_PROFILE_TABLE).transacting(trx).insert(profile);
          return Promise.all([userId, profileIds]);
        })
        .then(trx.commit)
        .catch(trx.rollback);
    });
  },

  editUser(userId, user) {
    return knex.transaction(trx => {
      const {
        firstName,
        lastName,
        password,
        addresses
      } = user;

      return knex(USER_PROFILE_TABLE)
        .transacting(trx)
        .where({ userId })
        .update({ firstName, lastName })
        .then(() => knex(USER_TABLE).transacting(trx).where({ userId }).update({ password }))
        .then(() => knex(USER_ADDRESS_TABLE).transacting(trx).where({ userId }).del())
        .then(() => {
          const addressMap = addresses.map(address => {
            return {
              userId,
              ...address
            };
          });
          const addressIds = knex(USER_ADDRESS_TABLE).transacting(trx).insert(addressMap);
          return Promise.all([userId, addressIds]);
        })
        .then(trx.commit)
        .catch(trx.rollback);
    });
  },

  addBusinessInfo(userId, businessInfo) {
    return knex.transaction(trx => {
      const {
        companyName,
        companyAddress,
        city,
        state,
        zip,
        website,
        userRole
      } = businessInfo;
      let companyId;

      return knex(COMPANY_PROFILE_TABLE)
        .transacting(trx)
        .insert({ companyName, website })
        .then(companyIds => {
          companyId = companyIds[0];
          knex(COMPANY_ADDRESS_TABLE).transacting(trx).insert({ companyId, companyAddress, city, state, zip });
        })
        .then(() => {
          const userCompanyIds = knex(USER_COMPANY_TABLE).transacting(trx).insert({ userId, companyId, userRole });
          return Promise.all([companyId, userCompanyIds]);
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
