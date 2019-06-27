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
This is to notify you of a pending delivery to your address: ${Placeholders.RECIPIENTADDRESS}, from the crew with the details below:
Company Name: ${Placeholders.CompanyName}
Phone Number: ${Placeholders.ASSIGNEDUSERPHONENUMBER}
Additional Information: ${Placeholders.ADDITIONALRECIPIENTTEXT}
          `,
          name: 'Default Delivery Notification: To User',
          userId: 1,
          public: 1
        },
        {
          content: `
          Hi ${Placeholders.RECIPIENTFIRSTNAME},
This is to notify you that you can drop your tree products to the user below.
Recipient Name: ${Placeholders.RECIPIENTFIRSTNAME}
Phone Number: ${Placeholders.RECIPIENTPHONENUMBER}
Address: ${Placeholders.RECIPIENTADDRESS}
Additional Information: ${Placeholders.ADDITIONALCOMPANYTEXT}

Thank you.
          `,
          name: 'Default Delivery Notification: To Crew',
          userId: 1,
          public: 1
        }
      ]);
    });
};
