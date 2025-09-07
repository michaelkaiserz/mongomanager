#!/bin/bash

# MongoManager Stop Script

echo "Stopping MongoManager..."

# Stop the application
if [ "$1" = "production" ]; then
    echo "Stopping systemd service..."
    sudo systemctl stop mongomanager
    echo "MongoManager service stopped"
else
    echo "Stopping development server..."
    pkill -f "npm run dev" || true
    pkill -f "node backend/server.js" || true
    echo "Development server stopped"
fi