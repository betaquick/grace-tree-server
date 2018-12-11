'use strict';

const client = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const { BitlyClient } = require('bitly');

const { throwError } = require('../../controllers/util/controller-util');

const bitly = new BitlyClient('f9e91c00b984ae05f696974a3ed401915cb0f421');

const sendSMS = async smsOptions => {
  try {
    const response = await client.messages.create(smsOptions);
    return response;
  } catch (err) {
    throwError(422, err.message);
  }
};

const sendVerificationSMS = async options => {
  try {
    const result = await bitly.shorten(`${process.env.WEB_URL}/verify/${options.token}`);
    const smsOptions = {
      from: process.env.TWILIO_PHONE_NUMBER,
      to: options.phoneNumber,
      body: `Click ${result.url} to verify your phone number on Grace Tree Services`
    };
    return sendSMS(smsOptions);
  } catch (e) {
    throw e;
  }
};

module.exports = {
  sendVerificationSMS
};
