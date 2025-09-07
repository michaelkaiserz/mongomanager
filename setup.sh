#!/bin/bash

# MongoManager Setup Script for Linux
# This script sets up the MongoManager application on Linux systems

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Function to install Node.js if not present
install_nodejs() {
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        print_success "Node.js is already installed (version $NODE_VERSION)"
        return 0
    fi

    print_status "Installing Node.js..."
    
    # Detect Linux distribution
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
    else
        print_error "Cannot detect Linux distribution"
        exit 1
    fi

    case $OS in
        ubuntu|debian)
            # Install Node.js via NodeSource repository
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
            ;;
        centos|rhel|fedora)
            # Install Node.js via NodeSource repository
            curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
            sudo yum install -y nodejs
            ;;
        arch|manjaro)
            sudo pacman -S nodejs npm
            ;;
        *)
            print_warning "Unsupported Linux distribution: $OS"
            print_status "Please install Node.js manually from https://nodejs.org/"
            exit 1
            ;;
    esac

    if command_exists node; then
        NODE_VERSION=$(node --version)
        print_success "Node.js installed successfully ($NODE_VERSION)"
    else
        print_error "Failed to install Node.js"
        exit 1
    fi
}

# Function to install MongoDB if not present
install_mongodb() {
    if command_exists mongod; then
        MONGODB_VERSION=$(mongod --version | head -n1 | cut -d' ' -f3)
        print_success "MongoDB is already installed (version $MONGODB_VERSION)"
        return 0
    fi

    print_status "Installing MongoDB..."
    
    # Detect Linux distribution
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
    else
        print_error "Cannot detect Linux distribution"
        exit 1
    fi

    case $OS in
        ubuntu|debian)
            # Install MongoDB Community Edition
            wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
            echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
            sudo apt-get update
            sudo apt-get install -y mongodb-org
            ;;
        centos|rhel|fedora)
            # Install MongoDB Community Edition
            sudo tee /etc/yum.repos.d/mongodb-org-6.0.repo <<EOF
[mongodb-org-6.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/\$releasever/mongodb-org/6.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-6.0.asc
EOF
            sudo yum install -y mongodb-org
            ;;
        arch|manjaro)
            sudo pacman -S mongodb
            ;;
        *)
            print_warning "Unsupported Linux distribution: $OS"
            print_status "Please install MongoDB manually from https://www.mongodb.com/try/download/community"
            exit 1
            ;;
    esac

    if command_exists mongod; then
        MONGODB_VERSION=$(mongod --version | head -n1 | cut -d' ' -f3)
        print_success "MongoDB installed successfully ($MONGODB_VERSION)"
    else
        print_error "Failed to install MongoDB"
        exit 1
    fi
}

# Function to start MongoDB service
start_mongodb() {
    print_status "Starting MongoDB service..."
    
    # Detect Linux distribution
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
    else
        print_error "Cannot detect Linux distribution"
        exit 1
    fi

    case $OS in
        ubuntu|debian|centos|rhel|fedora)
            sudo systemctl start mongod
            sudo systemctl enable mongod
            ;;
        arch|manjaro)
            sudo systemctl start mongodb
            sudo systemctl enable mongodb
            ;;
        *)
            print_warning "Please start MongoDB manually"
            ;;
    esac

    # Wait for MongoDB to start
    sleep 3
    
    if port_in_use 27017; then
        print_success "MongoDB is running on port 27017"
    else
        print_warning "MongoDB may not be running. Please check the service status."
    fi
}

# Function to install project dependencies
install_dependencies() {
    print_status "Installing project dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install backend dependencies
    cd backend
    npm install
    cd ..
    
    # Install frontend dependencies
    cd frontend
    npm install
    cd ..
    
    print_success "All dependencies installed successfully"
}

# Function to create environment file
create_env_file() {
    print_status "Creating environment configuration..."
    
    if [ ! -f backend/.env ]; then
        cp backend/.env.example backend/.env
        print_success "Environment file created at backend/.env"
        print_warning "Please review and update the environment variables in backend/.env"
    else
        print_success "Environment file already exists"
    fi
}

# Function to build the application
build_application() {
    print_status "Building the application..."
    
    # Build frontend
    cd frontend
    npm run build
    cd ..
    
    print_success "Application built successfully"
}

# Function to create systemd service
create_systemd_service() {
    print_status "Creating systemd service..."
    
    # Get current directory
    CURRENT_DIR=$(pwd)
    USER=$(whoami)
    
    # Create systemd service file
    sudo tee /etc/systemd/system/mongomanager.service <<EOF
[Unit]
Description=MongoManager - MongoDB Management Application
After=network.target mongod.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$CURRENT_DIR
ExecStart=/usr/bin/node backend/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=5000

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd and enable service
    sudo systemctl daemon-reload
    sudo systemctl enable mongomanager
    
    print_success "Systemd service created and enabled"
}

# Function to create startup script
create_startup_script() {
    print_status "Creating startup script..."
    
    cat > start.sh <<'EOF'
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
EOF

    chmod +x start.sh
    print_success "Startup script created (start.sh)"
}

# Function to create stop script
create_stop_script() {
    print_status "Creating stop script..."
    
    cat > stop.sh <<'EOF'
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
EOF

    chmod +x stop.sh
    print_success "Stop script created (stop.sh)"
}

# Function to display final instructions
show_final_instructions() {
    print_success "MongoManager setup completed successfully!"
    echo
    echo "=== Next Steps ==="
    echo
    echo "1. Review and update the environment configuration:"
    echo "   nano backend/.env"
    echo
    echo "2. Start the application:"
    echo "   Development mode: ./start.sh"
    echo "   Production mode:  ./start.sh production"
    echo
    echo "3. Access the application:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:5000"
    echo
    echo "4. Stop the application:"
    echo "   Development mode: ./stop.sh"
    echo "   Production mode:  ./stop.sh production"
    echo
    echo "5. Check service status (production mode):"
    echo "   sudo systemctl status mongomanager"
    echo
    echo "6. View logs (production mode):"
    echo "   sudo journalctl -u mongomanager -f"
    echo
    echo "=== Configuration ==="
    echo
    echo "Default MongoDB connection:"
    echo "  Host: localhost"
    echo "  Port: 27017"
    echo "  Database: admin"
    echo
    echo "For production deployment, please:"
    echo "  - Configure MongoDB authentication"
    echo "  - Set up SSL/TLS certificates"
    echo "  - Configure firewall rules"
    echo "  - Set up monitoring and backups"
    echo
    print_success "Happy MongoDB management with MongoManager!"
}

# Main setup function
main() {
    echo "=========================================="
    echo "    MongoManager Setup Script"
    echo "=========================================="
    echo
    
    # Check if running as root
    if [ "$EUID" -eq 0 ]; then
        print_error "Please do not run this script as root"
        exit 1
    fi
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
        print_error "Please run this script from the MongoManager root directory"
        exit 1
    fi
    
    # Install Node.js
    install_nodejs
    
    # Install MongoDB
    install_mongodb
    
    # Start MongoDB
    start_mongodb
    
    # Install dependencies
    install_dependencies
    
    # Create environment file
    create_env_file
    
    # Build application
    build_application
    
    # Create systemd service
    create_systemd_service
    
    # Create startup/stop scripts
    create_startup_script
    create_stop_script
    
    # Show final instructions
    show_final_instructions
}

# Run main function
main "$@"