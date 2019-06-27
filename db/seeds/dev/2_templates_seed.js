'use strict';

exports.seed = function(knex) {
  return knex('template')
    .truncate()
    .then(() => {
      return knex('template').insert([
        {
          content: `
          Hi {{recipientFirstName}},{{NEWLINE}}
This is to notify you of a pending delivery to your address: {{recipientAddress}, from the crew with the details below:{{NEWLINE}}
Company Name: {{companyName}}{{NEWLINE}}
Phone Number: {{companyPhoneNumber}}{{NEWLINE}}
Additional Information: {{additionalRecipientText}}
          `,
          name: 'Default Delivery Notification: To User',
          userId: 1,
          public: 1
        },
        {
          content: `
          Hi {{recipientFirstName}},{{NEWLINE}}
This is to notify you that you can drop your tree products to the user below.{{NEWLINE}}
Recipient Name: {{RECIPIENTFIRSTNAME}}{{NEWLINE}}
Phone Number: {{RECIPIENTPHONENUMBER}}{{NEWLINE}}
Address: {{RECIPIENTADDRESS}}{{NEWLINE}}
Additional Information: {{ADDITIONALCOMPANYTEXT}}
{{NEWLINE}}{{NEWLINE}} Thank you.
          `,
          name: 'Default Delivery Notification: To Crew',
          userId: 1,
          public: 1
        }
      ]);
    });
};
