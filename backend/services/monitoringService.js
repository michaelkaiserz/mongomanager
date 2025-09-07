const { MongoClient } = require('mongodb');
const Connection = require('../models/Connection');
const si = require('systeminformation');

class MonitoringService {
  constructor() {
    this.metrics = new Map();
    this.alerts = [];
  }

  async checkAllConnections(activeConnections) {
    try {
      const connections = await Connection.find({ isActive: true });
      
      for (const connection of connections) {
        await this.checkConnectionHealth(connection, activeConnections);
      }
    } catch (error) {
      console.error('Error checking connections:', error);
    }
  }

  async checkConnectionHealth(connection, activeConnections) {
    try {
      const uri = this.buildConnectionUri(connection);
      const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000
      });

      const startTime = Date.now();
      await client.connect();
      await client.db('admin').admin().ping();
      const responseTime = Date.now() - startTime;
      
      const admin = client.db().admin();
      const serverStatus = await admin.serverStatus();
      
      await client.close();

      // Update connection status
      connection.status = 'connected';
      connection.lastConnected = new Date();
      connection.errorMessage = '';
      connection.uptime = serverStatus.uptime;
      await connection.save();

      // Store metrics
      const metrics = {
        timestamp: new Date().toISOString(),
        responseTime,
        connections: serverStatus.connections,
        memory: serverStatus.mem,
        operations: serverStatus.opcounters,
        network: serverStatus.network,
        uptime: serverStatus.uptime
      };

      this.metrics.set(connection._id.toString(), metrics);

      // Send real-time update via WebSocket
      const ws = activeConnections.get(connection._id.toString());
      if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({
          type: 'metrics',
          connectionId: connection._id.toString(),
          data: metrics
        }));
      }

      // Check for alerts
      this.checkAlerts(connection, metrics);

    } catch (error) {
      // Update connection status with error
      connection.status = 'error';
      connection.errorMessage = error.message;
      await connection.save();

      // Send error via WebSocket
      const ws = activeConnections.get(connection._id.toString());
      if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({
          type: 'error',
          connectionId: connection._id.toString(),
          error: error.message
        }));
      }

      console.error(`Connection ${connection.name} health check failed:`, error.message);
    }
  }

  checkAlerts(connection, metrics) {
    const alerts = [];

    // High response time alert
    if (metrics.responseTime > 1000) {
      alerts.push({
        type: 'high_response_time',
        message: `High response time: ${metrics.responseTime}ms`,
        severity: 'warning',
        connectionId: connection._id,
        connectionName: connection.name
      });
    }

    // High memory usage alert
    if (metrics.memory && metrics.memory.resident > 1000) {
      alerts.push({
        type: 'high_memory_usage',
        message: `High memory usage: ${metrics.memory.resident}MB`,
        severity: 'warning',
        connectionId: connection._id,
        connectionName: connection.name
      });
    }

    // High connection count alert
    if (metrics.connections && metrics.connections.current > 100) {
      alerts.push({
        type: 'high_connection_count',
        message: `High connection count: ${metrics.connections.current}`,
        severity: 'warning',
        connectionId: connection._id,
        connectionName: connection.name
      });
    }

    // Store alerts
    this.alerts.push(...alerts);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  getMetrics(connectionId) {
    return this.metrics.get(connectionId);
  }

  getAllMetrics() {
    return Object.fromEntries(this.metrics);
  }

  getAlerts() {
    return this.alerts;
  }

  getSystemMetrics() {
    return si.currentLoad()
      .then(cpu => si.mem().then(memory => ({ cpu, memory })))
      .then(({ cpu, memory }) => ({
        cpu: {
          usage: cpu.currentload,
          cores: cpu.cpus.length
        },
        memory: {
          total: memory.total,
          used: memory.used,
          free: memory.free,
          usage: (memory.used / memory.total) * 100
        },
        timestamp: new Date().toISOString()
      }));
  }

  buildConnectionUri(connection) {
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
}

module.exports = new MonitoringService();