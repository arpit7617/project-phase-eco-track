const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Wrap table creation in a Promise so it can be awaited
function createTables() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullname TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) return reject(err);
      });

      db.run(`CREATE TABLE IF NOT EXISTS community_tips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        tip TEXT NOT NULL,
        image TEXT, -- new column for uploaded image
        likes INTEGER DEFAULT 0, -- new column for likes
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`, (err) => {
        if (err) return reject(err);
      });

      db.run(`CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        tip_id INTEGER NOT NULL,
        UNIQUE(user_id, tip_id),
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(tip_id) REFERENCES community_tips(id)
      )`, (err) => {
        if (err) return reject(err);
      });

      db.run(`CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`, (err) => {
        if (err) return reject(err);
      });

db.run(`CREATE TABLE IF NOT EXISTS sustainability_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  activity TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity REAL NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)`, (err) => {
  if (err) return reject(err);
});



      // If all runs succeed, resolve after last one
      // Use a small trick: call resolve in a setImmediate or after a short delay
      setImmediate(() => resolve());
    });
  });
}

module.exports = {
  db,
  createTables
};
