'use strict';

const { UserTypes } = require('@betaquick/grace-tree-constants');

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
  users: [
    1, 2, 3
  ],
  details: 'valid details',
  assignedByUserId: 1
};

const inValidDeliveryData = {
  assignedByUserId: 1,
  assignedToUserId: 15,
  details: 'This is a delivery.'
};

const updateDeliveryData = {
  assignedToUserId: 1,
  details: 'New Deets'
};

const validCompanyData = {
  companyName: 'Damildinho',
  companyAddress: 'No 7 Mother Theresa street Badore',
  city: 'Ajah',
  state: 'AL',
  website: 'Damildinho',
  zip: '23401'
};

module.exports = {
  companyUserData,
  validDeliveryData,
  inValidDeliveryData,
  updateDeliveryData,
  validCompanyData
};
