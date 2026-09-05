const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Order = require('../models/Order');

// Wires up all real-time behavior. Every socket connects with a JWT (same
// one used for the REST API) so we know which user/role is on the other end.
function initSockets(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No auth token provided'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid or expired session'));
    }
  });

  io.on('connection', (socket) => {
    const { user } = socket;

    // Admins get a standing room so they can watch every live delivery at once.
    if (user.role === 'admin') {
      socket.join('admin');
    }
    
    // Join a personal room for direct user notifications
    socket.join(`user:${user._id}`);

    // Anyone tracking a specific order (customer, its agent, or an admin)
    // joins that order's room to receive its location/status events.
    socket.on('joinOrder', (orderId) => {
      socket.join(`order:${orderId}`);
    });

    socket.on('leaveOrder', (orderId) => {
      socket.leave(`order:${orderId}`);
    });

    // Delivery agents push their live position while a delivery is active.
    socket.on('agent:locationUpdate', async ({ orderId, lat, lng }) => {
      if (user.role !== 'agent') return;
      try {
        const order = await Order.findById(orderId);
        if (!order || !order.assignedAgent || order.assignedAgent.toString() !== user._id.toString()) {
          return;
        }

        order.currentLocation = { lat, lng, updatedAt: new Date() };
        await order.save();

        await User.findByIdAndUpdate(user._id, {
          currentLocation: { lat, lng, updatedAt: new Date() }
        });

        const payload = { orderId, lat, lng, updatedAt: order.currentLocation.updatedAt };
        io.to(`order:${orderId}`).emit('order:locationUpdate', payload);
        io.to('admin').emit('order:locationUpdate', payload);
      } catch (err) {
        socket.emit('errorMessage', 'Could not update location.');
      }
    });

    socket.on('disconnect', () => {
      // No-op for now — add presence tracking here if needed later.
    });
  });
}

module.exports = initSockets;
