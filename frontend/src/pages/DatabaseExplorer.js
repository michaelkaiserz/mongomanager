import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  EyeOff,
  Copy,
  Save,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { useConnection } from '../contexts/ConnectionContext';
import DatabaseTree from '../components/DatabaseTree';
import { formatBytes, formatNumber, formatDate, isValidJson, formatJson, parseJson, copyToClipboard, downloadJson } from '../lib/utils';
import { 
  getDatabases, 
  createDatabase, 
  deleteDatabase, 
  getDatabaseCollections, 
  createCollection, 
  deleteCollection,
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument
} from '../services/api';

const DatabaseExplorer = () => {
  const [selectedDatabase, setSelectedDatabase] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [createType, setCreateType] = useState('database');
  const [createData, setCreateData] = useState({ name: '' });
  const [editData, setEditData] = useState('');
  const [showJsonEditor, setShowJsonEditor] = useState(false);

  const { activeConnection } = useConnection();
  const queryClient = useQueryClient();

  // Fetch databases
  const { data: databases = [], refetch: refetchDatabases } = useQuery({
    queryKey: ['databases', activeConnection?.id],
    queryFn: () => getDatabases(activeConnection.id),
    enabled: !!activeConnection,
  });

  // Fetch collections for selected database
  const { data: collections = [], refetch: refetchCollections } = useQuery({
    queryKey: ['collections', activeConnection?.id, selectedDatabase?.name],
    queryFn: () => getDatabaseCollections(activeConnection.id, selectedDatabase.name),
    enabled: !!activeConnection && !!selectedDatabase,
  });

  // Fetch documents for selected collection
  const { data: documentsData, refetch: refetchDocuments } = useQuery({
    queryKey: ['documents', activeConnection?.id, selectedDatabase?.name, selectedCollection?.name],
    queryFn: () => getDocuments(activeConnection.id, selectedDatabase.name, selectedCollection.name, { limit: 100 }),
    enabled: !!activeConnection && !!selectedDatabase && !!selectedCollection,
  });

  // Create database mutation
  const createDatabaseMutation = useMutation({
    mutationFn: (data) => createDatabase(activeConnection.id, data),
    onSuccess: () => {
      toast.success('Database created successfully');
      refetchDatabases();
      setIsCreateDialogOpen(false);
      setCreateData({ name: '' });
    },
    onError: (error) => {
      toast.error(`Failed to create database: ${error.message}`);
    },
  });

  // Create collection mutation
  const createCollectionMutation = useMutation({
    mutationFn: (data) => createCollection(activeConnection.id, selectedDatabase.name, data),
    onSuccess: () => {
      toast.success('Collection created successfully');
      refetchCollections();
      setIsCreateDialogOpen(false);
      setCreateData({ name: '' });
    },
    onError: (error) => {
      toast.error(`Failed to create collection: ${error.message}`);
    },
  });

  // Create document mutation
  const createDocumentMutation = useMutation({
    mutationFn: (data) => createDocument(activeConnection.id, selectedDatabase.name, selectedCollection.name, data),
    onSuccess: () => {
      toast.success('Document created successfully');
      refetchDocuments();
      setIsCreateDialogOpen(false);
      setCreateData({ name: '' });
    },
    onError: (error) => {
      toast.error(`Failed to create document: ${error.message}`);
    },
  });

  // Update document mutation
  const updateDocumentMutation = useMutation({
    mutationFn: (data) => updateDocument(activeConnection.id, selectedDatabase.name, selectedCollection.name, selectedDocument._id, data),
    onSuccess: () => {
      toast.success('Document updated successfully');
      refetchDocuments();
      setIsEditDialogOpen(false);
      setEditData('');
    },
    onError: (error) => {
      toast.error(`Failed to update document: ${error.message}`);
    },
  });

  // Delete database mutation
  const deleteDatabaseMutation = useMutation({
    mutationFn: (dbName) => deleteDatabase(activeConnection.id, dbName),
    onSuccess: () => {
      toast.success('Database deleted successfully');
      refetchDatabases();
      setSelectedDatabase(null);
      setSelectedCollection(null);
      setSelectedDocument(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete database: ${error.message}`);
    },
  });

  // Delete collection mutation
  const deleteCollectionMutation = useMutation({
    mutationFn: (collectionName) => deleteCollection(activeConnection.id, selectedDatabase.name, collectionName),
    onSuccess: () => {
      toast.success('Collection deleted successfully');
      refetchCollections();
      setSelectedCollection(null);
      setSelectedDocument(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete collection: ${error.message}`);
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId) => deleteDocument(activeConnection.id, selectedDatabase.name, selectedCollection.name, documentId),
    onSuccess: () => {
      toast.success('Document deleted successfully');
      refetchDocuments();
      setSelectedDocument(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete document: ${error.message}`);
    },
  });

  const handleCreate = () => {
    if (!createData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (createType === 'database') {
      createDatabaseMutation.mutate(createData);
    } else if (createType === 'collection') {
      createCollectionMutation.mutate(createData);
    } else if (createType === 'document') {
      try {
        const documentData = parseJson(createData.name);
        if (!documentData) {
          toast.error('Invalid JSON format');
          return;
        }
        createDocumentMutation.mutate(documentData);
      } catch (error) {
        toast.error('Invalid JSON format');
      }
    }
  };

  const handleUpdate = () => {
    try {
      const documentData = parseJson(editData);
      if (!documentData) {
        toast.error('Invalid JSON format');
        return;
      }
      updateDocumentMutation.mutate(documentData);
    } catch (error) {
      toast.error('Invalid JSON format');
    }
  };

  const handleDelete = (type, name) => {
    if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
      if (type === 'database') {
        deleteDatabaseMutation.mutate(name);
      } else if (type === 'collection') {
        deleteCollectionMutation.mutate(name);
      } else if (type === 'document') {
        deleteDocumentMutation.mutate(name);
      }
    }
  };

  const handleEditDocument = (document) => {
    setSelectedDocument(document);
    setEditData(formatJson(document));
    setIsEditDialogOpen(true);
  };

  const handleCopyDocument = (document) => {
    copyToClipboard(formatJson(document));
    toast.success('Document copied to clipboard');
  };

  const handleDownloadDocument = (document) => {
    downloadJson(document, `document-${document._id}.json`);
  };

  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDocuments = documentsData?.documents?.filter(doc =>
    JSON.stringify(doc).toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Database Explorer</h1>
          <p className="text-muted-foreground">
            Browse and manage your MongoDB databases, collections, and documents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button
            variant="outline"
            onClick={() => {
              refetchDatabases();
              refetchCollections();
              refetchDocuments();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tree View */}
        <div className="lg:col-span-1">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle>Database Tree</CardTitle>
              <CardDescription>Navigate your data structure</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <DatabaseTree
                onSelectDatabase={setSelectedDatabase}
                onSelectCollection={(db, collection) => {
                  setSelectedDatabase(db);
                  setSelectedCollection(collection);
                }}
                onSelectDocument={(db, collection, document) => {
                  setSelectedDatabase(db);
                  setSelectedCollection(collection);
                  setSelectedDocument(document);
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="databases" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="databases">Databases</TabsTrigger>
              <TabsTrigger value="collections" disabled={!selectedDatabase}>
                Collections
              </TabsTrigger>
              <TabsTrigger value="documents" disabled={!selectedCollection}>
                Documents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="databases" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Databases</CardTitle>
                      <CardDescription>
                        {databases.length} database{databases.length !== 1 ? 's' : ''} found
                      </CardDescription>
                    </div>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => {
                            setCreateType('database');
                            setCreateData({ name: '' });
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Database
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Database</DialogTitle>
                          <DialogDescription>
                            Enter a name for the new database
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            placeholder="Database name"
                            value={createData.name}
                            onChange={(e) => setCreateData({ name: e.target.value })}
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleCreate} disabled={createDatabaseMutation.isPending}>
                            Create
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {databases.map((database) => (
                      <Card key={database.name} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{database.name}</CardTitle>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete('database', database.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Size:</span>
                              <span>{formatBytes(database.sizeOnDisk || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Empty:</span>
                              <span>{database.empty ? 'Yes' : 'No'}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="collections" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Collections in {selectedDatabase?.name}</CardTitle>
                      <CardDescription>
                        {filteredCollections.length} collection{filteredCollections.length !== 1 ? 's' : ''} found
                      </CardDescription>
                    </div>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => {
                            setCreateType('collection');
                            setCreateData({ name: '' });
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Collection
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Collection</DialogTitle>
                          <DialogDescription>
                            Enter a name for the new collection
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            placeholder="Collection name"
                            value={createData.name}
                            onChange={(e) => setCreateData({ name: e.target.value })}
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleCreate} disabled={createCollectionMutation.isPending}>
                            Create
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredCollections.map((collection) => (
                      <Card key={collection.name} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{collection.name}</CardTitle>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete('collection', collection.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Documents:</span>
                              <span>{formatNumber(collection.stats?.count || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Size:</span>
                              <span>{formatBytes(collection.stats?.size || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Storage:</span>
                              <span>{formatBytes(collection.stats?.storageSize || 0)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Documents in {selectedCollection?.name}</CardTitle>
                      <CardDescription>
                        {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} found
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowJsonEditor(!showJsonEditor)}
                      >
                        {showJsonEditor ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                        {showJsonEditor ? 'Hide' : 'Show'} JSON Editor
                      </Button>
                      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => {
                              setCreateType('document');
                              setCreateData({ name: '{}' });
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Document
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Create Document</DialogTitle>
                            <DialogDescription>
                              Enter JSON data for the new document
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Textarea
                              placeholder='{"name": "example", "value": 123}'
                              value={createData.name}
                              onChange={(e) => setCreateData({ name: e.target.value })}
                              className="min-h-[300px] font-mono"
                            />
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleCreate} disabled={createDocumentMutation.isPending}>
                              Create
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredDocuments.map((document, index) => (
                      <Card key={document._id || index} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              {document._id ? `_id: ${document._id}` : `Document ${index + 1}`}
                            </CardTitle>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCopyDocument(document)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDownloadDocument(document)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditDocument(document)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete('document', document._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {showJsonEditor ? (
                            <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                              {formatJson(document)}
                            </pre>
                          ) : (
                            <div className="space-y-2 text-sm">
                              {Object.entries(document).slice(0, 5).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-muted-foreground">{key}:</span>
                                  <span className="truncate max-w-[200px]">
                                    {typeof value === 'object' ? formatJson(value) : String(value)}
                                  </span>
                                </div>
                              ))}
                              {Object.keys(document).length > 5 && (
                                <div className="text-muted-foreground">
                                  ... and {Object.keys(document).length - 5} more fields
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Document Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              Modify the JSON data for this document
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editData}
              onChange={(e) => setEditData(e.target.value)}
              className="min-h-[400px] font-mono"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateDocumentMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DatabaseExplorer;