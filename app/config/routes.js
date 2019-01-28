'use strict';

const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const verify = require('../middleware/verify');

const authController = require('../controllers/auth/auth-controller');
const userController = require('../controllers/user/user-controller');
const productController = require('../controllers/product/product-controller');
const deliveryController = require('../controllers/delivery/delivery-controller');
const notificationController = require('../controllers/notification/notification-controller');

router.get('/', (req, res) => res.json({ title: 'Application API' }));

// Auth API
router.post('/auth/login', authController.login);
router.post('/auth/forgot-password', authController.forgotPassword);
router.get('/auth/reset/:token', authController.getUserByToken);
router.post('/auth/reset-password', authController.resetPassword);
router.post('/auth/register', authController.register);
// router.post('/auth/verify', auth, authController.verify);
router.put('/auth/validate/:verifyType/:token', authController.validateToken);

// User API
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
router.put('/user', auth, verify, userController.updateProfile);
router.get('/user/products', auth, verify, userController.getUserProducts);
router.put('/user/products', auth, verify, userController.updateUserProducts);

router.get('/products', productController.getProducts);

router.get('/notifications', auth, verify, notificationController.getNotifications);
router.get('/notifications/:notificationId', auth, verify, notificationController.getNotification);

// DeliveryAPI
router.post('/user/company/delivery', auth, deliveryController.createDelivery);
router.get('/user/company/deliveries', auth, deliveryController.getCompanyDeliveries);
router.put('/user/company/delivery', auth, deliveryController.updateDelivery);

router.get('/user/delivery/:deliveryId', auth, deliveryController.getDelivery);
router.put('/user/company/addtodelivery', auth, deliveryController.addUserToDelivery);
router.post('/user/company/removefromdelivery', auth, deliveryController.removeUserFromDelivery);
router.post('/user/company/deletedelivery', auth, deliveryController.deleteDelivery);


module.exports = router;
