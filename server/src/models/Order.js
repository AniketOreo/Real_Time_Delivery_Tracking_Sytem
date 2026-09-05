const mongoose = require('mongoose');

const STATUSES = [
  'pending',
  'ready_to_ship',
  'picked up',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'failed_attempt',
  'cancelled',
  'rto'
];

const locationSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    pickupAddress: { type: String, required: true },
    dropoffAddress: { type: String, required: true },
    pickupLocation: { type: locationSchema, required: true },
    dropoffLocation: { type: locationSchema, required: true },

    status: { type: String, enum: STATUSES, default: 'pending' },
    currentLocation: {
      lat: Number,
      lng: Number,
      updatedAt: Date
    },
    estimatedDeliveryDate: { type: Date },

    statusHistory: [
      {
        status: { type: String, enum: STATUSES },
        note: String,
        timestamp: { type: Date, default: Date.now }
      }
    ],

    notes: String,
    failureReason: { type: String, default: null },
    otp: { type: String, default: null }
  },
  { timestamps: true }
);

orderSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('Order', orderSchema);
