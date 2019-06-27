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
    text: `Hi ${options.firstName},\n
We created you a new crew account in the ${options.companyName}.\n
To login, go to ${process.env.WEB_URL}/login then enter the following information:\n
Email: ${options.email}\n
Password: ${options.password}\n
Please be aware that the email and password are case sensitive.\n
If you have any problem using your credential, please contact ${options.companyName} directly.`
  };

  return sendMail(mailOptions);
};

const sendAdminNotificationOfRegistration = options => {
  const mailOptions = {
    from: process.env.ADMIN_EMAIL,
    to: process.env.ADMIN_EMAIL,
    subject: 'User Registration',
    text: `Hi,\n
    A user has just registered a new account.\n
    Registration was with the following information:\n
    Email: ${options.email}\n
    Name: ${options.fullname}.\n
    Phone(s): ${options.phoneNumbers}`
  };

  return sendMail(mailOptions);
};

const sendStatusNotificationMail = options => {
  const mailOptions = {
    from: process.env.ADMIN_EMAIL, // TODO: Replace with a support email
    to: options.email,
    subject: 'Status notification on GTS',
    text: `Hi ${options.firstName},\n
This is to notify you that your delivery status is now set to READY, we'll start assigning deliveries to you.`
  };

  return sendMail(mailOptions);
};

const sendUserDeliveryNotificationMail = (options, text) => {
  const mailOptions = {
    from: process.env.ADMIN_EMAIL, // TODO: Replace with a support email
    to: options.email,
    subject: 'Scheduled Delivery Notification',
    text: text || `Hi ${options.firstName},\n
This is to notify you of a pending delivery to your address: ${options.address}, from the crew with the details below:\n
Company Name: ${options.companyName}\n
Phone Number: ${options.phoneNumber}\n
Additional Information: ${options.additionalRecipientText}`
  };
  return sendMail(mailOptions);
};

const sendCompanyDeliveryNotificationMail = (options, text) => {
  const mailOptions = {
    from: process.env.ADMIN_EMAIL, // TODO: Replace with a support email
    to: options.email,
    subject: 'Scheduled Delivery Notification',
    text: text || `Hi ${options.firstName},\n
This is to notify you that you can drop your tree products to the user below.\n
Recipient Name: ${options.recipientName}\n
Phone Number: ${options.phoneNumber}\n
Address: ${options.address}\n
Additional Information: ${options.additionalCompanyText}
\n\n Thank you.`
  };

  return sendMail(mailOptions);
};

const sendDeliveryRequestNotificationMail = options => {
  const mailOptions = {
    from: process.env.ADMIN_EMAIL, // TODO: Replace with a support email
    to: options.email,
    subject: 'Delivery Request Notification',
    text: `Hi ${options.firstName},\n
This is to notify you that ${options.companyName} wants to deliver some products to you.\n
Please click on the following link, or paste this into your browser to accept the request:\n
${process.env.WEB_URL}/request/user/${options.userId}/delivery/${options.deliveryId}\n
If you are not interested, please ignore this email.`
  };

  return sendMail(mailOptions);
};

const sendDeliveryAccceptedNotificationMail = options => {
  const mailOptions = {
    from: process.env.ADMIN_EMAIL, // TODO: Replace with a support email
    to: options.email,
    subject: 'Delivery Request Notification',
    text: `Hi ${options.firstName},\n
This is to notify you that ${options.recipientName} has accepted your delivery request.`
  };

  return sendMail(mailOptions);
};

const sendWarningNotificationMail = options => {
  const mailOptions = {
    from: process.env.ADMIN_EMAIL, // TODO: Replace with a support email
    to: options.email,
    subject: 'Delivery Expiry Notification',
    text: `Hi ${options.firstName},\n
This is to notify you that the delivery scheduled by ${options.companyName} will expire soon. Please log in to update the status of the delivery.`
  };

  return sendMail(mailOptions);
};

module.exports = {
  transporter,
  sendResetMail,
  sendVerificationMail,
  sendUserCreationMail,
  sendStatusNotificationMail,
  sendUserDeliveryNotificationMail,
  sendCompanyDeliveryNotificationMail,
  sendDeliveryRequestNotificationMail,
  sendDeliveryAccceptedNotificationMail,
  sendWarningNotificationMail,
  sendAdminNotificationOfRegistration
};
