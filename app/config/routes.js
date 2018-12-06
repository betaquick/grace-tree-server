'use strict';

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.json({ title: 'Application API' }));

module.exports = router;
