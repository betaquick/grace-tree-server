'use strict';

const client = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const { BitlyClient } = require('bitly');
const error = require('debug')('grace-tree:sms-service:error');

const { throwError } = require('../../controllers/util/controller-util');

const bitly = new BitlyClient('f9e91c00b984ae05f696974a3ed401915cb0f421');

const sendSMS = async smsOptions => {
  try {
    const response = await client.messages.create(smsOptions);
    return response;
  } catch (err) {
    error('Error sending sms', err);
    throwError(422, err.message);
  }
};

const sendVerificationSMS = async options => {
  try {
    const result = await bitly.shorten(`${process.env.WEB_URL}/${options.path}/verification/sms/${options.token}`);
    const smsOptions = {
      from: process.env.TWILIO_PHONE_NUMBER,
      to: options.phoneNumber,
      body: `Click ${result.url} to verify your phone number on ChipDump Services`
    };
    return sendSMS(smsOptions);
  } catch (err) {
    error('Error sending sms', err);
    throw err;
  }
};

const sendStatusNotificationSMS = async options => {
  try {
    const smsOptions = {
      from: process.env.TWILIO_PHONE_NUMBER,
      to: options.phoneNumber,
      body: 'This is to notify that you are READY to start receiving deliveries.'
    };
    return sendSMS(smsOptions);
  } catch (err) {
    error('Error sending sms', err);
    throw err;
  }
};

const sendUserDeliveryNotificationSMS = async(options, body) => {
  try {
    const smsOptions = {
      from: process.env.TWILIO_PHONE_NUMBER,
      to: options.toNumber,
      body: body || `This is to notify you that your products have been assigned to ${options.companyName}. Please contact them via ${options.phoneNumber}`
    };
    return sendSMS(smsOptions);
  } catch (err) {
    error('Error sending sms', err);
    throw err;
  }
};

const sendCompanyDeliveryNotificationSMS = async(options, text) => {
  try {
    const smsOptions = {
      from: process.env.TWILIO_PHONE_NUMBER,
      to: options.toNumber,
      body: text || `You have been assigned ${options.recipientName} products for delivery at ${options.address}. Please contact him/her via ${options.phoneNumber}`
    };
    return sendSMS(smsOptions);
  } catch (err) {
    error('Error sending sms', err);
    throw err;
  }
};

const sendDeliveryRequestNotificationSMS = async(options, text) => {
  try {
    const result = await bitly.shorten(`${process.env.WEB_URL}/request/user/${options.userId}/delivery/${options.deliveryId}`);
    const smsOptions = {
      from: process.env.TWILIO_PHONE_NUMBER,
      to: options.phoneNumber,
      body: text || `Click ${result.url} to accept the delivery request sent by ${options.companyName}`
    };
    return sendSMS(smsOptions);
  } catch (err) {
    error('Error sending sms', err);
    throw err;
  }
};

const sendDeliveryAccceptedNotificationSMS = async(options, text) => {
  try {
    const smsOptions = {
      from: process.env.TWILIO_PHONE_NUMBER,
      to: options.phoneNumber,
      body: text || `This is to notify you that ${options.recipientName} has accepted your delivery request.`
    };
    return sendSMS(smsOptions);
  } catch (err) {
    error('Error sending sms', err);
    throw err;
  }
};

const sendWarningNotificationSMS = async(options, text) => {
  try {
    const smsOptions = {
      from: process.env.TWILIO_PHONE_NUMBER,
      to: options.toNumber,
      body: text || `This is to notify you that the delivery scheduled by ${options.companyName} will expire tomorrow. Please confirm the delivery by updating the status of the delivery`
    };
    return sendSMS(smsOptions);
  } catch (err) {
    error('Error sending sms', err);
    throw err;
  }
};

const sendCrewCreationSMS = async(options, text) => {
  try {
    const smsOptions = {
      from: process.env.TWILIO_PHONE_NUMBER,
      to: options.toNumber,
      body: text || `Hi ${options.firstName},
      We created you a new crew account in the ${options.companyName}.
      To login, go to ${process.env.WEB_URL}/login then enter the following information:
      Email: ${options.email} Password: ${options.password}
      Phone: ${options.phoneNumber}
      Please be aware that the email and password are case sensitive.
      If you have any problem using your credential, please contact ${options.companyName} directly.`
    };
    return sendSMS(smsOptions);
  } catch (err) {
    error('Error sending sms', err);
    throw err;
  }
};


const sendAdminNotificationOfRegistrationInExcelFormat = options => {
  try {
    const addresses = options.addressesAndDeliveryInstructions.map(({address}) => address);
    const deliveryInstructions = options.addressesAndDeliveryInstructions
      .map(({deliveryInstruction}) => deliveryInstruction);
    const smsOptions = {
      from: process.env.TWILIO_PHONE_NUMBER,
      to: process.env.ADMIN_PHONE,
      subject: 'User Registration',
      // eslint-disable-next-line max-len
      text: `${options.products} - ${options.fullname}, ${options.phoneNumbers}, ${addresses}, ${options.email}, ${deliveryInstructions}, ${options.profile.getEstimateInfo ? 'Yes' : 'No'}, ${options.profile.service_needs || 'None'},  ${options.profile.self_pickup ? 'Yes' : 'No'}`
    };
    return sendSMS(smsOptions);
  } catch (err) {
    error('Error sending sms', err);
    throw err;
  }
};

module.exports = {
  twilioClient: client,
  sendVerificationSMS,
  sendStatusNotificationSMS,
  sendUserDeliveryNotificationSMS,
  sendCompanyDeliveryNotificationSMS,
  sendDeliveryRequestNotificationSMS,
  sendDeliveryAccceptedNotificationSMS,
  sendWarningNotificationSMS,
  sendAdminNotificationOfRegistrationInExcelFormat,
  sendCrewCreationSMS
};
