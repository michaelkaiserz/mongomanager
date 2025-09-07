# MongoManager

A comprehensive MongoDB management application with real-time monitoring and analytics, built with React, Node.js, and modern web technologies.

## Features

### 🗄️ Database Management
- Connect to multiple MongoDB instances
- Create, rename, and delete databases and collections
- Browse databases, collections, and documents in a tree-like structure
- Edit documents with JSON validation
- Run queries and aggregations
- View database metadata, stats, and size

### 📊 Monitoring & Analytics
- Uptime checker for MongoDB instances
- Database size and stats (number of documents, storage used)
- Resource usage graphs: real-time RAM and CPU usage per server/connection
- Charts for historical trends using Recharts
- Alerts for downtime or high resource usage

### 🎨 Modern UI/UX
- React with Shadcn/UI components
- Geist font for modern typography
- Lucide icons for actions
- React Toastify for notifications
- Dark/light mode toggle
- Responsive design for all screen sizes

### 🔧 Advanced Features
- Tree-like explorer for databases, collections, and documents
- Document editor with JSON validation
- Query runner with results table and export options
- Real-time monitoring with WebSocket connections
- Search/filter databases, collections, or documents
- Bulk operations for documents
- Connection pooling and management

## Technology Stack

### Frontend
- **React 18** - Modern React with hooks
- **Shadcn/UI** - Beautiful, accessible UI components
- **Tailwind CSS** - Utility-first CSS framework
- **Geist Font** - Modern typography
- **Lucide React** - Beautiful icons
- **React Hot Toast** - Toast notifications
- **Recharts** - Composable charting library
- **React Query** - Data fetching and caching
- **React Router** - Client-side routing

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MongoDB Driver** - Native MongoDB connectivity
- **WebSocket** - Real-time communication
- **System Information** - System metrics collection
- **Node Cron** - Scheduled tasks
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

## Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 4.4+
- Linux (Ubuntu, Debian, CentOS, RHEL, Fedora, Arch)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mongomanager
   ```

2. **Run the setup script**
   ```bash
   ./setup.sh
   ```

   The setup script will:
   - Install Node.js and MongoDB (if not present)
   - Install all dependencies
   - Create environment configuration
   - Build the application
   - Create systemd service
   - Generate startup/stop scripts

3. **Start the application**
   ```bash
   # Development mode
   ./start.sh
   
   # Production mode
   ./start.sh production
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Manual Installation

If you prefer manual installation:

1. **Install dependencies**
   ```bash
   npm run install-all
   ```

2. **Configure environment**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   ```

3. **Start development servers**
   ```bash
   npm run dev
   ```

## Configuration

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
MONGODB_URI=mongodb://localhost:27017/mongomanager
```

### MongoDB Connection

Default connection settings:
- Host: localhost
- Port: 27017
- Database: admin
- Authentication: None (configure as needed)

## Usage

### Adding Connections

1. Navigate to the **Connections** page
2. Click **Add Connection**
3. Fill in connection details:
   - Connection name
   - Host and port
   - Username/password (if required)
   - Database name
   - SSL/TLS settings
   - Replica set configuration

### Exploring Data

1. Select a connection from the sidebar
2. Use the **Database Explorer** to browse:
   - Databases
   - Collections
   - Documents
3. Click on items to expand and view details

### Running Queries

1. Go to the **Query Runner** page
2. Select database and collection
3. Choose query type:
   - **Find**: Search documents
   - **Aggregate**: Run aggregation pipelines
   - **Command**: Execute database commands
   - **Admin**: Run admin commands
4. Enter your query in JSON format
5. Click **Execute** to run the query

### Monitoring

1. Visit the **Monitoring** page for real-time metrics
2. View system performance charts
3. Monitor connection health
4. Check database statistics
5. Review alerts and notifications

## API Endpoints

### Connections
- `GET /api/connections` - List all connections
- `POST /api/connections` - Create new connection
- `PUT /api/connections/:id` - Update connection
- `DELETE /api/connections/:id` - Delete connection
- `POST /api/connections/:id/test` - Test connection

### Databases
- `GET /api/databases/:connectionId` - List databases
- `POST /api/databases/:connectionId` - Create database
- `DELETE /api/databases/:connectionId/:dbName` - Delete database
- `GET /api/databases/:connectionId/:dbName/stats` - Database stats

### Collections
- `GET /api/collections/:connectionId/:dbName` - List collections
- `POST /api/collections/:connectionId/:dbName` - Create collection
- `DELETE /api/collections/:connectionId/:dbName/:collectionName` - Delete collection

### Documents
- `GET /api/documents/:connectionId/:dbName/:collectionName` - List documents
- `POST /api/documents/:connectionId/:dbName/:collectionName` - Create document
- `PUT /api/documents/:connectionId/:dbName/:collectionName/:documentId` - Update document
- `DELETE /api/documents/:connectionId/:dbName/:collectionName/:documentId` - Delete document

### Queries
- `POST /api/queries/:connectionId/:dbName/:collectionName/query` - Execute query
- `POST /api/queries/:connectionId/:dbName/:collectionName/aggregate` - Execute aggregation
- `POST /api/queries/:connectionId/:dbName/command` - Execute command

### Monitoring
- `GET /api/monitoring/system` - System information
- `GET /api/monitoring/:connectionId/status` - Connection status
- `GET /api/monitoring/:connectionId/metrics` - Connection metrics
- `GET /api/monitoring/:connectionId/health` - Health check

## Development

### Project Structure

```
mongomanager/
├── backend/                 # Node.js backend
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   └── server.js           # Main server file
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── lib/            # Utilities
│   └── public/             # Static assets
├── setup.sh               # Linux setup script
├── start.sh               # Startup script
├── stop.sh                # Stop script
└── README.md              # This file
```

### Available Scripts

```bash
# Install all dependencies
npm run install-all

# Start development servers
npm run dev

# Start backend only
npm run server

# Start frontend only
npm run client

# Build for production
npm run build

# Start production server
npm start
```

### Development Workflow

1. **Backend Development**
   - Edit files in `backend/`
   - Server auto-restarts with nodemon
   - API available at http://localhost:5000

2. **Frontend Development**
   - Edit files in `frontend/src/`
   - Hot reload enabled
   - App available at http://localhost:3000

3. **Database Changes**
   - Update models in `backend/models/`
   - Add routes in `backend/routes/`
   - Update API services in `frontend/src/services/`

## Production Deployment

### Using Systemd Service

The setup script creates a systemd service for production deployment:

```bash
# Start service
sudo systemctl start mongomanager

# Stop service
sudo systemctl stop mongomanager

# Check status
sudo systemctl status mongomanager

# View logs
sudo journalctl -u mongomanager -f

# Enable auto-start
sudo systemctl enable mongomanager
```

### Environment Configuration

For production, update `backend/.env`:

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your_secure_jwt_secret
MONGODB_URI=mongodb://username:password@host:port/database
```

### Security Considerations

1. **MongoDB Security**
   - Enable authentication
   - Configure SSL/TLS
   - Set up firewall rules
   - Use replica sets for high availability

2. **Application Security**
   - Use strong JWT secrets
   - Enable HTTPS in production
   - Configure CORS properly
   - Set up rate limiting

3. **System Security**
   - Keep system updated
   - Use non-root user for application
   - Configure proper file permissions
   - Set up monitoring and logging

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check if MongoDB is running: `sudo systemctl status mongod`
   - Verify connection settings in the UI
   - Check firewall rules

2. **Port Already in Use**
   - Check what's using the port: `lsof -i :5000`
   - Kill the process or change the port in `.env`

3. **Permission Denied**
   - Ensure proper file permissions
   - Run setup script as non-root user
   - Check systemd service configuration

4. **Build Failures**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify all dependencies are installed

### Logs and Debugging

- **Application logs**: `sudo journalctl -u mongomanager -f`
- **MongoDB logs**: `sudo journalctl -u mongod -f`
- **Development logs**: Check terminal output when running `npm run dev`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation

## Acknowledgments

- Built with modern web technologies
- Inspired by MongoDB Compass and similar tools
- Uses Shadcn/UI for beautiful components
- Powered by React and Node.js ecosystem