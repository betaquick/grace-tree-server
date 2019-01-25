'use strict';

const knex = require('knex')(require('../../../db/knexfile').getKnexInstance());
const {
    DELIVERY_TABLE,
    USER_DELIVERY_TABLE
} = require('../../../constants/table.constants');

module.exports = {
    getDeliveries(companyId) {
        return knex(DELIVERY_TABLE)
            .where({ companyId })
            .select('*');
    },

    getDelivery(companyId, deliveryId) {
        return knex(DELIVERY_TABLE)
            .first()
            .where({ companyId, deliveryId })
            .select('*');
    },

    getSingleDelivery(deliveryId) {
        return knex(DELIVERY_TABLE)
            .where({ 'deliveryId': deliveryId })
            .select('*');
    },

    addDelivery(deliveryInfo) {
        return knex.transaction(trx => {
            const {
                companyId,
                details,
                users
            } = deliveryInfo;
            let deliveryId;

            return knex(DELIVERY_TABLE)
                .transacting(trx)
                .insert({ companyId, details })
                .then(deliveryIds => {
                    deliveryId = deliveryIds[0];
                    const userDeliveries = users.map(user => { return { deliveryId, userId: user } });
                    return knex(USER_DELIVERY_TABLE).transacting(trx).insert(userDeliveries);
                })
                .then(trx.commit)
                .catch(trx.rollback);
        });
    },

    updateDelivery(deliveryInfo) {
        return knex.transaction(trx => {
            const {
                deliveryId,
                details
            } = deliveryInfo;

            return knex(DELIVERY_TABLE)
                .transacting(trx)
                .where({ deliveryId })
                .update({ details })
                .then(trx.commit)
                .catch(trx.rollback);
        });
    },


    addUserToDelivery(deliveryId, userId) {
        return knex.transaction(trx => {
            return knex(USER_DELIVERY_TABLE)
                .transacting(trx)
                .insert({ deliveryId, userId })
                .then(trx.commit)
                .catch(trx.rollback);
        });
    },

    removeUserFromDelivery(deliveryId, userId) {
        return knex.transaction(trx => {
            return knex(USER_DELIVERY_TABLE)
                .transacting(trx)
                .where({ deliveryId, userId })
                .del()
                .then(trx.commit)
                .catch(trx.rollback);
        });
    },

    deleteDelivery(deliveryId) {
        return knex.transaction(trx => {
            
            return knex(DELIVERY_TABLE)
                .transacting(trx)
                .where({ deliveryId })
                .del()
                .then(() => knex(USER_DELIVERY_TABLE).transacting(trx).where({ deliveryId }).del())
                .then(trx.commit)
                .catch(trx.rollback);
        });
    }

};
