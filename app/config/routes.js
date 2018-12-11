'use strict';

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth/auth-controller');

router.get('/', (req, res) => res.json({ title: 'Application API' }));

// Auth API
router.post('/auth/register', authController.register);

module.exports = router;
