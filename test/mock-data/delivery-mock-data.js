'use strict';

const moment = require('moment');
const { UserTypes, DeliveryStatusCodes, UserDeliveryStatus } = require('@betaquick/grace-tree-constants');

const companyUserData = {
  firstName: 'Company One',
  lastName: 'User',
  password: '1q2w3e4r5t',
  confirmPassword: '1q2w3e4r5t',
  phones: [{
    phoneNumber: '+2348143132111',
    primary: true,
    phoneType: 'office'
  }],
  emails: [{
    emailAddress: 'companyone@gracetreeservices.com',
    primary: true
  }],
  userType: UserTypes.General
};


const validDeliveryData = {
  assignedToUserId: 1,
  users: [],
  additionalRecipientText: 'valid additional info',
  additionalCompanyText: 'valid additional info',
  assignedByUserId: 1,
  statusCode: DeliveryStatusCodes.Scheduled,
  userDeliveryStatus: UserDeliveryStatus.Accepted,
  isAssigned: true
};

const inValidDeliveryData = {
  assignedByUserId: 1,
  assignedToUserId: 15,
  details: 'This is a delivery.'
};

const updateDeliveryData = {
  assignedToUserId: 1,
  users: [],
  additionalRecipientText: 'valid additional info',
  additionalCompanyText: 'valid additional info',
  statusCode: DeliveryStatusCodes.Scheduled,
  isAssigned: true
};

const validCompanyData = {
  companyName: 'Damildinho',
  companyAddress: 'No 7 Mother Theresa street Badore',
  city: 'Ajah',
  state: 'AL',
  website: 'Damildinho',
  zip: '23401'
};

const validDeliveries = [{
  assignedToUserId: 1,
  assignedByUserId: 1,
  additionalRecipientText: 'valid additional info',
  additionalCompanyText: 'valid additional info',
  statusCode: DeliveryStatusCodes.Scheduled,
  createdAt: moment().subtract(2, 'days').format('YYYY-MM-DD HH:mm:ss')
}, {
  assignedToUserId: 1,
  assignedByUserId: 1,
  additionalRecipientText: 'valid additional info',
  additionalCompanyText: 'valid additional info',
  statusCode: DeliveryStatusCodes.Scheduled,
  createdAt: moment().subtract(2, 'days').format('YYYY-MM-DD HH:mm:ss')
}, {
  assignedToUserId: 1,
  assignedByUserId: 1,
  additionalRecipientText: 'valid additional info',
  additionalCompanyText: 'valid additional info',
  statusCode: DeliveryStatusCodes.Scheduled,
  createdAt: moment().subtract(3, 'days').format('YYYY-MM-DD HH:mm:ss')
}];

module.exports = {
  companyUserData,
  validDeliveryData,
  inValidDeliveryData,
  updateDeliveryData,
  validCompanyData,
  validDeliveries
};
