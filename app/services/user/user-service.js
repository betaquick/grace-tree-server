'use strict';

const error = require('debug')('grace-tree:user-service:error');
const debug = require('debug')('grace-tree:user-service:debug');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const _ = require('lodash');
const { UserStatus } = require('@betaquick/grace-tree-constants');

const emailService = require('../messaging/email-service');
const smsService = require('../messaging/sms-service');
const locationService = require('../location/location-service');
const userData = require('./user-data');
const templateHydration = require('../template/template-hydration-service');

const {
  statusValidator,
  businessInfoValidator,
  updateBusinessValidator,
  deliveryInfoValidator,
  userValidator,
  updateUserProductsValidator,
  crewValidator,
  updateAddressValidator
} = require('./user-validation');
const {
  USER_TABLE,
  USER_PROFILE_TABLE,
  USER_COMPANY_TABLE
} = require('../../../constants/table.constants');
const { throwError } = require('./../../controllers/util/controller-util');
const { CrewRegistrationEmail, CrewRegistrationSMS } = require('@betaquick/grace-tree-constants').NotificationTypes;
const { formatPhoneNumber } = require('../util/commonUtils');

// Santize user details for the UI
function sanitizeUser(user) {
  let u = {
    email: user.email,
    emails: user.emails,
    firstName: user.profile.firstName,
    lastName: user.profile.lastName,
    phones: user.phones,
    userId: user.userId,
    userType: user.userType,
    addresses: user.addresses,
    profile: user.profile,
    status: user.status,
    active: user.active
  };
  if (user.company) {
    u.company = user.company;
  }
  return u;
}

const getUserObject = async userId => {

  try {
    const user = await userData.getUserByParam(USER_TABLE, { userId });

    user.emails = await userData.getUserEmails(user.userId);
    user.phones = await userData.getUserPhones(user.userId);
    user.addresses = await userData.getAddresses(user.userId);
    user.profile = await userData.getUserProfile(user.userId);
    user.company = await userData.getCompanyInfoByUserId(userId);

    return sanitizeUser(user);

  } catch (err) {
    error('Unable to fetch user by userId: ', userId);
    throw err;
  }

};

const getReadyUsers = async() => {
  debug('Fetching all ready users');

  try {
    const users = await userData.getReadyUsers();

    return users;
  } catch (err) {
    error('Error fetching users ' + err.message);
    throw err;
  }
};

const getUsersAndProducts = async(conditions = {}) => {
  debug('Fetching users');

  try {
    const users = await userData.getUsersAndProducts(conditions);
    return _.chain(users)
      .groupBy(data => data.userId)
      .map(users => {
        const user = users[0];
        user.productDesc = _.uniq(_.map(users, u => u.productDesc)).filter(desc => desc);
        return _.pick(user, ['userId', 'productDesc', 'firstName', 'lastName', 'status', 'email']);
      });
  } catch (err) {
    error('Error fetching user ' + err.message);
    throw err;
  }
};

const acceptAgreement = async userId => {
  debug('Accept agreement for ' + userId);

  try {
    await Joi.validate(userId, Joi.number().required());
    const params = {agreement: true};

    return await userData.updateUserByParams(USER_PROFILE_TABLE, {userId}, params);

  } catch (err) {
    error('Error accepting agreement', err);
    throw err;
  }
};

const formatAddress = address => {
  if (address) {
    return `${address.street}, ${address.city}, ${address.state}, ${address.zip}`;
  }
  return '';
};


const notifyAdmin = async(userId, user) => {
  const userProducts = await userData.getUserProducts({ userId, status: 1 });
  const products = (userProducts || []).map(p => p.productDesc).join(', ');
  const { emails, firstName, lastName, phones, addresses, profile } = user;
  debug('Notifying admin of ToC acceptance of user with email: ' + user.email + ' with userId: ' + userId);
  const phoneNumbers = phones.map(p => formatPhoneNumber(p.phoneNumber)).join(', ');
  const addressesAndDeliveryInstructions = addresses.map(addr => ({
    address: formatAddress(addr),
    deliveryInstruction: addr.deliveryInstruction
  }));
  const options = {
    email: emails.map(e => e.emailAddress).join(', '),
    fullname: `${firstName} ${lastName}`, profile,
    phoneNumbers, products, addressesAndDeliveryInstructions
  };
  emailService.sendAdminNotificationOfRegistrationInExcelFormat(options);
  smsService.sendAdminNotificationOfRegistrationInExcelFormat(options);
};

const notifyAdminOfEstimateOptIn = async(userId, user) => {
  const { emails, firstName, lastName, phones, addresses, profile } = user;
  debug('Notifying Admin of Written Estimate Info Opt In of user with userId: ', userId);
  const phoneNumbers = phones.map(p => formatPhoneNumber(p.phoneNumber)).join(', ');
  const formattedAddresses = addresses.map(addr => formatAddress(addr)).join(', ');

  const options = {
    email: emails.map(e => e.emailAddress).join(', '),
    fullname: `${firstName} ${lastName}`,
    phoneNumbers, addresses: formattedAddresses,
    service_needs: profile.service_needs
  };
  emailService.sendAdminNotificationOfEstimateOptIn(options);
};

const updateStatus = async(userId, status) => {
  debug('Update status for ' + userId);

  try {
    await Joi.validate({ userId, status }, statusValidator);

    await userData.updateUserByParams(USER_PROFILE_TABLE, { userId }, { status });

    const user = await getUserObject(userId);

    if (user.profile.status === UserStatus.Ready) {
      const options = {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      };

      const phone = _.find(user.phones, p => p.primary);

      emailService.sendStatusNotificationMail(options);
      smsService.sendStatusNotificationSMS({ phoneNumber: phone.phoneNumber });
    }

    return user;
  } catch (err) {
    error('Error updating user status', err);
    throw err;
  }
};

const editUser = async(userId, data) => {
  const { emails, password } = data;
  try {
    await Joi.validate({
      userId,
      ...data
    }, userValidator);

    const emailAddress = _.get(emails[0], 'emailAddress');

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }
    data.email = emailAddress;

    await userData.editUser(userId, data);

    return data;
  } catch (err) {
    error('Error editing user ' + err.message);
    throw err;
  }
};

const addCompanyInfo = async(userId, data) => {
  try {
    await Joi.validate({ userId, ...data }, businessInfoValidator);

    const { companyAddress, city, state, longitude, latitude } = data;
    if (!longitude || !latitude) {
      const address = `${companyAddress}, ${city}, ${state}`;
      const coordinates = await locationService.getCoordinates(address);

      debug(`Google map coordinates for ${address} is: `, coordinates);
      data.longitude = coordinates.lng;
      data.latitude = coordinates.lat;
    }

    const companyIds = await userData.addCompanyInfo(userId, data);

    return {
      companyId: companyIds[0],
      ...data
    };
  } catch (err) {
    error('Error updating business ' + err.message);
    throw err;
  }
};

const updateCompanyInfo = async(userId, company) => {
  try {
    await Joi.validate({ userId, ...company }, updateBusinessValidator);

    const { companyAddress, city, state, longitude, latitude } = company;

    if (!longitude || !latitude) {
      const address = `${companyAddress}, ${city}, ${state}`;
      const coordinates = await locationService.getCoordinates(address);

      debug(`Google map coordinates for ${address} is: `, coordinates);
      company.longitude = coordinates.lng;
      company.latitude = coordinates.lat;
    }

    await userData.updateCompanyInfo(company);

    return company;
  } catch (err) {
    error('Error updating business ' + err.message);
    throw err;
  }
};

const addDeliveryInfo = async(userId, data) => {
  try {
    await Joi.validate({
      userId,
      ...data
    }, deliveryInfoValidator);

    const {
      street,
      city,
      state,
      longitude,
      latitude
    } = data.address;

    if (!longitude || !latitude) {
      const address = `${street}, ${city}, ${state}`;

      const coordinates = await locationService.getCoordinates(address);

      debug(`Google map coordinates for ${address} is: `, coordinates);
      data.address.longitude = coordinates.lng;
      data.address.latitude = coordinates.lat;
    }

    const deliveryIds = await userData.addDeliveryInfo(userId, data);

    return {
      deliveryId: deliveryIds && deliveryIds[0],
      ...data
    };
  } catch (err) {
    error('Error updating delivery info ', err);
    throw err;
  }
};

const getCompanyInfo = async userId => {
  await Joi.validate(userId, Joi.number().required());
  return await userData.getCompanyInfoByUserId(userId);
};

const getCompanyCrews = async userId => {
  await Joi.validate(userId, Joi.number().required());

  const user = await userData.getUserByParam(USER_COMPANY_TABLE, {
    [`${USER_COMPANY_TABLE}.userId`]: userId
  });
  const crews = await userData.getCompanyCrews(user.companyId);

  return crews;
};

const deleteCompanyCrew = async crewId => {
  debug('Delete crew for ' + crewId);

  try {
    await Joi.validate(crewId, Joi.number().required());

    await userData.updateUserByParams(USER_TABLE, {
      userId: crewId
    }, {
      active: false
    });
    return crewId;
  } catch (err) {
    error('Error deleting crew', err);
    throw err;
  }
};

const addCompanyCrew = async(userId, data) => {
  const {
    password,
    email,
    phoneNumber
  } = data;

  try {
    await Joi.validate({
      userId,
      ...data
    }, crewValidator);

    const user = await userData.getUserByParam(USER_TABLE, {
      email
    });
    if (user) {
      debug('Email address has already been taken');
      throwError(422, 'Email address has already been taken');
    }

    data.password = await bcrypt.hash(password, 10);

    const company = await userData.getUserByParam(USER_COMPANY_TABLE, {
      [`${USER_COMPANY_TABLE}.userId`]: userId
    });
    data.companyId = company.companyId;

    const userIds = await userData.addCompanyCrew(data);
    const companyInfo = await userData.getCompanyInfoByUserId(userId);
    const { companyName, companyId } = companyInfo;
    const { firstName, lastName } = data;

    const options = {
      email,
      companyName,
      firstName,
      password,
      phoneNumber
    };
    const hydrationOptions = {
      crew: { password, email, phoneNumber },
      recipient: { firstName, lastName },
      company: companyInfo
    };
    const hydratedText = await templateHydration(companyId, CrewRegistrationEmail, hydrationOptions);
    emailService.sendCrewCreationMail(options, hydratedText);

    const smsOptions = {
      ...options,
      toNumber: phoneNumber
    };

    const hydratedSMS = await templateHydration(companyId, CrewRegistrationSMS, hydrationOptions);
    smsService.sendCrewCreationSMS(smsOptions, hydratedSMS);
    return userIds[0];
  } catch (err) {
    error('Error creating company crew', err);
    throw err;
  }
};

const getUserProducts = async userId => {
  await Joi.validate(userId, Joi.number().required());
  const userProducts = await userData.getUserProducts({ userId });

  return userProducts;
};

const updateUserProducts = async(userId, userProducts) => {
  try {
    await Joi.validate({
      userId,
      userProducts
    }, updateUserProductsValidator);
    await userData.updateUserProducts(userId, userProducts);

    return await userData.getUserProducts({ userId });
  } catch (err) {
    error('Error updating user products ' + err.message);
    throw err;
  }
};

const updateUserAddress = async(userId, data) => {
  try {
    debug('Updating user address for userId: ', userId);
    await Joi.validate(data, updateAddressValidator);

    const { street, city, state, longitude, latitude } = data;
    if (!longitude || !latitude) {
      const coords = await getCoordinates(street, city, state);
      debug(`Google map coordinates for ${street}, ${city}, ${state} is:`, coords);

      data.longitude = coords.longitude;
      data.latitude = coords.latitude;
    }

    data.userId = userId;
    await userData.addOrUpdateAddressInfo(data);
    return data;
  } catch (err) {
    error('Error updating user address ' + err.message);
    throw err;
  }
};

const deactivateUser = async(userId) => {
  try {
    return await userData.deactivateUser(userId);
  } catch (err) {
    error('Error deactivating user ' + err.message);
    throw err;
  }
};

const getUserAddress = async(userId) => {
  try {
    return await userData.getAddresses(userId);
  } catch (err) {
    error('Error fetching user address ' + err.message);
    throw err;
  }
};

const getCoordinates = async(street, city, state) => {
  const coordinates = await locationService.getCoordinates(`${street}, ${city}, ${state}`);
  return {
    longitude: coordinates.lng,
    latitude: coordinates.lat
  };
};

module.exports = {
  getUserObject,
  acceptAgreement,
  updateStatus,
  editUser,
  addCompanyInfo,
  updateCompanyInfo,
  addDeliveryInfo,
  getCompanyInfo,
  addCompanyCrew,
  getCompanyCrews,
  deleteCompanyCrew,
  getUserProducts,
  updateUserProducts,
  getUserAddress,
  updateUserAddress,
  deactivateUser,
  getCoordinates,
  getReadyUsers,
  notifyAdmin,
  notifyAdminOfEstimateOptIn,
  getUsersAndProducts
};
