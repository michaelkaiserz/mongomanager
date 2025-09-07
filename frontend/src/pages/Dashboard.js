import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Database, 
  Server, 
  Activity, 
  AlertTriangle,
  TrendingUp,
  Clock,
  HardDrive
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useConnection } from '../contexts/ConnectionContext';
import { getSystemInfo, getAllDatabasesStats } from '../services/api';
import { formatBytes, formatNumber, formatDuration } from '../lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const { connections, activeConnection } = useConnection();

  // System info query
  const { data: systemInfo } = useQuery({
    queryKey: ['system-info'],
    queryFn: getSystemInfo,
    refetchInterval: 5000,
  });

  // Database stats query
  const { data: databaseStats } = useQuery({
    queryKey: ['database-stats', activeConnection?.id],
    queryFn: () => getAllDatabasesStats(activeConnection.id),
    enabled: !!activeConnection,
    refetchInterval: 10000,
  });

  const connectedConnections = connections.filter(conn => conn.status === 'connected');
  const errorConnections = connections.filter(conn => conn.status === 'error');

  // Mock data for charts
  const performanceData = [
    { time: '00:00', cpu: 20, memory: 45, connections: 12 },
    { time: '04:00', cpu: 15, memory: 42, connections: 8 },
    { time: '08:00', cpu: 35, memory: 48, connections: 25 },
    { time: '12:00', cpu: 45, memory: 52, connections: 35 },
    { time: '16:00', cpu: 40, memory: 50, connections: 30 },
    { time: '20:00', cpu: 25, memory: 46, connections: 18 },
  ];

  const databaseSizes = databaseStats?.map(db => ({
    name: db.name,
    size: db.stats?.dataSize || 0,
    count: db.stats?.collections || 0,
  })) || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your MongoDB instances and system performance
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedConnections.length}</div>
            <p className="text-xs text-muted-foreground">
              {connections.length} total connections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System CPU</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemInfo?.cpu?.usage?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {systemInfo?.cpu?.cores || 0} cores available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{errorConnections.length}</div>
            <p className="text-xs text-muted-foreground">
              Connection errors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Real-time system performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="cpu" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="memory" stroke="#82ca9d" strokeWidth={2} />
                <Line type="monotone" dataKey="connections" stroke="#ffc658" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database Sizes</CardTitle>
            <CardDescription>Storage usage by database</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={databaseSizes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="size"
                >
                  {databaseSizes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatBytes(value)} />
              </PieChart>
            </ResponsiveContainer>
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
                  <div className={`h-3 w-3 rounded-full ${
                    connection.status === 'connected' ? 'bg-green-500' :
                    connection.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
                  }`} />
                  <div>
                    <div className="font-medium">{connection.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {connection.host}:{connection.port}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    connection.status === 'connected' ? 'default' :
                    connection.status === 'error' ? 'destructive' : 'secondary'
                  }>
                    {connection.status}
                  </Badge>
                  {connection.lastConnected && (
                    <div className="text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 inline mr-1" />
                      {formatDuration(Math.floor((Date.now() - new Date(connection.lastConnected)) / 1000))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Database Overview */}
      {activeConnection && databaseStats && (
        <Card>
          <CardHeader>
            <CardTitle>Database Overview</CardTitle>
            <CardDescription>Statistics for {activeConnection.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {databaseStats.map((db) => (
                <div key={db.name} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{db.name}</h3>
                    <Badge variant="outline">{db.stats?.collections || 0} collections</Badge>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>Size: {formatBytes(db.stats?.dataSize || 0)}</div>
                    <div>Storage: {formatBytes(db.stats?.storageSize || 0)}</div>
                    <div>Indexes: {formatBytes(db.stats?.indexSize || 0)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;