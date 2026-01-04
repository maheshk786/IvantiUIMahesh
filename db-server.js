const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Initialize SQLite database
const db = new sqlite3.Database(':memory:');

// Create sample table
db.serialize(() => {
  db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
  db.run("INSERT INTO users (name, email) VALUES ('John Doe', 'john@example.com')");
  db.run("INSERT INTO users (name, email) VALUES ('Jane Smith', 'jane@example.com')");
});

console.log('Database Server starting on port 3002...');

io.on('connection', (socket) => {
  console.log('App server connected to database:', socket.id);

  // Handle database queries from app server
  socket.on('db:query', (data) => {
    const { queryId, sql, params = [] } = data;
    
    if (sql.toLowerCase().startsWith('select')) {
      db.all(sql, params, (err, rows) => {
        socket.emit('db:result', {
          queryId,
          success: !err,
          data: rows,
          error: err?.message
        });
      });
    } else {
      db.run(sql, params, function(err) {
        socket.emit('db:result', {
          queryId,
          success: !err,
          data: { lastID: this.lastID, changes: this.changes },
          error: err?.message
        });
      });
    }
  });

  // Send periodic database stats
  setInterval(() => {
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
      if (!err) {
        socket.emit('db:stats', {
          userCount: row.count,
          timestamp: new Date().toISOString()
        });
      }
    });
  }, 10000);

  socket.on('disconnect', () => {
    console.log('App server disconnected from database');
  });
});

server.listen(3002, () => {
  console.log('Database Server running on http://localhost:3002');
});