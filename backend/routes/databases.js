const express = require('express');
const { MongoClient } = require('mongodb');
const Connection = require('../models/Connection');
const router = express.Router();

// Get all databases for a connection
router.get('/:connectionId', async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const uri = buildConnectionUri(connection);
    const client = new MongoClient(uri);
    
    await client.connect();
    const admin = client.db().admin();
    const databases = await admin.listDatabases();
    
    await client.close();

    res.json(databases.databases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new database
router.post('/:connectionId', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Database name is required' });
    }

    const connection = await Connection.findById(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const uri = buildConnectionUri(connection);
    const client = new MongoClient(uri);
    
    await client.connect();
    const db = client.db(name);
    
    // Create a collection to actually create the database
    await db.createCollection('_init');
    await db.collection('_init').drop(); // Remove the init collection
    
    await client.close();

    res.json({ message: 'Database created successfully', name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rename database
router.put('/:connectionId/:dbName/rename', async (req, res) => {
  try {
    const { newName } = req.body;
    if (!newName) {
      return res.status(400).json({ error: 'New database name is required' });
    }

    const connection = await Connection.findById(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const uri = buildConnectionUri(connection);
    const client = new MongoClient(uri);
    
    await client.connect();
    const db = client.db(req.params.dbName);
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    
    // Create new database
    const newDb = client.db(newName);
    
    // Copy all collections to new database
    for (const collection of collections) {
      const data = await db.collection(collection.name).find({}).toArray();
      if (data.length > 0) {
        await newDb.collection(collection.name).insertMany(data);
      }
    }
    
    // Drop old database
    await db.dropDatabase();
    
    await client.close();

    res.json({ message: 'Database renamed successfully', oldName: req.params.dbName, newName });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete database
router.delete('/:connectionId/:dbName', async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const uri = buildConnectionUri(connection);
    const client = new MongoClient(uri);
    
    await client.connect();
    const db = client.db(req.params.dbName);
    await db.dropDatabase();
    
    await client.close();

    res.json({ message: 'Database deleted successfully', name: req.params.dbName });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get database stats
router.get('/:connectionId/:dbName/stats', async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const uri = buildConnectionUri(connection);
    const client = new MongoClient(uri);
    
    await client.connect();
    const db = client.db(req.params.dbName);
    const stats = await db.stats();
    
    await client.close();

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get database collections
router.get('/:connectionId/:dbName/collections', async (req, res) => {
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
    
    // Get collection stats
    const collectionsWithStats = await Promise.all(
      collections.map(async (collection) => {
        const stats = await db.collection(collection.name).stats();
        return {
          ...collection,
          stats: {
            count: stats.count,
            size: stats.size,
            avgObjSize: stats.avgObjSize,
            storageSize: stats.storageSize,
            totalIndexSize: stats.totalIndexSize
          }
        };
      })
    );
    
    await client.close();

    res.json(collectionsWithStats);
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