const express = require('express');
const protect = require('../middleware/auth');
const allowRoles = require('../middleware/role');
const { getAllUsers, getAgents, setUserActive, getReports } = require('../controllers/userController');

const router = express.Router();

router.use(protect, allowRoles('admin'));

router.get('/', getAllUsers);
router.get('/agents', getAgents);
router.patch('/:id/status', setUserActive);
router.get('/reports/summary', getReports);

module.exports = router;
