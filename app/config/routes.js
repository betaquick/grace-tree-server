'use strict';

const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const verify = require('../middleware/verify');

const authController = require('../controllers/auth/auth-controller');
const userController = require('../controllers/user/user-controller');

router.get('/', (req, res) => res.json({ title: 'Application API' }));

// Auth API
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.put('/auth/validate/:verifyType/:token', auth, authController.validateToken);

// User API
router.get('/user/onboarding', auth, verify, userController.onboarding);
router.post('/user/agreement', auth, verify, userController.acceptAgreement);
router.put('/user/status/:status', auth, verify, userController.updateStatus);
router.put('/user', auth, verify, userController.updateProfile);
router.post('/user/business', auth, verify, userController.addBusinessInfo);

module.exports = router;
