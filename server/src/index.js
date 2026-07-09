require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const initSockets = require('./sockets');

const authRoutes = require('./routes/auth.routes');
const orderRoutes = require('./routes/order.routes');
const userRoutes = require('./routes/user.routes');

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: { origin: CLIENT_URL, credentials: true }
});

app.set('io', io);

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);

app.use((req, res) => res.status(404).json({ message: 'Not found.' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on our end.' });
});

initSockets(io);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
