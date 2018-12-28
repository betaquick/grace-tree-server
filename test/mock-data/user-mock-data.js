'use strict';

const { UserTypes } = require('@betaquick/grace-tree-constants');

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
  userType: UserTypes.General
};

const completeUserData = {
  firstName: 'Test',
  lastName: 'User',
  password: '1q2w3e4r5t',
  addresses: [{
    street: '1, Moses Adebayo Street',
    city: 'Ojodu',
    state: 'Lagos',
    zip: '23401',
    deliveryInstruction: 'Call me when you get to this address'
  }]
};

const validBusinessData = {
  companyName: 'Damildinho',
  companyAddress: 'No 7 Mother Theresa street Badore',
  city: 'Ajah',
  state: 'AL',
  website: 'Damildinho',
  zip: '23401'
};

const invalidBusinessData = {
  companyName: 'Invalid',
  companyAddress: 'Invalid Address',
  city: 'Invalid',
  state: 'AL'
};

const validDeliveryData = {
  address: {
    street: '1, Moses Adebayo Street',
    city: 'Ojodu',
    state: 'LA',
    zip: '23401'
  },
  userProducts: []
};

const invalidUserData = {
  firstName: 'Invalid',
  lastName: 'Invalid'
};

module.exports = {
  userData,
  validUserData,
  invalidUserData,
  completeUserData,
  validBusinessData,
  invalidBusinessData,
  validDeliveryData
};
