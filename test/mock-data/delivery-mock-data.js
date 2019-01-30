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
  companyId: '1',
  users: [
    1, 2, 3
  ],
  details: ''
};

const inValidDeliveryData = {
  userId: '1',
  companyId: '15',
  details: 'This is a delivery.'
};

const updateDeliveryData = {
  companyId: 1,
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
