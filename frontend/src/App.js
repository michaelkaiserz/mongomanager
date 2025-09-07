import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ConnectionProvider } from './contexts/ConnectionContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Connections from './pages/Connections';
import DatabaseExplorer from './pages/DatabaseExplorer';
import QueryRunner from './pages/QueryRunner';
import Monitoring from './pages/Monitoring';
import Settings from './pages/Settings';

function App() {
  return (
    <ThemeProvider>
      <ConnectionProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/connections" element={<Connections />} />
            <Route path="/explorer" element={<DatabaseExplorer />} />
            <Route path="/query" element={<QueryRunner />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </ConnectionProvider>
    </ThemeProvider>
  );
}

export default App;