import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ChevronRight, 
  ChevronDown, 
  Database, 
  Folder, 
  FileText,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  MoreHorizontal
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { useConnection } from '../contexts/ConnectionContext';
import { getDatabases, getDatabaseCollections, getDocuments } from '../services/api';
import { formatBytes, formatNumber } from '../lib/utils';
import { cn } from '../lib/utils';

const DatabaseTree = ({ onSelectDatabase, onSelectCollection, onSelectDocument }) => {
  const { activeConnection, selectedDatabase, selectedCollection } = useConnection();
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [expandedCollections, setExpandedCollections] = useState(new Set());

  // Fetch databases
  const { data: databases = [], refetch: refetchDatabases } = useQuery({
    queryKey: ['databases', activeConnection?.id],
    queryFn: () => getDatabases(activeConnection.id),
    enabled: !!activeConnection,
  });

  // Fetch collections for expanded databases
  const { data: collectionsData = {} } = useQuery({
    queryKey: ['collections', activeConnection?.id, Array.from(expandedNodes)],
    queryFn: async () => {
      const collections = {};
      for (const dbName of expandedNodes) {
        try {
          const dbCollections = await getDatabaseCollections(activeConnection.id, dbName);
          collections[dbName] = dbCollections;
        } catch (error) {
          console.error(`Failed to fetch collections for ${dbName}:`, error);
          collections[dbName] = [];
        }
      }
      return collections;
    },
    enabled: !!activeConnection && expandedNodes.size > 0,
  });

  // Fetch documents for expanded collections
  const { data: documentsData = {} } = useQuery({
    queryKey: ['documents', activeConnection?.id, Array.from(expandedCollections)],
    queryFn: async () => {
      const documents = {};
      for (const collectionKey of expandedCollections) {
        const [dbName, collectionName] = collectionKey.split('.');
        try {
          const docs = await getDocuments(activeConnection.id, dbName, collectionName, { limit: 10 });
          documents[collectionKey] = docs.documents;
        } catch (error) {
          console.error(`Failed to fetch documents for ${collectionKey}:`, error);
          documents[collectionKey] = [];
        }
      }
      return documents;
    },
    enabled: !!activeConnection && expandedCollections.size > 0,
  });

  const toggleNode = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const toggleCollection = (collectionKey) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(collectionKey)) {
      newExpanded.delete(collectionKey);
    } else {
      newExpanded.add(collectionKey);
    }
    setExpandedCollections(newExpanded);
  };

  const handleDatabaseClick = (database) => {
    onSelectDatabase(database);
  };

  const handleCollectionClick = (database, collection) => {
    onSelectCollection(database, collection);
  };

  const handleDocumentClick = (database, collection, document) => {
    onSelectDocument(database, collection, document);
  };

  if (!activeConnection) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Select a connection to view databases</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Databases</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetchDatabases()}
            className="h-6 w-6"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="p-2">
        {databases.map((database) => {
          const isExpanded = expandedNodes.has(database.name);
          const isSelected = selectedDatabase?.name === database.name;
          const collections = collectionsData[database.name] || [];

          return (
            <div key={database.name} className="mb-1">
              {/* Database Node */}
              <div
                className={cn(
                  "flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer hover:bg-accent",
                  isSelected && "bg-primary text-primary-foreground"
                )}
                onClick={() => handleDatabaseClick(database)}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleNode(database.name);
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
                <Database className="h-4 w-4" />
                <span className="flex-1 text-sm font-medium">{database.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {formatBytes(database.sizeOnDisk || 0)}
                </Badge>
              </div>

              {/* Collections */}
              {isExpanded && (
                <div className="ml-6 space-y-1">
                  {collections.map((collection) => {
                    const collectionKey = `${database.name}.${collection.name}`;
                    const isCollectionExpanded = expandedCollections.has(collectionKey);
                    const isCollectionSelected = selectedCollection?.name === collection.name;
                    const documents = documentsData[collectionKey] || [];

                    return (
                      <div key={collection.name} className="mb-1">
                        {/* Collection Node */}
                        <div
                          className={cn(
                            "flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer hover:bg-accent",
                            isCollectionSelected && "bg-accent"
                          )}
                          onClick={() => handleCollectionClick(database, collection)}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCollection(collectionKey);
                            }}
                          >
                            {isCollectionExpanded ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                          </Button>
                          <Folder className="h-4 w-4" />
                          <span className="flex-1 text-sm">{collection.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {formatNumber(collection.stats?.count || 0)}
                          </Badge>
                        </div>

                        {/* Documents */}
                        {isCollectionExpanded && (
                          <div className="ml-6 space-y-1">
                            {documents.map((document, index) => (
                              <div
                                key={document._id || index}
                                className="flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer hover:bg-accent text-sm"
                                onClick={() => handleDocumentClick(database, collection, document)}
                              >
                                <FileText className="h-3 w-3" />
                                <span className="flex-1 truncate">
                                  {document._id ? `_id: ${document._id}` : `Document ${index + 1}`}
                                </span>
                              </div>
                            ))}
                            {documents.length === 0 && (
                              <div className="px-2 py-1 text-xs text-muted-foreground">
                                No documents
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {collections.length === 0 && (
                    <div className="px-2 py-1 text-xs text-muted-foreground">
                      No collections
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {databases.length === 0 && (
          <div className="p-4 text-center text-muted-foreground">
            <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No databases found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseTree;