'use strict';

const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');

const authController = require('../controllers/auth/auth-controller');

router.get('/', (req, res) => res.json({ title: 'Application API' }));

// Auth API
router.post('/auth/register', authController.register);
router.post('/auth/verify', auth, authController.verify);
router.put('/auth/validate/:verifyType/:token', auth, authController.validateToken);

module.exports = router;
