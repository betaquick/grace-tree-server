'use strict';

exports.seed = function(knex) {
  return knex('template')
    .truncate()
    .then(() => {
      return knex('template').insert([
        {
          content: `
          Hi {{RECIPIENTFIRSTNAME}},
This is to notify you of a pending delivery to your address: {{RECIPIENTADDRESS}}, from the crew with the details below:
Company Name: {{COMPANYNAME}}
Phone Number: {{ASSIGNEDUSERPHONENUMBER}}
Additional Information: {{ADDITIONALRECIPIENTTEXT}}
          `,
          name: 'Default Delivery Notification: To User',
          userId: 1,
          public: 1
        },
        {
          content: `
          Hi {{RECIPIENTFIRSTNAME}},
This is to notify you that you can drop your tree products to the user below.
Recipient Name: {{RECIPIENTFIRSTNAME}}
Phone Number: {{RECIPIENTPHONENUMBER}}
Address: {{RECIPIENTADDRESS}}
Additional Information: {{ADDITIONALCOMPANYTEXT}}

Thank you.
          `,
          name: 'Default Delivery Notification: To Crew',
          userId: 1,
          public: 1
        }
      ]);
    });
};
