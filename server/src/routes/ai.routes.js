const express = require('express');
const protect = require('../middleware/auth');
const allowRoles = require('../middleware/role');
const { chatCustomer } = require('../controllers/aiController');

const router = express.Router();

router.use(protect);

// Customer Chatbot Route
router.post('/customer', allowRoles('customer'), chatCustomer);

// Admin Dispatch AI Route (To be implemented)
// router.post('/admin', allowRoles('admin'), chatAdmin);

module.exports = router;
