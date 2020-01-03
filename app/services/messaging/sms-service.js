'use strict';

const client = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const { BitlyClient } = require('bitly');
const error = require('debug')('grace-tree:sms-service:error');

const { throwError } = require('../../controllers/util/controller-util');

const bitly = new BitlyClient('f9e91c00b984ae05f696974a3ed401915cb0f421');

// TODO (oneeyedsunday) move to .env process.env.SILENT_SMS_ERRORS
/**
 * @description Flag denoting whether errors should be silenced
 * @description when set, sms errors will be caught by methods using sendSMS
 * @type {Boolean}
 */
const SILENT_ERRORS = true;

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
    backgroundOp(sendSMS, smsOptions);
  } catch (err) {
    error('Error sending sms', err);
    if (!SILENT_ERRORS) throw err;
  }
};

const sendStatusNotificationSMS = async options => {
  try {
    const smsOptions = {
      from: process.env.TWILIO_PHONE_NUMBER,
      to: options.phoneNumber,
      body: 'This is to notify that you are READY to start receiving deliveries.'
    };
    backgroundOp(sendSMS, smsOptions);
  } catch (err) {
    error('Error sending sms', err);
    if (!SILENT_ERRORS) throw err;
  }
};

const sendUserDeliveryNotificationSMS = async(options, body) => {
  try {
    const smsOptions = {
      from: process.env.TWILIO_PHONE_NUMBER,
      to: options.toNumber,
      // eslint-disable-next-line max-len
      body: body || `This is to notify you that your products have been assigned to ${options.companyName}. Please contact them via ${options.phoneNumber}`
    };
    backgroundOp(sendSMS, smsOptions);
  } catch (err) {
    error('Error sending sms', err);
    if (!SILENT_ERRORS) throw err;
  }
};

const sendCompanyDeliveryNotificationSMS = async(options, text) => {
  try {
    const smsOptions = {
      from: process.env.TWILIO_PHONE_NUMBER,
      to: options.toNumber,
      // eslint-disable-next-line max-len
      body: text || `You have been assigned ${options.recipientName} products for delivery at ${options.address}. Please contact him/her via ${options.phoneNumber}`
    };
    backgroundOp(sendSMS, smsOptions);
  } catch (err) {
    error('Error sending sms', err);
    if (!SILENT_ERRORS) throw err;
  }
};

const sendDeliveryRequestNotificationSMS = async(options, text) => {
  try {
    const result = await bitly
      .shorten(`${process.env.WEB_URL}/request/user/${options.userId}/delivery/${options.deliveryId}`);
    const smsOptions = {
      from: process.env.TWILIO_PHONE_NUMBER,
      to: options.phoneNumber,
      body: text || `Click ${result.url} to accept the delivery request sent by ${options.companyName}`
    };
    backgroundOp(sendSMS, smsOptions);
  } catch (err) {
    error('Error sending sms', err);
    if (!SILENT_ERRORS) throw err;
  }
};

const sendDeliveryAccceptedNotificationSMS = async(options, text) => {
  try {
    const smsOptions = {
      from: process.env.TWILIO_PHONE_NUMBER,
      to: options.phoneNumber,
      body: text || `This is to notify you that ${options.recipientName} has accepted your delivery request.`
    };
    backgroundOp(sendSMS, smsOptions);
  } catch (err) {
    error('Error sending sms', err);
    if (!SILENT_ERRORS) throw err;
  }
};

const sendWarningNotificationSMS = async(options, text) => {
  try {
    const smsOptions = {
      from: process.env.TWILIO_PHONE_NUMBER,
      to: options.toNumber,
      // eslint-disable-next-line max-len
      body: text || `This is to notify you that the delivery scheduled by ${options.companyName} will expire tomorrow. Please confirm the delivery by updating the status of the delivery`
    };
    backgroundOp(sendSMS, smsOptions);
  } catch (err) {
    error('Error sending sms', err);
    if (!SILENT_ERRORS) throw err;
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
    backgroundOp(sendSMS, smsOptions);
  } catch (err) {
    error('Error sending sms', err);
    if (!SILENT_ERRORS) throw err;
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
      body: `${options.products} - ${options.fullname}, ${options.phoneNumbers}, ${addresses}, ${options.email}, ${deliveryInstructions}, ${options.profile.getEstimateInfo ? 'Yes' : 'No'}, ${options.profile.service_needs || 'None'},  ${options.profile.self_pickup ? 'Yes' : 'No'}`
    };
    backgroundOp(sendSMS, smsOptions);
  } catch (err) {
    error('Error sending sms: ', err);
    if (!SILENT_ERRORS) throw err;
    throw err;
  }
};


/**
 * @description handles a "background" task (a method returning a promise that isnt awaited)
 * @description will rethrow any caught error if `SILENT_ERRORS` is unset
 * @description will log all errors regardless
 * @description async ERRORS thrown cannot be caught from the calling method except awaited
 * @description all errors thrown from `op` will now be `ASYNC`
 * @param  {() => Promise<any>} op   Function to be performed
 * @param  {[any, any]} args variable number of arguments to the operation to be performed
 * @return {Promise<void>}
 */
async function backgroundOp(op, ...args) {
  try {
    await op(...args);
  } catch (err) {
    error('Error from backgroundOp: >>> ', err);
    // NOTE throwing errors here will result in UnhandledPromiseRejectionWarning: in the node process
    if (!SILENT_ERRORS) throw err;
  }
}

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
