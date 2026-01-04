const express = require('express');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.json());

// Connect to database server
const dbClient = Client('http://localhost:3002');
const pendingQueries = new Map();

console.log('Application Server starting on port 3001...');

// Database connection handlers
dbClient.on('connect', () => {
  console.log('Connected to database server');
});

dbClient.on('db:result', (data) => {
  const { queryId, success, data: result, error } = data;
  const callback = pendingQueries.get(queryId);
  if (callback) {
    callback(success ? null : new Error(error), result);
    pendingQueries.delete(queryId);
  }
});

dbClient.on('db:stats', (stats) => {
  // Broadcast database stats to all connected web servers
  io.emit('app:db-stats', stats);
});

// Helper function to query database
function queryDatabase(sql, params = []) {
  return new Promise((resolve, reject) => {
    const queryId = Date.now() + Math.random();
    pendingQueries.set(queryId, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
    
    dbClient.emit('db:query', { queryId, sql, params });
  });
}

// Handle connections from web server
io.on('connection', (socket) => {
  console.log('Web server connected to app server:', socket.id);

  // Handle user operations from web server
  socket.on('app:get-users', async (data) => {
    try {
      const users = await queryDatabase('SELECT * FROM users ORDER BY created_at DESC');
      socket.emit('app:users-result', {
        requestId: data.requestId,
        success: true,
        users
      });
    } catch (error) {
      socket.emit('app:users-result', {
        requestId: data.requestId,
        success: false,
        error: error.message
      });
    }
  });

  socket.on('app:create-user', async (data) => {
    try {
      const { name, email } = data.user;
      const result = await queryDatabase(
        'INSERT INTO users (name, email) VALUES (?, ?)',
        [name, email]
      );
      
      // Get the created user
      const newUser = await queryDatabase(
        'SELECT * FROM users WHERE id = ?',
        [result.lastID]
      );
      
      // Broadcast new user to all connected web servers
      io.emit('app:user-created', newUser[0]);
      
      socket.emit('app:create-user-result', {
        requestId: data.requestId,
        success: true,
        user: newUser[0]
      });
    } catch (error) {
      socket.emit('app:create-user-result', {
        requestId: data.requestId,
        success: false,
        error: error.message
      });
    }
  });

  // Send periodic app server status
  setInterval(() => {
    socket.emit('app:status', {
      status: 'healthy',
      connections: io.engine.clientsCount,
      timestamp: new Date().toISOString()
    });
  }, 15000);

  socket.on('disconnect', () => {
    console.log('Web server disconnected from app server');
  });
});

server.listen(3001, () => {
  console.log('Application Server running on http://localhost:3001');
});