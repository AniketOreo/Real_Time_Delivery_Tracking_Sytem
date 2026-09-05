require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const io = require('socket.io-client');
const Order = require('../models/Order');
const User = require('../models/User');

const API_URL = 'http://localhost:5000/api';

// Simple linear interpolation to generate intermediate points between two coordinates
function getInterpolatedPoints(start, end, steps = 20) {
  const points = [];
  const latDiff = (end.lat - start.lat) / steps;
  const lngDiff = (end.lng - start.lng) / steps;

  for (let i = 0; i <= steps; i++) {
    points.push({
      lat: start.lat + latDiff * i,
      lng: start.lng + lngDiff * i,
    });
  }
  return points;
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runSimulation() {
  console.log('--- Virtual Vehicle Simulation ---');
  
  // 1. Connect to DB to fetch an agent and order details directly
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to Database');

  const agentName = process.argv[2];
  let agent;
  if (agentName) {
    agent = await User.findOne({ role: 'agent', name: agentName });
    if (!agent) {
      console.log(`Could not find an agent named "${agentName}"`);
      process.exit(1);
    }
  } else {
    agent = await User.findOne({ role: 'agent' });
  }

  if (!agent) {
    console.log('No agent found. Please create an agent account first.');
    process.exit(1);
  }

  // Login via API to get JWT token
  console.log(`Logging in as Agent: ${agent.email}...`);
  // Since we don't know the plain text password, we will just generate a JWT for the simulation.
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: agent._id, role: agent.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

  // Setup Axios with Token
  const authApi = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` }
  });

  // Fetch agent's active orders
  const { data } = await authApi.get('/orders/agent/mine');
  const activeOrders = data.orders;

  if (activeOrders.length === 0) {
    console.log('Agent has no active orders to simulate. Please create an order and assign it to this agent.');
    process.exit(1);
  }

  const orderId = activeOrders[0]._id;
  console.log(`Found active order: ${activeOrders[0].orderNumber}. Simulating delivery...`);

  // We need to fetch the raw order from DB to get the OTP
  const dbOrder = await Order.findById(orderId);
  const otp = dbOrder.otp;

  // 2. Connect Socket.IO
  const socket = io('http://localhost:5000', {
    auth: { token }
  });

  socket.on('connect', () => {
    console.log('Socket.IO connected as Agent');
  });

  // 3. Update Status to Picked Up -> In Transit -> Out For Delivery
  const statuses = ['picked up', 'in_transit', 'out_for_delivery'];
  for (const s of statuses) {
    // Only update if it's currently at an earlier step
    try {
      await authApi.patch(`/orders/${orderId}/status`, { status: s });
      console.log(`Status updated to: ${s}`);
      await sleep(1000);
    } catch (err) {
      console.log(`Skipped status ${s} (might already be past this step)`);
    }
  }

  // 4. Generate points and "Drive"
  const points = getInterpolatedPoints(dbOrder.pickupLocation, dbOrder.dropoffLocation, 25);
  console.log('Starting GPS movement simulation...');

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    socket.emit('agent:locationUpdate', {
      orderId: orderId,
      lat: p.lat,
      lng: p.lng
    });
    console.log(`[Vehicle] Moved to Lat: ${p.lat.toFixed(5)}, Lng: ${p.lng.toFixed(5)}`);
    await sleep(2000); // Wait 2 seconds between "GPS pings"
  }

  console.log('Arrived at destination!');

  // 5. Submit Delivery with OTP and final coordinates to pass Geofence
  console.log('Submitting delivery confirmation...');
  try {
    await authApi.patch(`/orders/${orderId}/status`, {
      status: 'delivered',
      providedOtp: otp,
      agentLat: points[points.length - 1].lat,
      agentLng: points[points.length - 1].lng
    });
    console.log(`🎉 Order ${dbOrder.orderNumber} successfully delivered!`);
  } catch (err) {
    console.error('Failed to deliver:', err.response?.data?.message || err.message);
  }

  console.log('Simulation complete. Exiting.');
  process.exit(0);
}

runSimulation();
