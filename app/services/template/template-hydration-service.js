'use strict';

const { Placeholders } = require('@betaquick/grace-tree-constants');
const _ = require('lodash');
const templateData = require('./template-data');
const error = require('debug')('grace-tree:template-hydration-service:error');

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
  const defaultAddress = { street: '', city: '', state: '', zip: '' };
  try {
    let { assignedUser, recipient, company, deliveryId, deliveryProducts } = lookup;

    if (!assignedUser) {
      assignedUser = {
        phones: [],
        firstName: '',
        lastName: ''
      };
    }

    if (!recipient) {
      recipient = {
        addresses: [defaultAddress],
        phones: [],
        firstName: '',
        lastName: '',
        userId: ''
      };
    }

    if (!company) {
      company = {
        companyAddress: '',
        city: '', zip: '', state: '',
        companyName: ''
      };
    }
    const { street, city, state, zip } = _.head(recipient.addresses) || defaultAddress;
    const recipientAddress = `${street}, ${city} ${state}, ${zip}`;
    const Cstreet = company.companyAddress;
    const Ccity = company.city;
    const Cstate = company.state;
    const Czip = company.zip;
    const companyAddress = `${Cstreet}, ${Ccity}, ${Cstate}, ${Czip}`;
    const recipientPhone = _.get(_.find((recipient.phones || []), p => p.primary), 'phoneNumber');
    const assignedUserPhone = _.get(_.find((assignedUser.phones || []), p => p.primary), 'phoneNumber');
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
      .replace(new RegExp(Placeholders.NewCrewPhoneNumber, 'g'), (crew || { phoneNumber: '' }.phoneNumber))
      .replace(new RegExp(Placeholders.NewCrewEmail, 'g'), (crew || { email: '' }).email)
      .replace(new RegExp(Placeholders.NewCrewPassword, 'g'), (crew || { password: '' }).password)
      .replace(new RegExp(Placeholders.SiteUrl, 'g'), process.env.WEB_URL)
      .replace(new RegExp(Placeholders.SiteLoginUrl, 'g'), `${process.env.WEB_URL}/login`)
      .replace(new RegExp(Placeholders.DeliveryProducts, 'g'), deliveryProducts || [])
      .replace(new RegExp(Placeholders.DeliveryRequestUrl, 'g'),
        `${process.env.WEB_URL}/request/user/${recipient.userId}/delivery/${deliveryId}`)
      .replace(new RegExp(Placeholders.CompanyName, 'g'), company.companyName)
      .replace(new RegExp(Placeholders.CompanyAddress, 'g'), companyAddress);
  } catch (err) {
    error('Error hydrating template >>> ' + template, err);
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
