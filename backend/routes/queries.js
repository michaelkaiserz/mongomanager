const express = require('express');
const { MongoClient } = require('mongodb');
const Connection = require('../models/Connection');
const router = express.Router();

// Execute query
router.post('/:connectionId/:dbName/:collectionName/query', async (req, res) => {
  try {
    const { query = {}, options = {} } = req.body;

    const connection = await Connection.findById(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const uri = buildConnectionUri(connection);
    const client = new MongoClient(uri);
    
    await client.connect();
    const db = client.db(req.params.dbName);
    const collection = db.collection(req.params.collectionName);
    
    const documents = await collection.find(query, options).toArray();
    
    await client.close();

    res.json({
      documents,
      count: documents.length,
      query,
      options
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute aggregation pipeline
router.post('/:connectionId/:dbName/:collectionName/aggregate', async (req, res) => {
  try {
    const { pipeline = [], options = {} } = req.body;

    if (!Array.isArray(pipeline)) {
      return res.status(400).json({ error: 'Pipeline must be an array' });
    }

    const connection = await Connection.findById(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const uri = buildConnectionUri(connection);
    const client = new MongoClient(uri);
    
    await client.connect();
    const db = client.db(req.params.dbName);
    const collection = db.collection(req.params.collectionName);
    
    const result = await collection.aggregate(pipeline, options).toArray();
    
    await client.close();

    res.json({
      result,
      count: result.length,
      pipeline,
      options
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute database command
router.post('/:connectionId/:dbName/command', async (req, res) => {
  try {
    const { command } = req.body;

    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    const connection = await Connection.findById(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const uri = buildConnectionUri(connection);
    const client = new MongoClient(uri);
    
    await client.connect();
    const db = client.db(req.params.dbName);
    
    const result = await db.command(command);
    
    await client.close();

    res.json({
      result,
      command
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute admin command
router.post('/:connectionId/admin/command', async (req, res) => {
  try {
    const { command } = req.body;

    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    const connection = await Connection.findById(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const uri = buildConnectionUri(connection);
    const client = new MongoClient(uri);
    
    await client.connect();
    const admin = client.db().admin();
    
    const result = await admin.command(command);
    
    await client.close();

    res.json({
      result,
      command
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get query execution stats
router.get('/:connectionId/:dbName/:collectionName/stats', async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const uri = buildConnectionUri(connection);
    const client = new MongoClient(uri);
    
    await client.connect();
    const db = client.db(req.params.dbName);
    const collection = db.collection(req.params.collectionName);
    
    const stats = await collection.stats();
    
    await client.close();

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Explain query execution
router.post('/:connectionId/:dbName/:collectionName/explain', async (req, res) => {
  try {
    const { query = {}, options = {} } = req.body;

    const connection = await Connection.findById(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const uri = buildConnectionUri(connection);
    const client = new MongoClient(uri);
    
    await client.connect();
    const db = client.db(req.params.dbName);
    const collection = db.collection(req.params.collectionName);
    
    const explanation = await collection.find(query, options).explain();
    
    await client.close();

    res.json(explanation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Explain aggregation execution
router.post('/:connectionId/:dbName/:collectionName/explain-aggregate', async (req, res) => {
  try {
    const { pipeline = [], options = {} } = req.body;

    if (!Array.isArray(pipeline)) {
      return res.status(400).json({ error: 'Pipeline must be an array' });
    }

    const connection = await Connection.findById(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const uri = buildConnectionUri(connection);
    const client = new MongoClient(uri);
    
    await client.connect();
    const db = client.db(req.params.dbName);
    const collection = db.collection(req.params.collectionName);
    
    const explanation = await collection.aggregate(pipeline, options).explain();
    
    await client.close();

    res.json(explanation);
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