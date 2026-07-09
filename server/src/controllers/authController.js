const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// POST /api/auth/register
// NOTE: accepting `role` from the client is convenient for this demo/dev
// scaffold so you can create a customer, an agent, and an admin to try the
// app end to end. Before production, remove `role` from here and add a
// separate admin-only endpoint for creating agents/admins. See README.
async function register(req, res) {
  try {
    const { name, email, password, phone, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: ['customer', 'agent', 'admin'].includes(role) ? role : 'customer'
    });

    const token = generateToken(user);
    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: 'Could not create account.', error: err.message });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }

    const token = generateToken(user);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: 'Login failed.', error: err.message });
  }
}

// GET /api/auth/me
async function getMe(req, res) {
  res.json({ user: req.user.toSafeObject() });
}

module.exports = { register, login, getMe };
