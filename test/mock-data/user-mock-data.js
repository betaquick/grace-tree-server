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
  confirmPassword: '1q2w3e4r5t',
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
    street: '1600 Amphitheatre Parkway',
    city: 'Mountain View',
    state: 'CA',
    zip: '90020'
  },
  userProducts: []
};

const invalidUserData = {
  firstName: 'Invalid',
  lastName: 'Invalid'
};

const validCoordinatesData = {
  json: {
    results: [{
      geometry: {
        location: {
          lng: 151.235260,
          lat: -33.737885
        }
      }
    }]
  }
};

const invalidCoordinatesData = {
  json: {
    results: [{
      geometry: {
        location: {
          lng: 151.235260,
          lat: -33.737885
        }
      },
      partial_match: true
    }]
  }
};

const validAddressData = {
  street: '1 Prince Way',
  zip: '100102',
  city: 'Yaba',
  state: 'Lagos',
  deliveryInstruction: 'Please drop it by the door'
};

const inValidAddressData = {
  street: '',
  zip: '100102',
  city: '',
  state: 'Lagos',
  deliveryInstruction: ''
};

const locationServiceMock = {
  asPromise: () => validCoordinatesData
};

module.exports = {
  userData,
  validUserData,
  invalidUserData,
  completeUserData,
  validBusinessData,
  invalidBusinessData,
  validDeliveryData,
  locationServiceMock,
  invalidCoordinatesData,
  validAddressData,
  inValidAddressData
};
