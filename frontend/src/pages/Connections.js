import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Edit, 
  Trash2, 
  TestTube, 
  Copy,
  Eye,
  EyeOff,
  Server,
  Database,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Switch } from '../components/ui/switch';
import { useConnection } from '../contexts/ConnectionContext';
import { formatDate } from '../lib/utils';

const Connections = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState(null);
  const [showPassword, setShowPassword] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    host: 'localhost',
    port: 27017,
    username: '',
    password: '',
    database: 'admin',
    authSource: 'admin',
    ssl: false,
    replicaSet: '',
  });

  const { 
    connections, 
    connectionsLoading, 
    testConnection, 
    createConnection, 
    updateConnection, 
    deleteConnection,
    isTestingConnection,
    isCreatingConnection,
    isUpdatingConnection,
    isDeletingConnection
  } = useConnection();

  const queryClient = useQueryClient();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingConnection) {
      updateConnection({ connectionId: editingConnection._id, data: formData });
    } else {
      createConnection(formData);
    }
    
    setIsDialogOpen(false);
    setEditingConnection(null);
    setFormData({
      name: '',
      host: 'localhost',
      port: 27017,
      username: '',
      password: '',
      database: 'admin',
      authSource: 'admin',
      ssl: false,
      replicaSet: '',
    });
  };

  const handleEdit = (connection) => {
    setEditingConnection(connection);
    setFormData({
      name: connection.name,
      host: connection.host,
      port: connection.port,
      username: connection.username || '',
      password: connection.password || '',
      database: connection.database || 'admin',
      authSource: connection.authSource || 'admin',
      ssl: connection.ssl || false,
      replicaSet: connection.replicaSet || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (connectionId) => {
    if (window.confirm('Are you sure you want to delete this connection?')) {
      deleteConnection(connectionId);
    }
  };

  const handleTest = (connectionId) => {
    testConnection({ connectionId });
  };

  const togglePasswordVisibility = (connectionId) => {
    setShowPassword(prev => ({
      ...prev,
      [connectionId]: !prev[connectionId]
    }));
  };

  const copyConnectionString = (connection) => {
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
    
    navigator.clipboard.writeText(uri);
    toast.success('Connection string copied to clipboard');
  };

  if (connectionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading connections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Connections</h1>
          <p className="text-muted-foreground">
            Manage your MongoDB connections and monitor their status
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingConnection(null);
              setFormData({
                name: '',
                host: 'localhost',
                port: 27017,
                username: '',
                password: '',
                database: 'admin',
                authSource: 'admin',
                ssl: false,
                replicaSet: '',
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Connection
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingConnection ? 'Edit Connection' : 'Add New Connection'}
              </DialogTitle>
              <DialogDescription>
                Configure your MongoDB connection settings
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Connection Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="My MongoDB Server"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Host</label>
                  <Input
                    value={formData.host}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                    placeholder="localhost"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Port</label>
                  <Input
                    type="number"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                    placeholder="27017"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Database</label>
                  <Input
                    value={formData.database}
                    onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                    placeholder="admin"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Username</label>
                  <Input
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Auth Source</label>
                  <Input
                    value={formData.authSource}
                    onChange={(e) => setFormData({ ...formData, authSource: e.target.value })}
                    placeholder="admin"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Replica Set</label>
                  <Input
                    value={formData.replicaSet}
                    onChange={(e) => setFormData({ ...formData, replicaSet: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="ssl"
                  checked={formData.ssl}
                  onCheckedChange={(checked) => setFormData({ ...formData, ssl: checked })}
                />
                <label htmlFor="ssl" className="text-sm font-medium">
                  Enable SSL/TLS
                </label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreatingConnection || isUpdatingConnection}>
                  {editingConnection ? 'Update' : 'Create'} Connection
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {connections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No connections found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by adding your first MongoDB connection
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Connection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {connections.map((connection) => (
            <Card key={connection._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    <CardTitle className="text-lg">{connection.name}</CardTitle>
                  </div>
                  <Badge variant={
                    connection.status === 'connected' ? 'default' :
                    connection.status === 'error' ? 'destructive' : 'secondary'
                  }>
                    {connection.status}
                  </Badge>
                </div>
                <CardDescription>
                  {connection.host}:{connection.port}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Database:</span>
                    <span>{connection.database}</span>
                  </div>
                  {connection.username && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Username:</span>
                      <span>{connection.username}</span>
                    </div>
                  )}
                  {connection.password && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Password:</span>
                      <span className="flex items-center gap-1">
                        {showPassword[connection._id] ? connection.password : '••••••••'}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4"
                          onClick={() => togglePasswordVisibility(connection._id)}
                        >
                          {showPassword[connection._id] ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      </span>
                    </div>
                  )}
                  {connection.lastConnected && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Connected:</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(connection.lastConnected)}
                      </span>
                    </div>
                  )}
                </div>

                {connection.errorMessage && (
                  <div className="p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">{connection.errorMessage}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(connection._id)}
                    disabled={isTestingConnection}
                  >
                    <TestTube className="h-4 w-4 mr-1" />
                    Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyConnectionString(connection)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy URI
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(connection)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(connection._id)}
                    disabled={isDeletingConnection}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Connections;