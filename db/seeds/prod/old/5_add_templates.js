'use strict';


const { Placeholders, NotificationTypes } = require('@betaquick/grace-tree-constants');
const { TEMPLATE_TABLE, COMPANY_PROFILE_TABLE } = require('../../../constants/table.constants');

exports.seed = async function(knex, Promise) {
  const companyIds = await knex(COMPANY_PROFILE_TABLE).select('companyId');

  const newTemplateData = [];

  companyIds.forEach(({ companyId }) => {
    newTemplateData.push(...([
      {
        message: `Hi ${Placeholders.RecipientFirstName},\n
        We created you a new crew account in the ${Placeholders.CompanyName}.\n
        To login, go to ${Placeholders.SiteLoginUrl} then enter the following information:\n
        Email: ${Placeholders.NewCrewEmail}\n
        Password: ${Placeholders.NewCrewPassword}\n
        Please be aware that the email and password are case sensitive.\n
        If you have any problem using your credential, please contact ${Placeholders.CompanyName} directly.`,
        notificationType: 'CREW REGISTRATION SMS'
      },
      {
        message: `Hi,\n
        A user has just registered a new account.\n
        Registration was with the following information:\n
        Email: ${Placeholders.RecipientEmail}\n
        Name: ${Placeholders.RecipientFirstName} ${Placeholders.RecipientLastName}.\n
        Phone(s): ${Placeholders.RecipientPhoneNumber}`,
        notificationType: 'NOTIFY ADMIN OF USER REGISTRATION SMS'
      },
      {
        message: 'This is to notify that you are READY to start receiving deliveries.',
        notificationType: 'USER STATUS UPDATE SMS'
      }
    ].map(data => ({ ...data, companyId }))));
  });


  return knex(TEMPLATE_TABLE)
    .insert(newTemplateData);
};
