#!/bin/bash

# MongoManager Startup Script

echo "Starting MongoManager..."

# Check if MongoDB is running
if ! lsof -i :27017 >/dev/null 2>&1; then
    echo "Starting MongoDB..."
    sudo systemctl start mongod
    sleep 3
fi

# Start the application
if [ "$1" = "production" ]; then
    echo "Starting in production mode..."
    sudo systemctl start mongomanager
    echo "MongoManager is running as a systemd service"
    echo "Check status with: sudo systemctl status mongomanager"
    echo "View logs with: sudo journalctl -u mongomanager -f"
else
    echo "Starting in development mode..."
    npm run dev
fi