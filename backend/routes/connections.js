const express = require('express');
const mongoose = require('mongoose');
const Connection = require('../models/Connection');
const { MongoClient } = require('mongodb');
const router = express.Router();

// Get all connections
router.get('/', async (req, res) => {
  try {
    const connections = await Connection.find().sort({ createdAt: -1 });
    res.json(connections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single connection
router.get('/:id', async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    res.json(connection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new connection
router.post('/', async (req, res) => {
  try {
    const connection = new Connection(req.body);
    await connection.save();
    res.status(201).json(connection);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update connection
router.put('/:id', async (req, res) => {
  try {
    const connection = await Connection.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    res.json(connection);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete connection
router.delete('/:id', async (req, res) => {
  try {
    const connection = await Connection.findByIdAndDelete(req.params.id);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    res.json({ message: 'Connection deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test connection
router.post('/:id/test', async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const uri = buildConnectionUri(connection);
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });

    await client.connect();
    await client.db('admin').admin().ping();
    await client.close();

    // Update connection status
    connection.status = 'connected';
    connection.lastConnected = new Date();
    connection.errorMessage = '';
    await connection.save();

    res.json({ status: 'connected', message: 'Connection successful' });
  } catch (error) {
    // Update connection status with error
    const connection = await Connection.findById(req.params.id);
    if (connection) {
      connection.status = 'error';
      connection.errorMessage = error.message;
      await connection.save();
    }

    res.status(400).json({ 
      status: 'error', 
      message: error.message 
    });
  }
});

// Connect to MongoDB instance
router.post('/:id/connect', async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const uri = buildConnectionUri(connection);
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });

    await client.connect();
    
    // Store client in request for use in other routes
    req.mongoClient = client;
    req.connectionId = connection._id;

    res.json({ 
      status: 'connected', 
      message: 'Connected successfully',
      connectionId: connection._id
    });
  } catch (error) {
    res.status(400).json({ 
      status: 'error', 
      message: error.message 
    });
  }
});

// Get connection stats
router.get('/:id/stats', async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const uri = buildConnectionUri(connection);
    const client = new MongoClient(uri);
    
    await client.connect();
    const admin = client.db('admin').admin();
    
    const serverStatus = await admin.serverStatus();
    const buildInfo = await admin.buildInfo();
    
    await client.close();

    res.json({
      version: buildInfo.version,
      uptime: serverStatus.uptime,
      connections: serverStatus.connections,
      memory: serverStatus.mem,
      network: serverStatus.network,
      operations: serverStatus.opcounters,
      storage: serverStatus.storageEngine
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function buildConnectionUri(connection) {
  let uri = 'mongodb://';
  
  if (connection.username && connection.password) {
    uri += `${encodeURIComponent(connection.username)}:${encodeURIComponent(connection.password)}@`;
  }
  
  uri += `${connection.host}:${connection.port}`;
  
  if (connection.database) {
    uri += `/${connection.database}`;
  }
  
  const params = [];
  if (connection.authSource) {
    params.push(`authSource=${connection.authSource}`);
  }
  if (connection.ssl) {
    params.push('ssl=true');
  }
  if (connection.replicaSet) {
    params.push(`replicaSet=${connection.replicaSet}`);
  }
  
  if (params.length > 0) {
    uri += '?' + params.join('&');
  }
  
  return uri;
}

module.exports = router;