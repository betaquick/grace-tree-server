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
    const result = await bitly.shorten(`${process.env.WEB_URL}/verification/sms/${options.token}`);
    const smsOptions = {
      from: process.env.TWILIO_PHONE_NUMBER,
      to: options.phoneNumber,
      body: `Click ${result.url} to verify your phone number on Grace Tree Services`
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

module.exports = {
  sendVerificationSMS,
  sendStatusNotificationSMS
};
