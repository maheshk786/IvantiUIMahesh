# Bidirectional Web Architecture

A complete web server architecture demonstrating bidirectional connections between:
- **User Laptop** ↔ **Web Server** ↔ **Application Server** ↔ **Database Server**

## 📊 Visual Architecture Diagram

**[View Interactive Architecture Diagram](architecture-diagram.html)** - Open this file in your browser to see the complete visual overview with interactive elements.

## Architecture Overview

```
[User Laptop] ←→ [Web Server] ←→ [Application Server] ←→ [Database Server]
    :3000           :3000           :3001                    :3002
```

### Components

1. **Database Server** (port 3002)
   - SQLite in-memory database
   - Socket.IO server for bidirectional communication
   - Handles queries and sends real-time stats

2. **Application Server** (port 3001)
   - Business logic layer
   - Connects to database server via Socket.IO client
   - Socket.IO server for web server connections
   - Manages user operations and broadcasts updates

3. **Web Server** (port 3000)
   - HTTP/REST API endpoints
   - Socket.IO server for client connections
   - Socket.IO client to application server
   - Serves static files and handles client requests

4. **User Interface**
   - Real-time web application
   - WebSocket connection to web server
   - Live updates and bidirectional communication

## Features

- **Real-time bidirectional communication** at all levels
- **Live user management** with instant updates
- **System monitoring** with connection status
- **Database statistics** pushed in real-time
- **Error handling** and connection recovery
- **REST API** alongside WebSocket connections

## Installation

```bash
npm install
```

## Running the System

### Option 1: Start all servers at once
```bash
npm run start:all
```

### Option 2: Start servers individually
```bash
# Terminal 1 - Database Server
npm run start:db

# Terminal 2 - Application Server  
npm run start:app

# Terminal 3 - Web Server
npm run start:web
```

### Option 3: Development mode with auto-restart
```bash
npm run dev
```

## Usage

1. Open your browser to `http://localhost:3000`
2. The interface shows real-time connection status
3. Add users through the form - updates appear instantly
4. Monitor system statistics and logs
5. All changes propagate bidirectionally through the architecture

## API Endpoints

- `GET /api/users` - Retrieve all users
- `POST /api/users` - Create a new user

## WebSocket Events

### Client → Web Server
- `get-users` - Request user list
- `create-user` - Create new user

### Web Server → Client  
- `users-data` - User list response
- `user-created` - New user notification
- `db-stats` - Database statistics
- `app-status` - Application server status

## Testing Bidirectional Communication

1. Open multiple browser tabs to see real-time updates
2. Create users in one tab and watch them appear in others
3. Monitor connection status indicators
4. Check the real-time log for communication flow

The system demonstrates true bidirectional communication where data flows seamlessly between all layers, enabling real-time updates and system monitoring.