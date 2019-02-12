'use strict';

const nodemailer = require('nodemailer');
const aws = require('aws-sdk');
const error = require('debug')('grace-tree:email-service:error');

const { throwError } = require('../../controllers/util/controller-util');

// configure AWS SDK
aws.config.loadFromPath(__dirname + '/../../../aws-config.json');

const SES = new aws.SES({
  apiVersion: '2010-12-01'
});

// create Nodemailer SES transporter
const transporter = nodemailer.createTransport({ SES });

const sendMail = async mailOptions => {
  try {
    const response = await transporter.sendMail(mailOptions);
    return response;
  } catch (err) {
    error('Error sending email', err);
    throwError(422, err.message);
  }
};

const sendResetMail = options => {
  const mailOptions = {
    from: process.env.ADMIN_EMAIL, // TODO: Replace with a support email
    to: options.email,
    subject: 'Reset your password',
    text: `Hi ${options.firstName},\n
You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n
Please click on the following link, or paste this into your browser to complete the process:\n
${process.env.WEB_URL}/reset/${options.token}\n
If you did not request this, please ignore this email and your password will remain unchanged.`
  };

  return sendMail(mailOptions);
};

const sendVerificationMail = options => {
  const mailOptions = {
    from: process.env.ADMIN_EMAIL, // TODO: Replace with a support email
    to: options.email,
    subject: 'GTS Email Verification',
    text: `Hi,\n
This message has been sent to you because you entered you e-mail address on a verification form. 
If this wasn't you, please ignore this message.\n
Please click on the following link, or paste this into your browser to complete the process:\n
${process.env.WEB_URL}/${options.path}/verification/email/${options.token}\n
The link is valid for 24 hours and can be used only once.`
  };

  return sendMail(mailOptions);
};

const sendUserCreationMail = options => {
  const mailOptions = {
    from: process.env.ADMIN_EMAIL, // TODO: Replace with a support email
    to: options.email,
    subject: `${options.companyName} Account Registration`,
    text: `Hi, ${options.firstName}\n
We created you a new crew account in the ${options.companyName}.\n
To login, go to ${process.env.WEB_URL}/login then enter the following information:\n
Email: ${options.email}\n
Password: ${options.password}\n
Please be aware that the email and password are case sensitive.\n
If you have any problem using your credential, please contact ${options.companyName} directly.`
  };

  return sendMail(mailOptions);
};

const sendStatusNotificationMail = options => {
  const mailOptions = {
    from: process.env.ADMIN_EMAIL, // TODO: Replace with a support email
    to: options.email,
    subject: 'Status notification on GTS',
    text: `Hi, ${options.firstName}\n
This is to notify you that you moved your status from PAUSE to READY, we'll start assigning deliveries to you.`
  };

  return sendMail(mailOptions);
};

module.exports = {
  transporter,
  sendResetMail,
  sendVerificationMail,
  sendUserCreationMail,
  sendStatusNotificationMail
};
