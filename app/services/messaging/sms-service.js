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

const sendUserDeliveryNotificationSMS = async options => {
  try {
    const smsOptions = {
      from: process.env.TWILIO_PHONE_NUMBER,
      to: options.toNumber,
      body: `This is to notify you that your products have been assigned to ${options.companyName}. Please contact them via ${options.phoneNumber}`
    };
    return sendSMS(smsOptions);
  } catch (err) {
    error('Error sending sms', err);
    throw err;
  }
};

const sendCompanyDeliveryNotificationSMS = async options => {
  try {
    const smsOptions = {
      from: process.env.TWILIO_PHONE_NUMBER,
      to: options.toNumber,
      body: `You have been assigned ${options.recipientName} products for delivery at ${options.address}. Please contact him/her via ${options.phoneNumber}`
    };
    return sendSMS(smsOptions);
  } catch (err) {
    error('Error sending sms', err);
    throw err;
  }
};

const sendDeliveryRequestNotificationSMS = async options => {
  try {
    const result = await bitly.shorten(`${process.env.WEB_URL}/request/user/${options.userId}/delivery/${options.deliveryId}`);
    const smsOptions = {
      from: process.env.TWILIO_PHONE_NUMBER,
      to: options.phoneNumber,
      body: `Click ${result.url} to accept the delivery request sent by ${options.companyName}`
    };
    return sendSMS(smsOptions);
  } catch (err) {
    error('Error sending sms', err);
    throw err;
  }
};

const sendDeliveryAccceptedNotificationSMS = async options => {
  try {
    const smsOptions = {
      from: process.env.TWILIO_PHONE_NUMBER,
      to: options.phoneNumber,
      body: `This is to notify you that ${options.recipientName} has accepted your delivery request.`
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
  sendDeliveryAccceptedNotificationSMS
};
