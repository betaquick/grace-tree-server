'use strict';

const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const verify = require('../middleware/verify');
const role = require('../middleware/role');

const { UserTypes } = require('@betaquick/grace-tree-constants');

const authController = require('../controllers/auth/auth-controller');
const userController = require('../controllers/user/user-controller');
const productController = require('../controllers/product/product-controller');
const deliveryController = require('../controllers/delivery/delivery-controller');
const notificationController = require('../controllers/notification/notification-controller');
const searchController = require('../controllers/search/search-controller');
const templateController = require('../controllers/template/template-controller');

router.get('/', (req, res) => res.json({ title: 'Application API' }));

// Auth API
router.post('/auth/login', authController.login);
router.post('/auth/forgot-password', authController.forgotPassword);
router.get('/auth/reset/:token', authController.getUserByToken);
router.post('/auth/reset-password', authController.resetPassword);
router.post('/auth/register', authController.register);
router.post('/auth/verify', auth, authController.verify);
router.put('/auth/validate/:verifyType/:token', authController.validateToken);

// User API
router.get('/user', auth, role([UserTypes.TreeAdmin]), userController.getReadyUsers);
router.get('/user/company', auth, verify, userController.getCompanyInfo);
router.post('/user/company', auth, userController.addCompanyInfo);
router.put('/user/company', auth, verify, userController.updateCompanyInfo);
router.get('/user/company/crews', auth, verify, userController.getCompanyCrews);
router.post('/user/company/crews', auth, verify, userController.addCompanyCrew);
router.delete('/user/company/crews/:crewId', auth, verify, userController.deleteCompanyCrew);
router.post('/user/new-delivery-info', auth, userController.addDeliveryInfo);
router.get('/user/onboarding', auth, verify, userController.onboarding);
router.post('/user/agreement', auth, userController.acceptAgreement);
router.put('/user/status/:status', auth, verify, userController.updateStatus);
router.put('/user/profile', auth, verify, userController.updateProfile);
router.get('/user/products', auth, verify, userController.getUserProducts);
router.put('/user/products', auth, verify, userController.updateUserProducts);
router.get('/user/address', auth, verify, userController.getUserAddress);
router.put('/user/address', auth, verify, userController.updateUserAddress);

router.get('/search', auth, verify, role([UserTypes.TreeAdmin]), searchController.searchUsers);

router.get('/products', productController.getProducts);

router.get('/notifications', auth, verify, notificationController.getNotifications);
router.get('/notifications/:notificationId', auth, verify, notificationController.getNotification);

// DeliveryAPI
router.post('/user/company/deliveries', auth, deliveryController.createDelivery);
router.put('/user/company/deliveries/:deliveryId', auth, deliveryController.updateDelivery);
router.get('/user/company/deliveries', auth, deliveryController.getCompanyDeliveries);
router.get('/user/company/deliveries/pending', auth, deliveryController.getPendingDeliveries);
router.get('/user/company/deliveries/recent', auth, deliveryController.getRecentDeliveries);
router.put('/user/company/delivery', auth, deliveryController.updateDelivery);
router.get('/user/company/delivery-info/:recipientId', auth, verify, deliveryController.getDeliveryInfo);
router.put('/user/company/add-to-delivery', auth, deliveryController.addUserToDelivery);
router.post('/user/company/remove-from-delivery', auth, deliveryController.removeUserFromDelivery);
router.post('/user/company/delete-delivery', auth, deliveryController.deleteDelivery);
router.get('/user/company/deliveries/:deliveryId', auth, deliveryController.getDelivery);

router.post('/user/deliveries/expire', deliveryController.expireDeliveryJob);

router.get('/user/deliveries', auth, deliveryController.getUserDeliveries);
router.get('/user/deliveries/pending', auth, deliveryController.getPendingDeliveries);
router.get('/user/deliveries/recent', auth, deliveryController.getRecentDeliveries);
router.get('/user/deliveries/:deliveryId', auth, deliveryController.getDelivery);
router.put('/user/deliveries/:deliveryId', auth, deliveryController.updateDeliveryStatus);
router.put('/user/deliveries/:userId/:deliveryId', deliveryController.acceptDeliveryRequest);

router.get('/user/:userId', auth, userController.getUserById);

// Templates API
router.get('/user/company/templates', auth, templateController.listTemplates);
router.get('/user/company/templates/:id', auth, templateController.getTemplate);
router.put('/user/company/templates/:id', auth, templateController.editTemplate);

module.exports = router;
