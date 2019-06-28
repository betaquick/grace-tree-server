'use strict';

const { Placeholders } = require('@betaquick/grace-tree-constants');
const _ = require('lodash');
const templateData = require('./template-data');

/**
 * getTemplateContentForNotification
 * @description  gets the company's template message for a notification
 * @param {number} companyId the id of the company
 * @param {NotificationTypes} notificationType
 * @returns {string} the message content of the notification
 */
const getTemplateContentForNotification = async(companyId, notificationType) => {
  const template = await templateData.getTemplate({ companyId, notificationType });
  return template.message;
};

// ensure this never errors out;
const hydrateTemplate = (template, lookup) => {
  try {
    let { assignedUser, recipient, company, deliveryId } = lookup;

    if (!assignedUser) {
      assignedUser = {
        phones: [],
        firstName: '',
        lastName: ''
      };
    }

    if (!recipient) {
      recipient = {
        addresses: [{ street: '', city: '', state: '', zip: '' }],
        phones: [],
        firstName: '',
        lastName: '',
        userId: ''
      };
    }

    if (!company) {
      company = {
        companyAddress: { street: '', city: '', zip: '', state: '' },
        companyName: ''
      };
    }
    const { street, city, state, zip } = _.head(recipient.addresses);
    const recipientAddress = `${street}, ${city} ${state}, ${zip}`;
    const { street: Cstreet, city: Ccity, state: Cstate, zip: Czip } = company.companyAddress;
    const companyAddress = `${Cstreet}, ${Ccity}, ${Cstate}, ${Czip}`;
    const recipientPhone = _.get(_.find(recipient.phones, p => p.primary), 'phoneNumber');
    const assignedUserPhone = _.get(_.find(assignedUser.phones, p => p.primary), 'phoneNumber');
    let { crew } = lookup;

    return template.replace(new RegExp(Placeholders.RecipientFirstName, 'g'), recipient.firstName)
      .replace(new RegExp(Placeholders.RecipientLastName, 'g'), recipient.lastName)
      .replace(new RegExp(Placeholders.AssignedUserFirstName, 'g'), assignedUser.firstName)
      .replace(new RegExp(Placeholders.AssignedUserLastName, 'g'), assignedUser.lastName)
      .replace(new RegExp(Placeholders.RecipientPhoneNumber, 'g'), recipientPhone)
      .replace(new RegExp(Placeholders.AssignedUserPhoneNumber, 'g'), assignedUserPhone)
      .replace(new RegExp(Placeholders.AdditionalCompanyText, 'g'), lookup.additionalCompanyText || '')
      .replace(new RegExp(Placeholders.AdditionalRecipientText, 'g'), lookup.additionalRecipientText || '')
      .replace(new RegExp(Placeholders.RecipientAddress, 'g'), recipientAddress)
      .replace(new RegExp(Placeholders.NewCrewEmail, 'g'), (crew || { email: '' }).email)
      .replace(new RegExp(Placeholders.NewCrewPassword, 'g'), (crew || { password: '' }).password)
      .replace(new RegExp(Placeholders.SiteUrl, 'g'), process.env.WEB_URL)
      .replace(new RegExp(Placeholders.SiteLoginUrl, 'g'), `${process.env.WEB_URL}/login`)
      .replace(new RegExp(Placeholders.DeliveryRequestUrl, 'g'),
        `${process.env.WEB_URL}/request/user/${recipient.userId}/delivery/${deliveryId}`)
      .replace(new RegExp(Placeholders.CompanyName, 'g'), company.companyName)
      .replace(new RegExp(Placeholders.CompanyAddress, 'g'), companyAddress);
  } catch (error) {
    return null;
  }
};

/**
 * @param {number} companyId - the id of the company
 * @param {NotificationTypes} notificationType - The notification being sent
 * @param {Object} hydrateOptions - Options bag holding data to hydrate template with
 *
 */
module.exports = async(companyId, notificationType, hydrateOptions) => {
  const templateContent = await getTemplateContentForNotification(companyId, notificationType);
  return hydrateTemplate(templateContent, hydrateOptions);
};
