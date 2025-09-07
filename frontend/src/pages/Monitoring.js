import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Activity, 
  Server, 
  Database, 
  HardDrive, 
  Cpu, 
  MemoryStick,
  Network,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useConnection } from '../contexts/ConnectionContext';
import { formatBytes, formatNumber, formatDuration } from '../lib/utils';
import { 
  getSystemInfo, 
  getConnectionStatus, 
  getConnectionMetrics, 
  getConnectionHealth,
  getAllDatabasesStats,
  getAllCollectionsStats
} from '../services/api';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';

const Monitoring = () => {
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [metricsHistory, setMetricsHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const { connections, activeConnection } = useConnection();

  // System info query
  const { data: systemInfo } = useQuery({
    queryKey: ['system-info'],
    queryFn: getSystemInfo,
    refetchInterval: 5000,
  });

  // Connection status query
  const { data: connectionStatus } = useQuery({
    queryKey: ['connection-status', selectedConnection?.id],
    queryFn: () => getConnectionStatus(selectedConnection.id),
    enabled: !!selectedConnection,
    refetchInterval: 10000,
  });

  // Connection metrics query
  const { data: connectionMetrics } = useQuery({
    queryKey: ['connection-metrics', selectedConnection?.id],
    queryFn: () => getConnectionMetrics(selectedConnection.id),
    enabled: !!selectedConnection,
    refetchInterval: 5000,
  });

  // Connection health query
  const { data: connectionHealth } = useQuery({
    queryKey: ['connection-health', selectedConnection?.id],
    queryFn: () => getConnectionHealth(selectedConnection.id),
    enabled: !!selectedConnection,
    refetchInterval: 30000,
  });

  // Database stats query
  const { data: databaseStats } = useQuery({
    queryKey: ['database-stats', selectedConnection?.id],
    queryFn: () => getAllDatabasesStats(selectedConnection.id),
    enabled: !!selectedConnection,
    refetchInterval: 15000,
  });

  // Update metrics history
  useEffect(() => {
    if (connectionMetrics) {
      const newMetric = {
        timestamp: new Date().toISOString(),
        time: new Date().toLocaleTimeString(),
        ...connectionMetrics
      };
      
      setMetricsHistory(prev => {
        const updated = [...prev, newMetric];
        return updated.slice(-20); // Keep last 20 data points
      });
    }
  }, [connectionMetrics]);

  // Mock data for charts when no real data is available
  const mockPerformanceData = [
    { time: '00:00', cpu: 20, memory: 45, connections: 12, operations: 150 },
    { time: '04:00', cpu: 15, memory: 42, connections: 8, operations: 120 },
    { time: '08:00', cpu: 35, memory: 48, connections: 25, operations: 300 },
    { time: '12:00', cpu: 45, memory: 52, connections: 35, operations: 450 },
    { time: '16:00', cpu: 40, memory: 50, connections: 30, operations: 380 },
    { time: '20:00', cpu: 25, memory: 46, connections: 18, operations: 200 },
  ];

  const chartData = metricsHistory.length > 0 ? metricsHistory : mockPerformanceData;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time monitoring and analytics for your MongoDB instances
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh All
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="databases">Databases</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* System Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System CPU</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemInfo?.cpu?.usage?.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {systemInfo?.cpu?.cores || 0} cores
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <MemoryStick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemInfo?.memory?.usage?.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(systemInfo?.memory?.used || 0)} / {formatBytes(systemInfo?.memory?.total || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
                <Network className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {connections.filter(conn => conn.status === 'connected').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {connections.length} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  {connections.filter(conn => conn.status === 'error').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Connection errors
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle>Connection Status</CardTitle>
              <CardDescription>Current status of all MongoDB connections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {connections.map((connection) => (
                  <div key={connection._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(connection.status)}
                      <div>
                        <div className="font-medium">{connection.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {connection.host}:{connection.port}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={
                        connection.status === 'connected' ? 'default' :
                        connection.status === 'error' ? 'destructive' : 'secondary'
                      }>
                        {connection.status}
                      </Badge>
                      {connection.lastConnected && (
                        <div className="text-sm text-muted-foreground">
                          {formatDuration(Math.floor((Date.now() - new Date(connection.lastConnected)) / 1000))} ago
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedConnection(connection)}
                      >
                        Monitor
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>CPU and Memory usage over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="cpu" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="memory" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>MongoDB Operations</CardTitle>
                <CardDescription>Database operations and connections</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="connections" stroke="#ffc658" strokeWidth={2} />
                    <Line type="monotone" dataKey="operations" stroke="#ff7300" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Connection Details */}
          {selectedConnection && (
            <Card>
              <CardHeader>
                <CardTitle>Connection Details - {selectedConnection.name}</CardTitle>
                <CardDescription>Detailed metrics for selected connection</CardDescription>
              </CardHeader>
              <CardContent>
                {connectionStatus ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <h4 className="font-medium mb-2">Server Info</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Version:</span>
                          <span>{connectionStatus.server?.version}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Uptime:</span>
                          <span>{formatDuration(connectionStatus.server?.uptime || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Host:</span>
                          <span>{connectionStatus.server?.host}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Connections</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Current:</span>
                          <span>{connectionStatus.connections?.current || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Available:</span>
                          <span>{connectionStatus.connections?.available || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Created:</span>
                          <span>{connectionStatus.connections?.totalCreated || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Memory</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Resident:</span>
                          <span>{formatBytes(connectionStatus.memory?.resident * 1024 * 1024 || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Virtual:</span>
                          <span>{formatBytes(connectionStatus.memory?.virtual * 1024 * 1024 || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mapped:</span>
                          <span>{formatBytes(connectionStatus.memory?.mapped * 1024 * 1024 || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Server className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Select a connection to view detailed metrics</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="databases" className="space-y-6">
          {/* Database Statistics */}
          {selectedConnection && databaseStats ? (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Database Statistics - {selectedConnection.name}</CardTitle>
                  <CardDescription>Storage and performance metrics by database</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {databaseStats.map((db) => (
                      <Card key={db.name}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{db.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Collections:</span>
                              <span>{db.stats?.collections || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Data Size:</span>
                              <span>{formatBytes(db.stats?.dataSize || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Storage Size:</span>
                              <span>{formatBytes(db.stats?.storageSize || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Index Size:</span>
                              <span>{formatBytes(db.stats?.indexSize || 0)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Database Size Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Database Sizes</CardTitle>
                  <CardDescription>Storage usage distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={databaseStats.map(db => ({
                          name: db.name,
                          value: db.stats?.dataSize || 0
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {databaseStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatBytes(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Database className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No connection selected</h3>
                <p className="text-muted-foreground text-center">
                  Select a connection from the overview tab to view database statistics
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Current alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {connections.filter(conn => conn.status === 'error').length > 0 ? (
                <div className="space-y-4">
                  {connections.filter(conn => conn.status === 'error').map((connection) => (
                    <div key={connection._id} className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-950">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="font-medium text-red-700 dark:text-red-300">
                          Connection Error
                        </span>
                        <Badge variant="destructive">Error</Badge>
                      </div>
                      <div className="text-sm text-red-600 dark:text-red-400">
                        <div className="font-medium">{connection.name}</div>
                        <div>{connection.host}:{connection.port}</div>
                        {connection.errorMessage && (
                          <div className="mt-1">{connection.errorMessage}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>No active alerts</p>
                  <p className="text-sm">All connections are healthy</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Monitoring;