import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Palette, 
  Bell, 
  Database, 
  Shield,
  Download,
  Upload,
  Trash2,
  Save
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-hot-toast';

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState({
    autoRefresh: true,
    refreshInterval: 5000,
    notifications: true,
    soundNotifications: false,
    maxConnections: 10,
    connectionTimeout: 30000,
    queryTimeout: 60000,
    maxQueryResults: 1000,
    enableLogging: true,
    logLevel: 'info',
    enableMetrics: true,
    metricsRetention: 7,
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = () => {
    localStorage.setItem('mongomanager-settings', JSON.stringify(settings));
    toast.success('Settings saved successfully');
  };

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mongomanager-settings.json';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Settings exported successfully');
  };

  const handleImportSettings = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target.result);
          setSettings(importedSettings);
          toast.success('Settings imported successfully');
        } catch (error) {
          toast.error('Invalid settings file');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      setSettings({
        autoRefresh: true,
        refreshInterval: 5000,
        notifications: true,
        soundNotifications: false,
        maxConnections: 10,
        connectionTimeout: 30000,
        queryTimeout: 60000,
        maxQueryResults: 1000,
        enableLogging: true,
        logLevel: 'info',
        enableMetrics: true,
        metricsRetention: 7,
      });
      toast.success('Settings reset to default');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your MongoManager preferences and application settings
        </p>
      </div>

      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme Settings
              </CardTitle>
              <CardDescription>
                Customize the appearance of MongoManager
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Theme</label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Display Settings</CardTitle>
              <CardDescription>
                Configure how data is displayed in the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Auto Refresh</label>
                  <p className="text-xs text-muted-foreground">
                    Automatically refresh data at regular intervals
                  </p>
                </div>
                <Switch
                  checked={settings.autoRefresh}
                  onCheckedChange={(checked) => handleSettingChange('autoRefresh', checked)}
                />
              </div>

              {settings.autoRefresh && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Refresh Interval (ms)</label>
                  <Input
                    type="number"
                    value={settings.refreshInterval}
                    onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
                    className="w-48"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">Max Query Results</label>
                <Input
                  type="number"
                  value={settings.maxQueryResults}
                  onChange={(e) => handleSettingChange('maxQueryResults', parseInt(e.target.value))}
                  className="w-48"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure how you receive notifications and alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Enable Notifications</label>
                  <p className="text-xs text-muted-foreground">
                    Show toast notifications for important events
                  </p>
                </div>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Sound Notifications</label>
                  <p className="text-xs text-muted-foreground">
                    Play sound for notifications
                  </p>
                </div>
                <Switch
                  checked={settings.soundNotifications}
                  onCheckedChange={(checked) => handleSettingChange('soundNotifications', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Connection Settings
              </CardTitle>
              <CardDescription>
                Configure default database connection parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Max Connections</label>
                <Input
                  type="number"
                  value={settings.maxConnections}
                  onChange={(e) => handleSettingChange('maxConnections', parseInt(e.target.value))}
                  className="w-48"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Connection Timeout (ms)</label>
                <Input
                  type="number"
                  value={settings.connectionTimeout}
                  onChange={(e) => handleSettingChange('connectionTimeout', parseInt(e.target.value))}
                  className="w-48"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Query Timeout (ms)</label>
                <Input
                  type="number"
                  value={settings.queryTimeout}
                  onChange={(e) => handleSettingChange('queryTimeout', parseInt(e.target.value))}
                  className="w-48"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Advanced Settings
              </CardTitle>
              <CardDescription>
                Advanced configuration options for power users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Enable Logging</label>
                  <p className="text-xs text-muted-foreground">
                    Log application events and errors
                  </p>
                </div>
                <Switch
                  checked={settings.enableLogging}
                  onCheckedChange={(checked) => handleSettingChange('enableLogging', checked)}
                />
              </div>

              {settings.enableLogging && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Log Level</label>
                  <Select value={settings.logLevel} onValueChange={(value) => handleSettingChange('logLevel', value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debug">Debug</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Enable Metrics</label>
                  <p className="text-xs text-muted-foreground">
                    Collect and store performance metrics
                  </p>
                </div>
                <Switch
                  checked={settings.enableMetrics}
                  onCheckedChange={(checked) => handleSettingChange('enableMetrics', checked)}
                />
              </div>

              {settings.enableMetrics && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Metrics Retention (days)</label>
                  <Input
                    type="number"
                    value={settings.metricsRetention}
                    onChange={(e) => handleSettingChange('metricsRetention', parseInt(e.target.value))}
                    className="w-48"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Settings Management</CardTitle>
              <CardDescription>
                Import, export, or reset your settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button onClick={handleSaveSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
                <Button variant="outline" onClick={handleExportSettings}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" onClick={() => document.getElementById('import-settings').click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
                <input
                  id="import-settings"
                  type="file"
                  accept=".json"
                  onChange={handleImportSettings}
                  className="hidden"
                />
                <Button variant="outline" onClick={handleResetSettings}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;