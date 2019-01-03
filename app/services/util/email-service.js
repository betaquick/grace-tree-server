'use strict';

const nodemailer = require('nodemailer');
const aws = require('aws-sdk');

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
    throwError(422, err.message);
  }
};

const sendResetMail = options => {
  const mailOptions = {
    from: process.env.ADMIN_EMAIL, // TODO: Replace with a support email
    to: options.email,
    subject: 'Reset your password',
    text: `Hi ${options.first_name},\n
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
This message has been sent to you because you entered you e-mail address on a verification form. If this wasn't you, please ignore this message.\n
Please click on the following link, or paste this into your browser to complete the process:\n
${process.env.WEB_URL}/verification/email/${options.token}\n
The link is valid for 24 hours and can be used only once.`
  };

  return sendMail(mailOptions);
};

module.exports = {
  sendResetMail,
  sendVerificationMail
};
