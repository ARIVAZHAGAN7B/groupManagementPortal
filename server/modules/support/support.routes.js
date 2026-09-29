const express = require('express');
const router = express.Router();
const supportController = require('./support.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

router.post('/chat', authenticate, supportController.chat);
router.get('/suggestions', authenticate, supportController.getSuggestions);

module.exports = router;
