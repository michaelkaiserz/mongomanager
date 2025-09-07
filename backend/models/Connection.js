const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  host: {
    type: String,
    required: true
  },
  port: {
    type: Number,
    default: 27017
  },
  username: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    default: ''
  },
  database: {
    type: String,
    default: 'admin'
  },
  authSource: {
    type: String,
    default: 'admin'
  },
  ssl: {
    type: Boolean,
    default: false
  },
  replicaSet: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastConnected: {
    type: Date,
    default: Date.now
  },
  uptime: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['connected', 'disconnected', 'error'],
    default: 'disconnected'
  },
  errorMessage: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Connection', connectionSchema);