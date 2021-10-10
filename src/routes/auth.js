const express = require('express');

const router = express.Router();

const authController = require('../controllers/authController')

router.post('/register', authController.register)
router.get('/verify/:userId/:uniqueString', authController.verifyEmail)
router.get('/verified', authController.verified)
router.post('/login', authController.login)
router.get('/logout', authController.logout)

module.exports = router;