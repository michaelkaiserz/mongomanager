import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const ConnectionContext = createContext();

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
};

export const ConnectionProvider = ({ children }) => {
  const [activeConnection, setActiveConnection] = useState(null);
  const [selectedDatabase, setSelectedDatabase] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const queryClient = useQueryClient();

  // Fetch connections
  const { data: connections = [], isLoading: connectionsLoading } = useQuery({
    queryKey: ['connections'],
    queryFn: api.getConnections,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: ({ connectionId }) => api.testConnection(connectionId),
    onSuccess: (data, variables) => {
      toast.success(`Connection "${variables.connectionId}" tested successfully`);
      queryClient.invalidateQueries(['connections']);
    },
    onError: (error) => {
      toast.error(`Connection test failed: ${error.message}`);
    },
  });

  // Create connection mutation
  const createConnectionMutation = useMutation({
    mutationFn: (connectionData) => api.createConnection(connectionData),
    onSuccess: () => {
      toast.success('Connection created successfully');
      queryClient.invalidateQueries(['connections']);
    },
    onError: (error) => {
      toast.error(`Failed to create connection: ${error.message}`);
    },
  });

  // Update connection mutation
  const updateConnectionMutation = useMutation({
    mutationFn: ({ connectionId, data }) => api.updateConnection(connectionId, data),
    onSuccess: () => {
      toast.success('Connection updated successfully');
      queryClient.invalidateQueries(['connections']);
    },
    onError: (error) => {
      toast.error(`Failed to update connection: ${error.message}`);
    },
  });

  // Delete connection mutation
  const deleteConnectionMutation = useMutation({
    mutationFn: (connectionId) => api.deleteConnection(connectionId),
    onSuccess: () => {
      toast.success('Connection deleted successfully');
      queryClient.invalidateQueries(['connections']);
      if (activeConnection?.id === connectionId) {
        setActiveConnection(null);
        setSelectedDatabase(null);
        setSelectedCollection(null);
      }
    },
    onError: (error) => {
      toast.error(`Failed to delete connection: ${error.message}`);
    },
  });

  // Set active connection
  const selectConnection = (connection) => {
    setActiveConnection(connection);
    setSelectedDatabase(null);
    setSelectedCollection(null);
  };

  // Set selected database
  const selectDatabase = (database) => {
    setSelectedDatabase(database);
    setSelectedCollection(null);
  };

  // Set selected collection
  const selectCollection = (collection) => {
    setSelectedCollection(collection);
  };

  // Clear selections
  const clearSelections = () => {
    setActiveConnection(null);
    setSelectedDatabase(null);
    setSelectedCollection(null);
  };

  const value = {
    connections,
    connectionsLoading,
    activeConnection,
    selectedDatabase,
    selectedCollection,
    selectConnection,
    selectDatabase,
    selectCollection,
    clearSelections,
    testConnection: testConnectionMutation.mutate,
    createConnection: createConnectionMutation.mutate,
    updateConnection: updateConnectionMutation.mutate,
    deleteConnection: deleteConnectionMutation.mutate,
    isTestingConnection: testConnectionMutation.isPending,
    isCreatingConnection: createConnectionMutation.isPending,
    isUpdatingConnection: updateConnectionMutation.isPending,
    isDeletingConnection: deleteConnectionMutation.isPending,
  };

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
};