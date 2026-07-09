const User = require('../models/User');
const Order = require('../models/Order');

// GET /api/users  (admin)
async function getAllUsers(req, res) {
  const users = await User.find({}).select('-password').sort({ createdAt: -1 });
  res.json({ users });
}

// GET /api/users/agents  (admin) - for the assign-order dropdown
async function getAgents(req, res) {
  const agents = await User.find({ role: 'agent', isActive: true }).select('-password');
  res.json({ agents });
}

// PATCH /api/users/:id/status  (admin) - activate/deactivate an account
async function setUserActive(req, res) {
  const { isActive } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.json({ user });
}

// GET /api/users/reports  (admin) - simple performance snapshot
async function getReports(req, res) {
  const [statusCounts, agents] = await Promise.all([
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    User.find({ role: 'agent' }).select('-password')
  ]);

  const totalOrders = statusCounts.reduce((sum, s) => sum + s.count, 0);
  const delivered = statusCounts.find((s) => s._id === 'delivered')?.count || 0;
  const rto = statusCounts.find((s) => s._id === 'rto')?.count || 0;
  const cancelled = statusCounts.find((s) => s._id === 'cancelled')?.count || 0;
  const resolved = delivered + rto + cancelled;
  const onTimeRate = resolved > 0 ? Math.round((delivered / resolved) * 100) : null;

  const perAgent = await Order.aggregate([
    { $match: { assignedAgent: { $ne: null } } },
    { $group: { _id: '$assignedAgent', total: { $sum: 1 }, delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } } } }
  ]);

  const perAgentWithNames = perAgent.map((row) => {
    const agent = agents.find((a) => a._id.toString() === row._id.toString());
    return { agentId: row._id, name: agent?.name || 'Unknown', total: row.total, delivered: row.delivered };
  });

  res.json({ totalOrders, statusCounts, onTimeRate, perAgent: perAgentWithNames });
}

module.exports = { getAllUsers, getAgents, setUserActive, getReports };
