const express = require('express');
const { MongoClient } = require('mongodb');
const Connection = require('../models/Connection');
const router = express.Router();

// Get all collections for a database
router.get('/:connectionId/:dbName', async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const uri = buildConnectionUri(connection);
    const client = new MongoClient(uri);
    
    await client.connect();
    const db = client.db(req.params.dbName);
    const collections = await db.listCollections().toArray();
    
    await client.close();

    res.json(collections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new collection
router.post('/:connectionId/:dbName', async (req, res) => {
  try {
    const { name, options = {} } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Collection name is required' });
    }

    const connection = await Connection.findById(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const uri = buildConnectionUri(connection);
    const client = new MongoClient(uri);
    
    await client.connect();
    const db = client.db(req.params.dbName);
    await db.createCollection(name, options);
    
    await client.close();

    res.json({ message: 'Collection created successfully', name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rename collection
router.put('/:connectionId/:dbName/:collectionName/rename', async (req, res) => {
  try {
    const { newName } = req.body;
    if (!newName) {
      return res.status(400).json({ error: 'New collection name is required' });
    }

    const connection = await Connection.findById(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const uri = buildConnectionUri(connection);
    const client = new MongoClient(uri);
    
    await client.connect();
    const db = client.db(req.params.dbName);
    await db.collection(req.params.collectionName).rename(newName);
    
    await client.close();

    res.json({ 
      message: 'Collection renamed successfully', 
      oldName: req.params.collectionName, 
      newName 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete collection
router.delete('/:connectionId/:dbName/:collectionName', async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const uri = buildConnectionUri(connection);
    const client = new MongoClient(uri);
    
    await client.connect();
    const db = client.db(req.params.dbName);
    await db.collection(req.params.collectionName).drop();
    
    await client.close();

    res.json({ 
      message: 'Collection deleted successfully', 
      name: req.params.collectionName 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get collection stats
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

// Get collection indexes
router.get('/:connectionId/:dbName/:collectionName/indexes', async (req, res) => {
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
    const indexes = await collection.indexes();
    
    await client.close();

    res.json(indexes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create index
router.post('/:connectionId/:dbName/:collectionName/indexes', async (req, res) => {
  try {
    const { keys, options = {} } = req.body;
    if (!keys) {
      return res.status(400).json({ error: 'Index keys are required' });
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
    const result = await collection.createIndex(keys, options);
    
    await client.close();

    res.json({ message: 'Index created successfully', result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Drop index
router.delete('/:connectionId/:dbName/:collectionName/indexes/:indexName', async (req, res) => {
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
    await collection.dropIndex(req.params.indexName);
    
    await client.close();

    res.json({ message: 'Index dropped successfully' });
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