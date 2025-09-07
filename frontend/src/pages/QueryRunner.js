import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Play, 
  Save, 
  Trash2, 
  Copy, 
  Download, 
  Upload,
  Clock,
  Database,
  Folder,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { useConnection } from '../contexts/ConnectionContext';
import { formatJson, parseJson, copyToClipboard, downloadJson, downloadCsv, isValidJson } from '../lib/utils';
import { 
  getDatabases, 
  getDatabaseCollections,
  executeQuery,
  executeAggregation,
  executeCommand,
  executeAdminCommand,
  explainQuery,
  explainAggregation
} from '../services/api';

const QueryRunner = () => {
  const [selectedDatabase, setSelectedDatabase] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('');
  const [queryType, setQueryType] = useState('find');
  const [queryText, setQueryText] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [queryError, setQueryError] = useState(null);
  const [executionTime, setExecutionTime] = useState(0);
  const [savedQueries, setSavedQueries] = useState([]);
  const [showExplain, setShowExplain] = useState(false);

  const { activeConnection } = useConnection();

  // Fetch databases
  const { data: databases = [] } = useQuery({
    queryKey: ['databases', activeConnection?.id],
    queryFn: () => getDatabases(activeConnection.id),
    enabled: !!activeConnection,
  });

  // Fetch collections for selected database
  const { data: collections = [] } = useQuery({
    queryKey: ['collections', activeConnection?.id, selectedDatabase],
    queryFn: () => getDatabaseCollections(activeConnection.id, selectedDatabase),
    enabled: !!activeConnection && !!selectedDatabase,
  });

  // Execute query mutation
  const executeQueryMutation = useMutation({
    mutationFn: async ({ type, data }) => {
      const startTime = Date.now();
      let result;
      
      if (type === 'find') {
        result = await executeQuery(activeConnection.id, selectedDatabase, selectedCollection, data);
      } else if (type === 'aggregate') {
        result = await executeAggregation(activeConnection.id, selectedDatabase, selectedCollection, data);
      } else if (type === 'command') {
        result = await executeCommand(activeConnection.id, selectedDatabase, data);
      } else if (type === 'admin') {
        result = await executeAdminCommand(activeConnection.id, data);
      }
      
      const endTime = Date.now();
      setExecutionTime(endTime - startTime);
      return result;
    },
    onSuccess: (result) => {
      setQueryResult(result);
      setQueryError(null);
      toast.success('Query executed successfully');
    },
    onError: (error) => {
      setQueryError(error.message);
      setQueryResult(null);
      toast.error(`Query failed: ${error.message}`);
    },
  });

  // Explain query mutation
  const explainQueryMutation = useMutation({
    mutationFn: async ({ type, data }) => {
      if (type === 'find') {
        return await explainQuery(activeConnection.id, selectedDatabase, selectedCollection, data);
      } else if (type === 'aggregate') {
        return await explainAggregation(activeConnection.id, selectedDatabase, selectedCollection, data);
      }
    },
    onSuccess: (result) => {
      setQueryResult({ explain: result });
      setQueryError(null);
      toast.success('Query explained successfully');
    },
    onError: (error) => {
      setQueryError(error.message);
      setQueryResult(null);
      toast.error(`Explain failed: ${error.message}`);
    },
  });

  const handleExecute = () => {
    if (!activeConnection) {
      toast.error('Please select a connection');
      return;
    }

    if (!queryText.trim()) {
      toast.error('Please enter a query');
      return;
    }

    try {
      let queryData;
      
      if (queryType === 'find') {
        if (!selectedDatabase || !selectedCollection) {
          toast.error('Please select a database and collection');
          return;
        }
        queryData = { query: parseJson(queryText) };
      } else if (queryType === 'aggregate') {
        if (!selectedDatabase || !selectedCollection) {
          toast.error('Please select a database and collection');
          return;
        }
        queryData = { pipeline: parseJson(queryText) };
      } else if (queryType === 'command') {
        if (!selectedDatabase) {
          toast.error('Please select a database');
          return;
        }
        queryData = { command: parseJson(queryText) };
      } else if (queryType === 'admin') {
        queryData = { command: parseJson(queryText) };
      }

      if (showExplain && (queryType === 'find' || queryType === 'aggregate')) {
        explainQueryMutation.mutate({ type: queryType, data: queryData });
      } else {
        executeQueryMutation.mutate({ type: queryType, data: queryData });
      }
    } catch (error) {
      toast.error('Invalid JSON format');
    }
  };

  const handleSaveQuery = () => {
    if (!queryText.trim()) {
      toast.error('Please enter a query to save');
      return;
    }

    const newQuery = {
      id: Date.now(),
      name: `Query ${savedQueries.length + 1}`,
      type: queryType,
      database: selectedDatabase,
      collection: selectedCollection,
      query: queryText,
      timestamp: new Date().toISOString(),
    };

    setSavedQueries([...savedQueries, newQuery]);
    toast.success('Query saved successfully');
  };

  const handleLoadQuery = (query) => {
    setQueryType(query.type);
    setSelectedDatabase(query.database);
    setSelectedCollection(query.collection);
    setQueryText(query.query);
    toast.success('Query loaded successfully');
  };

  const handleDeleteQuery = (queryId) => {
    setSavedQueries(savedQueries.filter(q => q.id !== queryId));
    toast.success('Query deleted successfully');
  };

  const handleCopyResult = () => {
    if (queryResult) {
      copyToClipboard(formatJson(queryResult));
      toast.success('Result copied to clipboard');
    }
  };

  const handleDownloadResult = () => {
    if (queryResult) {
      if (queryResult.documents || queryResult.result) {
        const data = queryResult.documents || queryResult.result;
        if (Array.isArray(data)) {
          downloadCsv(data, `query-result-${Date.now()}.csv`);
        } else {
          downloadJson(data, `query-result-${Date.now()}.json`);
        }
      } else {
        downloadJson(queryResult, `query-result-${Date.now()}.json`);
      }
      toast.success('Result downloaded successfully');
    }
  };

  const getQueryPlaceholder = () => {
    switch (queryType) {
      case 'find':
        return '{"name": "example"}';
      case 'aggregate':
        return '[{"$match": {"status": "active"}}, {"$group": {"_id": "$category", "count": {"$sum": 1}}}]';
      case 'command':
        return '{"dbStats": 1}';
      case 'admin':
        return '{"serverStatus": 1}';
      default:
        return '';
    }
  };

  const getQueryDescription = () => {
    switch (queryType) {
      case 'find':
        return 'Find documents in a collection using MongoDB query syntax';
      case 'aggregate':
        return 'Run aggregation pipeline to process and analyze data';
      case 'command':
        return 'Execute database commands (dbStats, collStats, etc.)';
      case 'admin':
        return 'Execute admin commands (serverStatus, buildInfo, etc.)';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Query Runner</h1>
        <p className="text-muted-foreground">
          Execute MongoDB queries, aggregations, and commands with real-time results
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Query Panel */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Query Editor</CardTitle>
              <CardDescription>{getQueryDescription()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Query Type</label>
                  <Select value={queryType} onValueChange={setQueryType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="find">Find</SelectItem>
                      <SelectItem value="aggregate">Aggregate</SelectItem>
                      <SelectItem value="command">Command</SelectItem>
                      <SelectItem value="admin">Admin Command</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Database</label>
                  <Select value={selectedDatabase} onValueChange={setSelectedDatabase}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select database" />
                    </SelectTrigger>
                    <SelectContent>
                      {databases.map((db) => (
                        <SelectItem key={db.name} value={db.name}>
                          {db.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {queryType === 'find' || queryType === 'aggregate' ? (
                <div>
                  <label className="text-sm font-medium mb-2 block">Collection</label>
                  <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select collection" />
                    </SelectTrigger>
                    <SelectContent>
                      {collections.map((collection) => (
                        <SelectItem key={collection.name} value={collection.name}>
                          {collection.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div>
                <label className="text-sm font-medium mb-2 block">Query</label>
                <Textarea
                  placeholder={getQueryPlaceholder()}
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  className="min-h-[200px] font-mono"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleExecute}
                    disabled={executeQueryMutation.isPending || explainQueryMutation.isPending}
                  >
                    {executeQueryMutation.isPending || explainQueryMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    {showExplain ? 'Explain' : 'Execute'}
                  </Button>
                  
                  {(queryType === 'find' || queryType === 'aggregate') && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="explain"
                        checked={showExplain}
                        onChange={(e) => setShowExplain(e.target.checked)}
                      />
                      <label htmlFor="explain" className="text-sm">
                        Explain query
                      </label>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSaveQuery}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {(queryResult || queryError) && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Results</CardTitle>
                    <CardDescription>
                      {queryError ? 'Query execution failed' : 'Query executed successfully'}
                      {executionTime > 0 && ` in ${executionTime}ms`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {queryResult && (
                      <>
                        <Button variant="outline" size="sm" onClick={handleCopyResult}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownloadResult}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {queryError ? (
                  <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Error:</span>
                      <span>{queryError}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {queryResult.explain ? (
                      <div>
                        <h4 className="font-medium mb-2">Query Execution Plan</h4>
                        <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                          {formatJson(queryResult.explain)}
                        </pre>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="font-medium">
                            {queryResult.documents ? `${queryResult.documents.length} documents` : 
                             queryResult.result ? `${queryResult.result.length} results` : 
                             'Command executed successfully'}
                          </span>
                        </div>
                        <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto max-h-[400px]">
                          {formatJson(queryResult)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Saved Queries */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Saved Queries</CardTitle>
              <CardDescription>Manage your saved queries</CardDescription>
            </CardHeader>
            <CardContent>
              {savedQueries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No saved queries</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedQueries.map((query) => (
                    <div key={query.id} className="p-3 border rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{query.name}</h4>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleLoadQuery(query)}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleDeleteQuery(query.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Database className="h-3 w-3" />
                          {query.database}
                        </div>
                        {query.collection && (
                          <div className="flex items-center gap-1">
                            <Folder className="h-3 w-3" />
                            {query.collection}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(query.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Query Examples */}
          <Card>
            <CardHeader>
              <CardTitle>Query Examples</CardTitle>
              <CardDescription>Common MongoDB queries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm mb-1">Find all documents</h4>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{"{}"}</code>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">Find by field</h4>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{"{name: 'John'}"}</code>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">Count documents</h4>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{"{count: 'collectionName'}"}</code>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">Database stats</h4>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{"{dbStats: 1}"}</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QueryRunner;