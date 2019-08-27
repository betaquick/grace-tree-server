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

const sendGenericMail = options => {
  const { to, text, subject } = options;
  const mailOptions = {
    from: process.env.ADMIN_EMAIL,
    to, text, subject
  };

  return sendMail(mailOptions);
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
    subject: 'ChipDump Email Verification',
    text: `Hi,\n
This message has been sent to you because you entered you e-mail address on a verification form. 
If this wasn't you, please ignore this message.\n
Please click on the following link, or paste this into your browser to complete the process:\n
${process.env.WEB_URL}/${options.path}/verification/email/${options.token}\n
The link is valid for 24 hours and can be used only once.`
  };

  return sendMail(mailOptions);
};

// mail sent when a crew member is added
const sendCrewCreationMail = (options, text) => {
  const mailOptions = {
    from: process.env.ADMIN_EMAIL, // TODO: Replace with a support email
    to: options.email,
    subject: `${options.companyName} Account Registration`,
    text: text || `Hi ${options.firstName},\n
We created you a new crew account in the ${options.companyName}.\n
To login, go to ${process.env.WEB_URL}/login then enter the following information:\n
Email: ${options.email}\n
Password: ${options.password}\n
Phone: ${options.phoneNumber}\n
Please be aware that the email and password are case sensitive.\n
If you have any problem using your credential, please contact ${options.companyName} directly.`
  };

  return sendMail(mailOptions);
};

/**
 * @param options.email string
 * @param options.profile.self_pickup boolean
 * @param options.profile.service_needs string | null
 * @param options.profile.getEstimateInfo boolean
 * @param options.products string
 * @param options.phoneNumbers string
 * @param options.addressesAndDeliveryInstructions Array<string>
 * @param options.fullname string
 * @param options Object
 */
const sendAdminNotificationOfRegistrationInExcelFormat = options => {
  const addresses = options.addressesAndDeliveryInstructions.map(({address}) => address);
  // eslint-disable-next-line max-len
  const deliveryInstructions = options.addressesAndDeliveryInstructions.map(({deliveryInstruction}) => deliveryInstruction);
  const mailOptions = {
    from: process.env.ADMIN_EMAIL,
    to: process.env.ADMIN_EMAIL,
    subject: 'User Registration',
    // eslint-disable-next-line max-len
    text: `${options.products} - ${options.fullname}, ${options.phoneNumbers}, ${addresses}, ${options.email}, ${deliveryInstructions}, ${options.profile.getEstimateInfo ? 'Yes' : 'No'}, ${options.profile.service_needs || 'None'},  ${options.profile.self_pickup ? 'Yes' : 'No'}`
  };
  return sendMail(mailOptions);
};

/**
 * @param options.email string
 * @param options.addresses string
 * @param options.phoneNumbers string
 * @param options.fullname string
 * @param options.service_needs string
 * @param options Object
 */
const sendAdminNotificationOfEstimateOptIn = options => {
  // eslint-disable-next-line max-len
  const mailOptions = {
    from: process.env.ADMIN_EMAIL,
    to: process.env.ADMIN_EMAIL,
    subject: 'User Written Estimate Opt In',
    // eslint-disable-next-line max-len
    text: `Hi,\n
    A user has just opted in for written estimates.
    Name: ${options.fullname}
    Email: ${options.email}
    Phone(s): ${options.phoneNumbers}
    Address: ${options.addresses}
    Service Needs: ${options.service_needs}\n
    `
  };
  return sendMail(mailOptions);
};

// mail sent when a normal user registers
// template for this isnt public - do not hydrate

/**
 * @param options.email string
 * @param options.profile.self_pickup boolean
 * @param options.profile.service_needs string | null
 * @param options.profile.getEstimateInfo boolean
 * @param options.profile.products string
 * @param options.profile.phoneNumbers string
 * @param options.addressesAndDeliveryInstructions Array<string>
 * @param options.fullname string
 * @param options Object
 */
const sendAdminNotificationOfRegistration = options => {
  const addressesAndInstructions = options.addressesAndDeliveryInstructions.map(({ address, deliveryInstruction }) => {
    return `
    Address: ${address}\n
    Delivery Instruction: ${deliveryInstruction}\n
    `;
  }).join('');
  const mailOptions = {
    from: process.env.ADMIN_EMAIL,
    to: process.env.ADMIN_EMAIL,
    subject: 'User Registration',
    text: `Hi,\n
    A user has just registered a new account.\n
    Registration was with the following information:\n
    Email: ${options.email}\n
    Name: ${options.fullname}.\n
    Phone: ${options.phoneNumbers}\n
    ${addressesAndInstructions}\n
    Products: ${options.products}\n
    Do you need a free, written estimate for tree service (trimming or removal or for landscaping services)?:\n
    ${options.profile.getEstimateInfo ? 'Yes' : 'No'}\n
    Please tell us a little bit about your tree service need(s):\n
    ${options.profile.service_needs || ''}\n
    Would you like to come to the jobs to pick up wood? (With a truck and/or trailer only, please)?:\n
    ${options.profile.self_pickup ? 'Yes' : 'No'}\n
    `
  };

  return sendMail(mailOptions);
};

// template for this isnt public - do not hydrate
const sendStatusNotificationMail = options => {
  const mailOptions = {
    from: process.env.ADMIN_EMAIL, // TODO: Replace with a support email
    to: options.email,
    subject: 'Status notification on ChipDump',
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


const sendDeliveryRequestNotificationMail = (options, text) => {
  const mailOptions = {
    from: process.env.ADMIN_EMAIL, // TODO: Replace with a support email
    to: options.email,
    subject: 'Delivery Request Notification',
    text: text || `Hi ${options.firstName},\n
    This is to notify you that ${options.companyName} wants to deliver some products to you.\n
    Please click on the following link, or paste this into your browser to accept the request:\n
    ${process.env.WEB_URL}/request/user/${options.userId}/delivery/${options.deliveryId}\n
    If you are not interested, please ignore this email.`
  };

  return sendMail(mailOptions);
};

const sendDeliveryAcceptedNotificationMail = (options, text) => {
  const mailOptions = {
    from: process.env.ADMIN_EMAIL, // TODO: Replace with a support email
    to: options.email,
    subject: 'Delivery Request Notification',
    text: `Hi ${options.firstName},\n
This is to notify you that ${options.recipientName} has accepted your delivery request.`
  };

  return sendMail(mailOptions);
};

const sendWarningNotificationMail = (options, text) => {
  const mailOptions = {
    from: process.env.ADMIN_EMAIL, // TODO: Replace with a support email
    to: options.email,
    subject: 'Delivery Expiry Notification',
    text: text || `Hi ${options.firstName},\n
This is to notify you that the delivery scheduled by ${options.companyName} will expire soon. Please log in to update the status of the delivery.`
  };

  return sendMail(mailOptions);
};

module.exports = {
  transporter,
  sendResetMail,
  sendVerificationMail,
  sendCrewCreationMail,
  sendStatusNotificationMail,
  sendUserDeliveryNotificationMail,
  sendCompanyDeliveryNotificationMail,
  sendDeliveryRequestNotificationMail,
  sendDeliveryAcceptedNotificationMail,
  sendWarningNotificationMail,
  sendAdminNotificationOfRegistration,
  sendAdminNotificationOfRegistrationInExcelFormat,
  sendAdminNotificationOfEstimateOptIn,
  sendGenericMail
};
