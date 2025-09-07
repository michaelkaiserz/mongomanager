import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Database, 
  Settings, 
  BarChart3, 
  Play, 
  Search,
  Moon,
  Sun,
  Monitor,
  Menu,
  X,
  Plus,
  Activity
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useConnection } from '../contexts/ConnectionContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { connections, activeConnection } = useConnection();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'Connections', href: '/connections', icon: Database },
    { name: 'Explorer', href: '/explorer', icon: Search },
    { name: 'Query Runner', href: '/query', icon: Play },
    { name: 'Monitoring', href: '/monitoring', icon: Activity },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const connectedCount = connections.filter(conn => conn.status === 'connected').length;
  const totalCount = connections.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed left-0 top-0 h-full w-64 bg-card border-r">
          <div className="flex items-center justify-between p-4 border-b">
            <h1 className="text-xl font-bold">MongoManager</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card border-r px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center border-b">
            <h1 className="text-xl font-bold">MongoManager</h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          className={cn(
                            "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent"
                          )}
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
              <li className="mt-auto">
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-xs font-medium text-muted-foreground">Connections</span>
                    <Badge variant="secondary" className="text-xs">
                      {connectedCount}/{totalCount}
                    </Badge>
                  </div>
                  {activeConnection && (
                    <div className="px-2 py-1 bg-accent rounded-md">
                      <div className="text-xs font-medium text-accent-foreground">
                        {activeConnection.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {activeConnection.host}:{activeConnection.port}
                      </div>
                    </div>
                  )}
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Theme toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-8 w-8"
              >
                {theme === 'light' ? (
                  <Moon className="h-4 w-4" />
                ) : theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Monitor className="h-4 w-4" />
                )}
              </Button>

              {/* Connection status */}
              {activeConnection && (
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    activeConnection.status === 'connected' ? "bg-green-500" :
                    activeConnection.status === 'error' ? "bg-red-500" : "bg-gray-500"
                  )} />
                  <span className="text-sm text-muted-foreground">
                    {activeConnection.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;