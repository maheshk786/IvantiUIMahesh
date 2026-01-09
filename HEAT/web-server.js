const express = require('express');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');
const http = require('http');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connect to application server
const appClient = Client('http://localhost:3001');
const pendingRequests = new Map();

console.log('Web Server starting on port 3000...');

// Application server connection handlers
appClient.on('connect', () => {
  console.log('Connected to application server');
});

appClient.on('app:users-result', (data) => {
  const callback = pendingRequests.get(data.requestId);
  if (callback) {
    callback(data);
    pendingRequests.delete(data.requestId);
  }
});

appClient.on('app:create-user-result', (data) => {
  const callback = pendingRequests.get(data.requestId);
  if (callback) {
    callback(data);
    pendingRequests.delete(data.requestId);
  }
});

appClient.on('app:user-created', (user) => {
  // Broadcast new user to all connected clients
  io.emit('user-created', user);
});

appClient.on('app:db-stats', (stats) => {
  // Forward database stats to all connected clients
  io.emit('db-stats', stats);
});

appClient.on('app:status', (status) => {
  // Forward app server status to all connected clients
  io.emit('app-status', status);
});

// REST API endpoints
app.get('/api/users', (req, res) => {
  const requestId = Date.now() + Math.random();
  
  pendingRequests.set(requestId, (result) => {
    if (result.success) {
      res.json(result.users);
    } else {
      res.status(500).json({ error: result.error });
    }
  });
  
  appClient.emit('app:get-users', { requestId });
});

app.post('/api/users', (req, res) => {
  const requestId = Date.now() + Math.random();
  
  pendingRequests.set(requestId, (result) => {
    if (result.success) {
      res.status(201).json(result.user);
    } else {
      res.status(500).json({ error: result.error });
    }
  });
  
  appClient.emit('app:create-user', { 
    requestId, 
    user: req.body 
  });
});

// Handle client connections (laptops/browsers)
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle real-time user requests from clients
  socket.on('get-users', () => {
    const requestId = Date.now() + Math.random();
    
    pendingRequests.set(requestId, (result) => {
      socket.emit('users-data', result);
    });
    
    appClient.emit('app:get-users', { requestId });
  });

  socket.on('create-user', (userData) => {
    const requestId = Date.now() + Math.random();
    
    pendingRequests.set(requestId, (result) => {
      socket.emit('user-created-response', result);
    });
    
    appClient.emit('app:create-user', { 
      requestId, 
      user: userData 
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('Web Server running on http://localhost:3000');
  console.log('API available at http://localhost:3000/api/users');
});