import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.error || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

// Connection endpoints
export const getConnections = () => api.get('/connections');
export const getConnection = (id) => api.get(`/connections/${id}`);
export const createConnection = (data) => api.post('/connections', data);
export const updateConnection = (id, data) => api.put(`/connections/${id}`, data);
export const deleteConnection = (id) => api.delete(`/connections/${id}`);
export const testConnection = (id) => api.post(`/connections/${id}/test`);
export const getConnectionStats = (id) => api.get(`/connections/${id}/stats`);

// Database endpoints
export const getDatabases = (connectionId) => api.get(`/databases/${connectionId}`);
export const createDatabase = (connectionId, data) => api.post(`/databases/${connectionId}`, data);
export const renameDatabase = (connectionId, dbName, data) => 
  api.put(`/databases/${connectionId}/${dbName}/rename`, data);
export const deleteDatabase = (connectionId, dbName) => 
  api.delete(`/databases/${connectionId}/${dbName}`);
export const getDatabaseStats = (connectionId, dbName) => 
  api.get(`/databases/${connectionId}/${dbName}/stats`);
export const getDatabaseCollections = (connectionId, dbName) => 
  api.get(`/databases/${connectionId}/${dbName}/collections`);

// Collection endpoints
export const getCollections = (connectionId, dbName) => 
  api.get(`/collections/${connectionId}/${dbName}`);
export const createCollection = (connectionId, dbName, data) => 
  api.post(`/collections/${connectionId}/${dbName}`, data);
export const renameCollection = (connectionId, dbName, collectionName, data) => 
  api.put(`/collections/${connectionId}/${dbName}/${collectionName}/rename`, data);
export const deleteCollection = (connectionId, dbName, collectionName) => 
  api.delete(`/collections/${connectionId}/${dbName}/${collectionName}`);
export const getCollectionStats = (connectionId, dbName, collectionName) => 
  api.get(`/collections/${connectionId}/${dbName}/${collectionName}/stats`);
export const getCollectionIndexes = (connectionId, dbName, collectionName) => 
  api.get(`/collections/${connectionId}/${dbName}/${collectionName}/indexes`);
export const createIndex = (connectionId, dbName, collectionName, data) => 
  api.post(`/collections/${connectionId}/${dbName}/${collectionName}/indexes`, data);
export const dropIndex = (connectionId, dbName, collectionName, indexName) => 
  api.delete(`/collections/${connectionId}/${dbName}/${collectionName}/indexes/${indexName}`);

// Document endpoints
export const getDocuments = (connectionId, dbName, collectionName, params = {}) => 
  api.get(`/documents/${connectionId}/${dbName}/${collectionName}`, { params });
export const getDocument = (connectionId, dbName, collectionName, documentId) => 
  api.get(`/documents/${connectionId}/${dbName}/${collectionName}/${documentId}`);
export const createDocument = (connectionId, dbName, collectionName, data) => 
  api.post(`/documents/${connectionId}/${dbName}/${collectionName}`, data);
export const updateDocument = (connectionId, dbName, collectionName, documentId, data) => 
  api.put(`/documents/${connectionId}/${dbName}/${collectionName}/${documentId}`, data);
export const deleteDocument = (connectionId, dbName, collectionName, documentId) => 
  api.delete(`/documents/${connectionId}/${dbName}/${collectionName}/${documentId}`);
export const bulkInsertDocuments = (connectionId, dbName, collectionName, data) => 
  api.post(`/documents/${connectionId}/${dbName}/${collectionName}/bulk`, data);
export const bulkUpdateDocuments = (connectionId, dbName, collectionName, data) => 
  api.put(`/documents/${connectionId}/${dbName}/${collectionName}/bulk`, data);
export const bulkDeleteDocuments = (connectionId, dbName, collectionName, data) => 
  api.delete(`/documents/${connectionId}/${dbName}/${collectionName}/bulk`, data);

// Query endpoints
export const executeQuery = (connectionId, dbName, collectionName, data) => 
  api.post(`/queries/${connectionId}/${dbName}/${collectionName}/query`, data);
export const executeAggregation = (connectionId, dbName, collectionName, data) => 
  api.post(`/queries/${connectionId}/${dbName}/${collectionName}/aggregate`, data);
export const executeCommand = (connectionId, dbName, data) => 
  api.post(`/queries/${connectionId}/${dbName}/command`, data);
export const executeAdminCommand = (connectionId, data) => 
  api.post(`/queries/${connectionId}/admin/command`, data);
export const explainQuery = (connectionId, dbName, collectionName, data) => 
  api.post(`/queries/${connectionId}/${dbName}/${collectionName}/explain`, data);
export const explainAggregation = (connectionId, dbName, collectionName, data) => 
  api.post(`/queries/${connectionId}/${dbName}/${collectionName}/explain-aggregate`, data);

// Monitoring endpoints
export const getSystemInfo = () => api.get('/monitoring/system');
export const getConnectionStatus = (connectionId) => api.get(`/monitoring/${connectionId}/status`);
export const getConnectionMetrics = (connectionId) => api.get(`/monitoring/${connectionId}/metrics`);
export const getConnectionHealth = (connectionId) => api.get(`/monitoring/${connectionId}/health`);
export const getAllDatabasesStats = (connectionId) => api.get(`/monitoring/${connectionId}/databases/stats`);
export const getAllCollectionsStats = (connectionId, dbName) => 
  api.get(`/monitoring/${connectionId}/${dbName}/collections/stats`);

// Health check
export const getHealth = () => api.get('/health');

export default api;