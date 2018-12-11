'use strict';

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
  phones: [{
    phoneNumber: '+2348143132868',
    primary: true,
    phoneType: 'office'
  }],
  emails: [{
    emailAddress: 'test@gracetreeservices.com',
    primary: true
  }],
  userAddress: '1, Moses Adebayo Street',
  city: 'Ojodu',
  state: 'Lagos',
  zip: '23401',
  deliveryPosition: 'outside',
  description: {
    chips: true,
    grindings: true,
    logs: false,
    rounds: false,
    poplar: true
  },
  selfPickup: 1
};

const invalidUserData = {
  firstName: 'Invalid',
  lastName: 'Invalid',
  userAddress: 'Invalid Address',
  city: 'Invalid',
  state: 'Invalid',
  zip: 'Invalid',
  deliveryPosition: 'invalid',
  selfPickup: 1
};

module.exports = {
  userData,
  validUserData,
  invalidUserData
};
