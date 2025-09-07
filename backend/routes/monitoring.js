const express = require('express');
const { MongoClient } = require('mongodb');
const Connection = require('../models/Connection');
const si = require('systeminformation');
const router = express.Router();

// Get system information
router.get('/system', async (req, res) => {
  try {
    const [cpu, memory, load, network] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.loadavg(),
      si.networkStats()
    ]);

    res.json({
      cpu: {
        usage: cpu.currentload,
        cores: cpu.cpus.length,
        load: load
      },
      memory: {
        total: memory.total,
        used: memory.used,
        free: memory.free,
        usage: (memory.used / memory.total) * 100
      },
      network: network[0] || {}
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get MongoDB server status
router.get('/:connectionId/status', async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const uri = buildConnectionUri(connection);
    const client = new MongoClient(uri);
    
    await client.connect();
    const admin = client.db().admin();
    
    const [serverStatus, buildInfo, hostInfo] = await Promise.all([
      admin.serverStatus(),
      admin.buildInfo(),
      admin.hostInfo().catch(() => null)
    ]);
    
    await client.close();

    res.json({
      server: {
        version: buildInfo.version,
        uptime: serverStatus.uptime,
        host: serverStatus.host,
        process: serverStatus.process
      },
      connections: serverStatus.connections,
      memory: serverStatus.mem,
      network: serverStatus.network,
      operations: serverStatus.opcounters,
      storage: serverStatus.storageEngine,
      host: hostInfo
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get database stats for monitoring
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

// Get collection stats for monitoring
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

// Get real-time metrics
router.get('/:connectionId/metrics', async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const uri = buildConnectionUri(connection);
    const client = new MongoClient(uri);
    
    await client.connect();
    const admin = client.db().admin();
    
    const serverStatus = await admin.serverStatus();
    
    await client.close();

    res.json({
      timestamp: new Date().toISOString(),
      connections: serverStatus.connections,
      memory: serverStatus.mem,
      operations: serverStatus.opcounters,
      network: serverStatus.network,
      uptime: serverStatus.uptime
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all databases with stats
router.get('/:connectionId/databases/stats', async (req, res) => {
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
    
    // Get stats for each database
    const databasesWithStats = await Promise.all(
      databases.databases.map(async (db) => {
        try {
          const dbStats = await client.db(db.name).stats();
          return {
            ...db,
            stats: dbStats
          };
        } catch (error) {
          return {
            ...db,
            stats: null,
            error: error.message
          };
        }
      })
    );
    
    await client.close();

    res.json(databasesWithStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all collections with stats for a database
router.get('/:connectionId/:dbName/collections/stats', async (req, res) => {
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
    
    // Get stats for each collection
    const collectionsWithStats = await Promise.all(
      collections.map(async (collection) => {
        try {
          const stats = await db.collection(collection.name).stats();
          return {
            ...collection,
            stats: stats
          };
        } catch (error) {
          return {
            ...collection,
            stats: null,
            error: error.message
          };
        }
      })
    );
    
    await client.close();

    res.json(collectionsWithStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check connection health
router.get('/:connectionId/health', async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const uri = buildConnectionUri(connection);
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });

    const startTime = Date.now();
    await client.connect();
    await client.db('admin').admin().ping();
    const responseTime = Date.now() - startTime;
    await client.close();

    // Update connection status
    connection.status = 'connected';
    connection.lastConnected = new Date();
    connection.errorMessage = '';
    await connection.save();

    res.json({
      status: 'healthy',
      responseTime,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Update connection status with error
    const connection = await Connection.findById(req.params.connectionId);
    if (connection) {
      connection.status = 'error';
      connection.errorMessage = error.message;
      await connection.save();
    }

    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
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