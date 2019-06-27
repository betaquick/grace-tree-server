'use strict';

const { Placeholders } = require('@betaquick/grace-tree-constants');

exports.seed = function(knex) {
  return knex('template')
    .truncate()
    .then(() => {
      return knex('template').insert([
        {
          content: `
          Hi ${Placeholders.RecipientFirstName},
This is to notify you of a pending delivery to your address: ${Placeholders.RecipientAddress}, from the crew with the details below:
Company Name: ${Placeholders.CompanyName}
Phone Number: ${Placeholders.AssignedUserPhoneNumber}
Additional Information: ${Placeholders.AdditionalRecipientText}
          `,
          name: 'Default Email Delivery Notification',
          userId: 1,
          public: 1
        },
        {
          content: `This is to notify you that your products have been assigned to ${Placeholders.CompanyName}. Please contact them via ${Placeholders.AssignedUserPhoneNumber}`,
          name: 'Default SMS Delivery Notification',
          userId: 1,
          public: 1
        }
      ]);
    });
};
