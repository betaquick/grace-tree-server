'use strict';

const error = require('debug')('grace-tree:user-controller:error');
const debug = require('debug')('grace-tree:user-controller:debug');
const stringify = require('json-stringify-safe');

const userSvc = require('../../services/user/user-service');
const {
  handleError,
  handleSuccess
} = require('../util/controller-util');

module.exports = {

  async getUserById(req, res) {
    const { userId } = req.params;

    try {
      const user = await userSvc.getUserDetails(userId);
      handleSuccess(res, 'User fetched successfully', user);
    } catch (err) {
      handleError(err, res, `Error fetching user with userId: ${userId}`, error);
    }
  },

  getReadyUsers(req, res) {
    userSvc
      .getReadyUsers()
      .then(users => handleSuccess(res, 'Users fetched successful', {
        users
      }))
      .catch(err => handleError(err, res, err.message, error));
  },

  getUsers(req, res) {
    const { term, status } = req.query;
    userSvc
      .getUsers({ term, status })
      .then(users => handleSuccess(res, 'Users fetched successfully', { users }))
      .catch(err => handleError(err, res, err.message, error));
  },

  onboarding(req, res) {
    const {
      user
    } = req;
    handleSuccess(res, 'Onboarding loaded successful', {
      user
    });
  },

  acceptAgreement(req, res) {
    const { userId } = req.user;
    userSvc
      .acceptAgreement(userId)
      .then(() => userSvc.notifyAdmin(userId, req.user))
      .then(() => userSvc.notifyUserOfTermsAcceptance(req.user))
      .then(() => req.user.profile.getEstimateInfo && userSvc.notifyAdminOfEstimateOptIn(userId, req.user))
      .then(() => handleSuccess(res, 'Agreement accepted successful', {
        user: req.user
      }))
      .catch(err => handleError(err, res, err.message, error));
  },

  updateStatus(req, res) {
    const { status } = req.params;
    const { userId } = req.user;

    userSvc
      .updateStatus(userId, status)
      .then(user => handleSuccess(res, 'User status updated successful', {
        user
      }))
      .catch(err => handleError(err, res, err.message, error));
  },

  updateProfile(req, res) {
    const { userId } = req.user;
    const { body } = req;

    debug('Updating user with data: ', stringify(body));

    userSvc
      .editUser(userId, body)
      .then(user =>
        handleSuccess(res, 'User updated successfully', {
          user
        })
      )
      .catch(err => handleError(err, res, 'Error updating user', error));
  },

  addCompanyInfo(req, res) {
    const {
      userId
    } = req.user;
    const {
      body
    } = req;

    debug('Updating business info with data: ', stringify(body));

    userSvc
      .addCompanyInfo(userId, body)
      .then(company =>
        handleSuccess(res, 'Business info updated successfully', {
          company
        })
      )
      .catch(err => handleError(err, res, 'Error updating business info', error));
  },

  updateCompanyInfo(req, res) {
    const {
      userId
    } = req.user;
    const {
      company,
      user
    } = req.body;

    debug('Updating business info with data: ', stringify(req.body));

    let userInfo = user;
    userSvc
      .editUser(userId, user)
      .then(data => {
        userInfo = data;
        return userSvc.updateCompanyInfo(userId, company);
      })
      .then(data => {
        handleSuccess(res, 'Company information updated successfully', {
          company: data,
          user: userInfo
        });
      })
      .catch(err => handleError(err, res, 'Error updating business info', error));
  },

  addDeliveryInfo(req, res) {
    const {
      userId
    } = req.user;
    const {
      body
    } = req;

    debug('Updating delivery info with data: ', stringify(body));

    userSvc
      .addDeliveryInfo(userId, body)
      .then(delivery =>
        handleSuccess(res, 'Delivery info updated successfully', {
          delivery
        })
      )
      .catch(err => handleError(err, res, 'Error updating delivery info', error));
  },

  getCompanyInfo(req, res) {
    const {
      userId
    } = req.user;

    debug('Get business information for: ' + userId);

    userSvc
      .getCompanyInfo(userId)
      .then(company =>
        handleSuccess(res, 'Company info successfully', {
          company
        })
      )
      .catch(err => handleError(err, res, 'Error fetching company info', error));
  },

  getUserProducts(req, res) {
    const { userId } = req.user;

    debug('Get products for: ' + userId);

    userSvc
      .getUserProducts(userId)
      .then(userProducts =>
        handleSuccess(res, 'Get user products successfully', {
          userProducts
        })
      )
      .catch(err => handleError(err, res, 'Error fetching user products', error));
  },

  updateUserProducts(req, res) {
    const {
      userId
    } = req.user;

    debug('Updating user products: ', stringify(req.body));

    userSvc
      .updateUserProducts(userId, req.body)
      .then(userProducts => {
        handleSuccess(res, 'User products updated successfully', {
          userProducts
        });
      })
      .catch(err => handleError(err, res, 'Error updating business info', error));
  },

  addCompanyCrew(req, res) {
    const {
      userId
    } = req.user;
    debug('Add company crew: ', stringify(req.body));

    userSvc
      .addCompanyCrew(userId, req.body)
      .then(crew =>
        handleSuccess(res, 'Company crew created successfully', {
          crew
        })
      )
      .catch(err => handleError(err, res, 'Error creating company crew', error));
  },

  getCompanyCrews(req, res) {
    const {
      userId
    } = req.user;

    debug('List company crews for: ' + userId);

    userSvc
      .getCompanyCrews(userId)
      .then(crews =>
        handleSuccess(res, 'Company crews successfully', {
          crews
        })
      )
      .catch(err => handleError(err, res, 'Error fetching company crews', error));
  },

  deleteCompanyCrew(req, res) {
    const {
      crewId
    } = req.params;
    userSvc
      .deleteCompanyCrew(crewId)
      .then(crewId => handleSuccess(res, 'User status updated successful', {
        crewId
      }))
      .catch(err => handleError(err, res, err.message, error));
  },

  getUserAddress(req, res) {
    const { userId } = req.user;
    userSvc
      .getUserAddress(userId)
      .then(addy => {
        handleSuccess(res, 'Successfully fetched User address.', addy);
      })
      .catch(err => handleError(err, res, 'Error fetching user address', error));
  },

  updateUserAddress(req, res) {
    const {
      userId
    } = req.user;
    const data = req.body;

    userSvc
      .updateUserAddress(userId, data)
      .then(addy => {
        handleSuccess(res, 'User address updated', addy);
      })
      .catch(err => handleError(err, res, 'Error updating user address', error));
  },

  deactivateUser(req, res) {
    const { userId } = req.params;

    userSvc
      .deactivateUser(userId)
      .then(() => handleSuccess(res, 'Successfully deactivated user.', {}))
      .catch(err => handleError(err, res, 'Error deactivating user.', error));
  }
};
