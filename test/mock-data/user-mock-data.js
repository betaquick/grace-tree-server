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
  }]
};

const invalidUserData = {
  firstName: 'Invalid',
  lastName: 'Invalid'
};

module.exports = {
  userData,
  validUserData,
  invalidUserData
};
