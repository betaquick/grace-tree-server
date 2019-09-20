'use strict';

const error = require('debug')('grace-tree:utils:error');
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

module.exports = {
  formatPhoneNumber: (phoneNumber) => {
    try {
      const number = phoneUtil.parseAndKeepRawInput(phoneNumber, 'US');
      const paranthesesFormat = phoneUtil.formatInOriginalFormat(number, 'US');
      // https://github.com/google/libphonenumber/pull/2307
      return paranthesesFormat.replace('(', '').replace(')', '').replace(' ', '-');
    } catch (err) {
      error('Error formatting Phone number: ', err);
      return phoneNumber;
    }
  }
};
