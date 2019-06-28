'use strict';

const { Placeholders, NotificationTypes } = require('@betaquick/grace-tree-constants');

exports.seed = function(knex) {
  return knex('template')
    .truncate()
    .then(() => {
      return knex('template').insert([
        {
          companyId: 1,
          message: `Hi ${Placeholders.RecipientFirstName},\n
          We created you a new crew account in the ${Placeholders.CompanyName}.\n
          To login, go to ${Placeholders.SiteLoginUrl} then enter the following information:\n
          Email: ${Placeholders.NewCrewEmail}\n
          Password: ${Placeholders.NewCrewPassword}\n
          Please be aware that the email and password are case sensitive.\n
          If you have any problem using your credential, please contact ${Placeholders.CompanyName} directly.`,
          notificationType: NotificationTypes.CrewRegistrationEmail
        },
        {
          companyId: 1,
          message: `Hi,\n
          A user has just registered a new account.\n
          Registration was with the following information:\n
          Email: ${Placeholders.RecipientEmail}\n
          Name: ${Placeholders.RecipientFirstName} ${Placeholders.RecipientLastName}.\n
          Phone(s): ${Placeholders.RecipientPhoneNumber}`,
          notificationType: NotificationTypes.UserRegistrationAdminEmail
        },
        {
          companyId: 1,
          message: `Hi ${Placeholders.RecipientFirstName},\n
          This is to notify you that your delivery status is now set to READY, we'll start assigning deliveries to you.`,
          notificationType: NotificationTypes.UserStatusEmail
        },
        {
          companyId: 1,
          message: 'Hi ${Placeholders.RecipientFirstName},\nThis is to notify you of a pending delivery to your address:' +
          Placeholders.RecipientAddress + ', from the crew with the details below:\n' +
          `Company Name: ${Placeholders.CompanyAddress}\n
          Phone Number: ${Placeholders.AssignedUserPhoneNumber}\n
          Additional Information: ${Placeholders.AdditionalRecipientText}`,
          notificationType: NotificationTypes.UserDeliveryEmail
        },
        {
          companyId: 1,
          message: `Hi ${Placeholders.AssignedUserFirstName},\n
          This is to notify you that you can drop your tree products to the user below.\n
          Recipient Name: ${Placeholders.RecipientFirstName}\n
          Phone Number: ${Placeholders.RecipientPhoneNumber}\n
          Address: ${Placeholders.RecipientAddress}\n
          Additional Information: ${Placeholders.AdditionalCompanyText}
          \n\n Thank you.`,
          notificationType: NotificationTypes.CompanyDeliveryEmail
        },
        {
          companyId: 1,
          message: `Hi ${Placeholders.RecipientFirstName},\n
          This is to notify you that ${Placeholders.CompanyName} wants to deliver some products to you.\n
          Please click on the following link, or paste this into your browser to accept the request:\n
          ${Placeholders.DeliveryRequestUrl}\n
          If you are not interested, please ignore this email.`,
          notificationType: NotificationTypes.CompanyDeliveryRequestEmail
        },
        {
          companyId: 1,
          message: `Hi ${Placeholders.AssignedUserFirstName},\n` +
          'This is to notify you that ' + Placeholders.RecipientFirstName + Placeholders.RecipientLastName +
          ' has accepted your delivery request.',
          notificationType: NotificationTypes.DeliveryRequestAcceptanceEmail
        },
        {
          companyId: 1,
          message: `Hi ${Placeholders.RecipientFirstName},\nThis is to notify you that the delivery scheduled by ` +
          Placeholders.CompanyName + ' will expire soon. Please log in to update the status of the delivery.',
          notificationType: NotificationTypes.DeliveryWarningEmail
        },
        {
          companyId: 1,
          message: `This is to notify you that the delivery scheduled by ${Placeholders.CompanyName} will expire tomorrow. Please confirm the delivery by updating the status of the delivery`,
          notificationType: NotificationTypes.DeliveryWarningSMS
        },
        {
          companyId: 1,
          message: 'This is to notify you that your products have been assigned to '
          + Placeholders.CompanyName + '. Please contact them via ' + Placeholders.AssignedUserPhoneNumber,
          notificationType: NotificationTypes.UserDeliverySMS
        },
        {
          companyId: 1,
          message: `You have been assigned ${Placeholders.RecipientFirstName} products for delivery ` +
          `at ${Placeholders.RecipientAddress}. Please contact him/her via ${Placeholders.RecipientPhoneNumber}`,
          notificationType: NotificationTypes.CompanyDeliverySMS
        },
        {
          companyId: 1,
          message: `Click ${Placeholders.DeliveryRequestUrl} to accept the delivery request sent by ${Placeholders.CompanyName}`,
          notificationType: NotificationTypes.DeliveryRequestSMS
        },
        {
          companyId: 1,
          message: `Hi ${Placeholders.AssignedUserFirstName},\n
          This is to notify you that ${Placeholders.RecipientFirstName} ${Placeholders.RecipientLastName} has accepted your delivery request.`,
          notificationType: NotificationTypes.DeliveryRequestAcceptanceEmail
        },
        {
          companyId: 1,
          message: `This is to notify you that ${Placeholders.RecipientFirstName} ${Placeholders.RecipientLastName} has accepted your delivery request.`,
          notificationType: NotificationTypes.DeliveryRequestAcceptanceSMS
        }
      ]);
    });
};
