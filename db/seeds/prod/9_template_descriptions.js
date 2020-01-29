'use strict';


const { NotificationTypes: {
  CompanyDeliveryEmail, CompanyDeliverySMS, CrewRegistrationEmail, CrewRegistrationSMS,
  UserRegistrationAdminEmail, UserRegistrationAdminSMS, UserStatusEmail, UserStatusSMS,
  UserDeliveryEmail, UserDeliverySMS, DeliveryWarningEmail, DeliveryWarningSMS,
  CompanyDeliveryRequestEmail, DeliveryRequestSMS, DeliveryRequestAcceptanceEmail, DeliveryRequestAcceptanceSMS
} } = require('@betaquick/grace-tree-constants');


const descriptionUpdates = [
  { notificationType: CompanyDeliveryEmail, description: 'Email sent to Company / Crew for a scheduled delivery' },
  { notificationType: CompanyDeliverySMS, description: 'SMS sent to Company / Crew for a scheduled delivery' },
  { notificationType: CrewRegistrationEmail, description: 'Email sent to a newly added crew member' },
  { notificationType: CrewRegistrationSMS, description: 'SMS sent to a newly added crew member' },
  { notificationType: UserRegistrationAdminEmail, description: 'Email sent to admin when a new user registers' },
  { notificationType: UserRegistrationAdminSMS, description: 'SMS sent to admin when a new user registers' },
  { notificationType: UserStatusEmail, description: 'Email sent to users when they update their status to READY' },
  { notificationType: UserStatusSMS, description: 'SMS sent to users when they update their status to READY' },
  { notificationType: UserDeliveryEmail, description: 'Email notifying user of pending delivery' },
  { notificationType: UserDeliverySMS, description: 'SMS notifying user of pending delivery' },
  // eslint-disable-next-line max-len
  { notificationType: DeliveryWarningEmail, description: 'Email sent to user when schedule delivery is nearing expiry' },
  { notificationType: DeliveryWarningSMS, description: 'SMS sent to user when schedule delivery is nearing expiry' },
  // eslint-disable-next-line max-len
  { notificationType: CompanyDeliveryRequestEmail, description: 'Email sent to user Arbotrist is making a Delivery Request to' },
  { notificationType: DeliveryRequestSMS, description: 'SMS sent to user Arbotrist is making a Delivery Request to' },
  // eslint-disable-next-line max-len
  { notificationType: DeliveryRequestAcceptanceEmail, description: 'Email sent to Company / Crew when user accepts Delivery Request' },
  // eslint-disable-next-line max-len
  { notificationType: DeliveryRequestAcceptanceSMS, description: 'SMS sent to Company / Crew when user accepts Delivery Request' }
];

exports.seed = knex => {
  return knex.transaction(trx => {
    return Promise.all(descriptionUpdates
      .map(({ notificationType, description }) => knex('template')
        .transacting(trx)
        .where({ notificationType }).update({ description })))
      .then(trx.commit)
      .catch(err => {
        // eslint-disable-next-line no-console
        console.error('An Error occured: ', err);
        trx.rollback(err);
      });
  });
};

