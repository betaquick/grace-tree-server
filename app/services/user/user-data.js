'use strict';
const { UserStatus, RoleTypes } = require('@betaquick/grace-tree-constants');

const knex = require('knex')(require('../../../db/knexfile').getKnexInstance());
const {
  USER_TABLE,
  USER_EMAIL_TABLE,
  USER_PHONE_TABLE,
  USER_ADDRESS_TABLE,
  USER_PROFILE_TABLE,
  USER_COMPANY_TABLE,
  USER_PRODUCT_TABLE,
  COMPANY_ADDRESS_TABLE,
  COMPANY_PROFILE_TABLE
} = require('../../../constants/table.constants');

const userData = {
  getUserByParam(table, params) {
    return knex(table)
      .first()
      .where(params)
      .join('user_profile', `${table}.userId`, '=', 'user_profile.userId');
  },

  getUserEmail(userId) {
    const params = { primary: 1 };

    return userData.getUserByParam(USER_EMAIL_TABLE, { 'user_email.userId': userId, ...params });
  },

  getUserPhone(userId) {
    const params = { primary: 1 };

    return userData.getUserByParam(USER_PHONE_TABLE, { 'user_phone.userId': userId, ...params });
  },

  getUserEmails(userId) {
    return knex(USER_EMAIL_TABLE)
      .select('emailAddress', 'primary')
      .where({ userId });
  },

  getUserPhones(userId) {
    return knex(USER_PHONE_TABLE)
      .select('phoneNumber', 'primary', 'phoneType')
      .where({ userId });
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
            status: UserStatus.Pause
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
        email,
        phones,
        emails
      } = user;

      return knex(USER_PROFILE_TABLE)
        .transacting(trx)
        .where({ userId })
        .update({ firstName, lastName })
        .then(() => knex(USER_TABLE).transacting(trx).where({ userId }).update({ email, password }))
        .then(() => knex(USER_EMAIL_TABLE).transacting(trx).where({ userId }).del())
        .then(() => knex(USER_PHONE_TABLE).transacting(trx).where({ userId }).del())
        .then(() => {
          const emailMap = emails.map(e => {
            const { emailAddress, primary } = e;
            return {
              userId,
              emailAddress,
              primary,
              isVerified: true
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
              phoneType,
              isVerified: true
            };
          });
          return knex(USER_PHONE_TABLE).transacting(trx).insert(phoneMap);
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
        website
      } = businessInfo;
      let companyId;

      return knex(COMPANY_PROFILE_TABLE)
        .transacting(trx)
        .insert({ companyName, website })
        .then(companyIds => {
          companyId = companyIds[0];
          return knex(COMPANY_ADDRESS_TABLE).transacting(trx).insert({ companyId, companyAddress, city, state, zip });
        })
        .then(() => {
          const userCompanyIds = knex(USER_COMPANY_TABLE).transacting(trx).insert({ userId, companyId, userRole: RoleTypes.Admin });
          return Promise.all([companyId, userCompanyIds]);
        })
        .then(trx.commit)
        .catch(trx.rollback);
    });
  },

  addDeliveryInfo(userId, deliveryInfo) {
    return knex.transaction(trx => {
      const {
        userProducts,
        address
      } = deliveryInfo;

      return knex(USER_ADDRESS_TABLE)
        .transacting(trx)
        .insert({ userId, ...address })
        .then(() => {
          const userProductMap = userProducts.map(product => {
            return {userId, ...product };
          });
          return knex(USER_PRODUCT_TABLE).transacting(trx).insert(userProductMap);
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

module.exports = userData;
