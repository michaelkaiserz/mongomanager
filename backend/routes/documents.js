const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const Connection = require('../models/Connection');
const router = express.Router();

// Get documents from a collection
router.get('/:connectionId/:dbName/:collectionName', async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = {}, filter = {} } = req.query;
    const skip = (page - 1) * limit;

    const connection = await Connection.findById(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const uri = buildConnectionUri(connection);
    const client = new MongoClient(uri);
    
    await client.connect();
    const db = client.db(req.params.dbName);
    const collection = db.collection(req.params.collectionName);
    
    // Parse filter and sort
    const parsedFilter = filter ? JSON.parse(filter) : {};
    const parsedSort = sort ? JSON.parse(sort) : {};
    
    const documents = await collection
      .find(parsedFilter)
      .sort(parsedSort)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();
    
    const total = await collection.countDocuments(parsedFilter);
    
    await client.close();

    res.json({
      documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single document
router.get('/:connectionId/:dbName/:collectionName/:documentId', async (req, res) => {
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
    
    const document = await collection.findOne({ _id: new ObjectId(req.params.documentId) });
    
    await client.close();

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new document
router.post('/:connectionId/:dbName/:collectionName', async (req, res) => {
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
    
    const result = await collection.insertOne(req.body);
    
    await client.close();

    res.status(201).json({ 
      message: 'Document created successfully', 
      insertedId: result.insertedId 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update document
router.put('/:connectionId/:dbName/:collectionName/:documentId', async (req, res) => {
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
    
    const result = await collection.updateOne(
      { _id: new ObjectId(req.params.documentId) },
      { $set: req.body }
    );
    
    await client.close();

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ 
      message: 'Document updated successfully', 
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete document
router.delete('/:connectionId/:dbName/:collectionName/:documentId', async (req, res) => {
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
    
    const result = await collection.deleteOne({ _id: new ObjectId(req.params.documentId) });
    
    await client.close();

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ 
      message: 'Document deleted successfully', 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk insert documents
router.post('/:connectionId/:dbName/:collectionName/bulk', async (req, res) => {
  try {
    const { documents } = req.body;
    if (!Array.isArray(documents)) {
      return res.status(400).json({ error: 'Documents must be an array' });
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
    
    const result = await collection.insertMany(documents);
    
    await client.close();

    res.status(201).json({ 
      message: 'Documents created successfully', 
      insertedIds: result.insertedIds,
      insertedCount: result.insertedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk update documents
router.put('/:connectionId/:dbName/:collectionName/bulk', async (req, res) => {
  try {
    const { filter, update, options = {} } = req.body;
    if (!filter || !update) {
      return res.status(400).json({ error: 'Filter and update are required' });
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
    
    const result = await collection.updateMany(filter, update, options);
    
    await client.close();

    res.json({ 
      message: 'Documents updated successfully', 
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk delete documents
router.delete('/:connectionId/:dbName/:collectionName/bulk', async (req, res) => {
  try {
    const { filter } = req.body;
    if (!filter) {
      return res.status(400).json({ error: 'Filter is required' });
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
    
    const result = await collection.deleteMany(filter);
    
    await client.close();

    res.json({ 
      message: 'Documents deleted successfully', 
      deletedCount: result.deletedCount
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