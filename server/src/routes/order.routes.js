const express = require('express');
const protect = require('../middleware/auth');
const allowRoles = require('../middleware/role');
const {
  createOrder,
  getMyOrders,
  getAgentOrders,
  getAgentHistory,
  getAllOrders,
  getOrderById,
  assignAgent,
  updateStatus
} = require('../controllers/orderController');

const router = express.Router();

router.use(protect);

router.post('/', allowRoles('customer'), createOrder);
router.get('/mine', allowRoles('customer'), getMyOrders);
router.get('/agent/mine', allowRoles('agent'), getAgentOrders);
router.get('/agent/history', allowRoles('agent'), getAgentHistory);
router.get('/', allowRoles('admin'), getAllOrders);
router.get('/:id', getOrderById);
router.patch('/:id/assign', allowRoles('admin'), assignAgent);
router.patch('/:id/status', allowRoles('agent', 'admin'), updateStatus);

module.exports = router;
