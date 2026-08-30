const Order = require('../models/Order');
const User = require('../models/User');

function generateOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `DT-${stamp}-${rand}`;
}

// POST /api/orders  (customer)
async function createOrder(req, res) {
  try {
    const { pickupAddress, dropoffAddress, pickupLocation, dropoffLocation, notes } = req.body;
    if (!pickupAddress || !dropoffAddress || !pickupLocation || !dropoffLocation) {
      return res.status(400).json({ message: 'Pickup and dropoff address and location are required.' });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      customer: req.user._id,
      pickupAddress,
      dropoffAddress,
      pickupLocation,
      dropoffLocation,
      notes,
      otp,
      status: 'pending',
      statusHistory: [{ status: 'pending' }]
    });

    res.status(201).json({ order });
  } catch (err) {
    res.status(500).json({ message: 'Could not place order.', error: err.message });
  }
}

// GET /api/orders/mine  (customer)
async function getMyOrders(req, res) {
  const orders = await Order.find({ customer: req.user._id })
    .populate('assignedAgent', 'name phone')
    .sort({ createdAt: -1 });
  res.json({ orders });
}

// GET /api/orders/agent/mine  (agent)
async function getAgentOrders(req, res) {
  const orders = await Order.find({
    assignedAgent: req.user._id,
    status: { $nin: ['delivered', 'cancelled', 'rto'] }
  })
    .populate('customer', 'name phone')
    .sort({ createdAt: -1 });
  res.json({ orders });
}

// GET /api/orders/agent/history (agent)
async function getAgentHistory(req, res) {
  const orders = await Order.find({
    assignedAgent: req.user._id,
    status: { $in: ['delivered', 'failed_attempt', 'rto'] }
  })
    .populate('customer', 'name phone')
    .sort({ updatedAt: -1 });
  res.json({ orders });
}

// GET /api/orders  (admin)
async function getAllOrders(req, res) {
  const orders = await Order.find({})
    .populate('customer', 'name phone')
    .populate('assignedAgent', 'name phone')
    .sort({ createdAt: -1 });
  res.json({ orders });
}

// GET /api/orders/:id  (customer who owns it, assigned agent, or admin)
async function getOrderById(req, res) {
  const order = await Order.findById(req.params.id)
    .populate('customer', 'name phone')
    .populate('assignedAgent', 'name phone');

  if (!order) return res.status(404).json({ message: 'Order not found.' });

  const isOwner = order.customer._id.toString() === req.user._id.toString();
  const isAssignedAgent = order.assignedAgent && order.assignedAgent._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAssignedAgent && !isAdmin) {
    return res.status(403).json({ message: "You don't have access to this order." });
  }

  res.json({ order });
}

// PATCH /api/orders/:id/assign  (admin)
async function assignAgent(req, res) {
  const { agentId } = req.body;
  const agent = await User.findOne({ _id: agentId, role: 'agent' });
  if (!agent) return res.status(404).json({ message: 'Agent not found.' });

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found.' });

  order.assignedAgent = agent._id;
  if (order.status === 'pending') {
    order.status = 'ready_to_ship';
    order.statusHistory.push({ status: 'ready_to_ship', note: `Assigned to ${agent.name}` });
  }
  await order.save();

  const io = req.app.get('io');
  io.to(`order:${order._id}`).emit('order:statusUpdate', { orderId: order._id, status: order.status });
  io.to('admin').emit('order:updated', { orderId: order._id });

  res.json({ order });
}

// PATCH /api/orders/:id/status  (assigned agent or admin)
async function updateStatus(req, res) {
  const { status, note, failureReason, providedOtp } = req.body;
  if (!Order.STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value.' });
  }

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found.' });

  const isAssignedAgent = order.assignedAgent && order.assignedAgent.toString() === req.user._id.toString();
  if (!isAssignedAgent && req.user.role !== 'admin') {
    return res.status(403).json({ message: "You don't have access to this order." });
  }

  if (status === 'delivered') {
    if (order.otp && providedOtp !== order.otp) {
      return res.status(400).json({ message: 'Invalid OTP provided for delivery.' });
    }
  }

  if (status === 'failed_attempt') {
    if (!failureReason) {
      return res.status(400).json({ message: 'Failure reason is required.' });
    }
    order.failureReason = failureReason;
  }

  order.status = status;
  order.statusHistory.push({ status, note: note || failureReason });
  await order.save();

  const io = req.app.get('io');
  io.to(`order:${order._id}`).emit('order:statusUpdate', {
    orderId: order._id,
    status: order.status,
    statusHistory: order.statusHistory
  });
  io.to('admin').emit('order:updated', { orderId: order._id });

  res.json({ order });
}

module.exports = {
  createOrder,
  getMyOrders,
  getAgentOrders,
  getAgentHistory,
  getAllOrders,
  getOrderById,
  assignAgent,
  updateStatus
};
