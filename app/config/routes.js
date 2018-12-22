'use strict';

const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const verify = require('../middleware/verify');

const authController = require('../controllers/auth/auth-controller');
const userController = require('../controllers/user/user-controller');
const productController = require('../controllers/product/product-controller');

router.get('/', (req, res) => res.json({ title: 'Application API' }));

// Auth API
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.post('/auth/verify', auth, authController.verify);
router.put('/auth/validate/:verifyType/:token', auth, authController.validateToken);

// User API
router.get('/user/onboarding', verify, userController.onboarding);
router.post('/user/agreement', auth, userController.acceptAgreement);
router.put('/user/status/:status', auth, userController.updateStatus);
router.put('/user', auth, userController.updateProfile);
router.post('/user/business', auth, userController.addBusinessInfo);
router.post('/user/new-delivery-info', auth, userController.addDeliveryInfo);

// Product API
router.get('/products', productController.getProducts);

module.exports = router;
