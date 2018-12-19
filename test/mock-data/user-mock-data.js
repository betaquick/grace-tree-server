'use strict';

const userTypes = require('@betaquick/grace-tree-constants').UserTypes;

const userData = {
  email: 'user@gmail.com',
  first_name: 'Test',
  last_name: 'User',
  phone: '90934534',
  userId: 1
};

const validUserData = {
  firstName: 'Test',
  lastName: 'User',
  password: '1q2w3e4r5t',
  confirmPassword: '1q2w3e4r5t',
  phones: [{
    phoneNumber: '+2348143132868',
    primary: true,
    phoneType: 'office'
  }],
  emails: [{
    emailAddress: 'test@gracetreeservices.com',
    primary: true
  }],
  userType: userTypes.General
};

const completeUserData = {
  firstName: 'Test',
  lastName: 'User',
  password: '1q2w3e4r5t',
  addresses: [{
    userAddress: '1, Moses Adebayo Street',
    city: 'Ojodu',
    state: 'Lagos',
    zip: '23401',
    deliveryInstruction: 'Call me when you get to this address'
  }]
};

const invalidUserData = {
  firstName: 'Invalid',
  lastName: 'Invalid'
};

module.exports = {
  userData,
  validUserData,
  invalidUserData,
  completeUserData
};
