const initSqlJs = require('sql.js');
const wasmBinary = require('./wasm');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.VERCEL
  ? '/tmp/helpdesk.db'
  : (process.env.DATABASE_URL || path.join(__dirname, '..', '..', 'helpdesk.db'));

const BUNDLED_DB_PATH = path.join(__dirname, '..', '..', 'helpdesk.db');

let db = null;

// Uses MySQL (AWS RDS) when DB_HOST is set; otherwise falls back to the
// local SQLite file (sql.js) so local development keeps working unchanged.
async function getDb() {
  if (db) return db;
  if (process.env.DB_HOST) {
    db = await initMySql();
  } else {
    db = await initSqlite();
  }
  return db;
}

async function initMySql() {
  const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required DB environment variables: ${missing.join(', ')}`);
  }
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true,
    timezone: 'Z',
  });
  await initMySqlSchema(pool);
  return { kind: 'mysql', pool };
}

async function initMySqlSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('Admin','Agent','Customer') NOT NULL,
      is_bot TINYINT(1) NOT NULL DEFAULT 0,
      skills VARCHAR(255) DEFAULT 'Technical,Billing,General',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      subject VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      category ENUM('Technical','Billing','General') NOT NULL,
      priority ENUM('Low','Medium','High','Critical') NOT NULL,
      status ENUM('Open','InProgress','Resolved','Closed','Reopened') NOT NULL DEFAULT 'Open',
      customer_id INT NOT NULL,
      assigned_to INT,
      auto_suggested TINYINT(1) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES users(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticket_id INT NOT NULL,
      user_id INT NOT NULL,
      content TEXT NOT NULL,
      is_internal TINYINT(1) DEFAULT 0,
      attachment_name VARCHAR(255),
      attachment_type VARCHAR(120),
      attachment_data LONGTEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      message TEXT NOT NULL,
      ticket_id INT,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS knowledge_base (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      category ENUM('Technical','Billing','General') NOT NULL,
      created_by INT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);
}

async function initSqlite() {
  const SQL = await initSqlJs({ wasmBinary });
  let sqliteDb;
  if (!fs.existsSync(DB_PATH) && DB_PATH !== BUNDLED_DB_PATH && fs.existsSync(BUNDLED_DB_PATH)) {
    fs.copyFileSync(BUNDLED_DB_PATH, DB_PATH);
  }
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    sqliteDb = new SQL.Database(buffer);
  } else {
    sqliteDb = new SQL.Database();
  }

  sqliteDb.run('PRAGMA foreign_keys = ON');
  initSqliteSchema(sqliteDb);
  saveSqliteDb(sqliteDb);
  return { kind: 'sqlite', db: sqliteDb };
}

function saveSqliteDb(sqliteDb) {
  const data = sqliteDb.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function initSqliteSchema(sqliteDb) {
  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('Admin','Agent','Customer')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('Technical','Billing','General')),
      priority TEXT NOT NULL CHECK(priority IN ('Low','Medium','High','Critical')),
      status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open','InProgress','Resolved','Closed','Reopened')),
      customer_id INTEGER NOT NULL REFERENCES users(id),
      assigned_to INTEGER REFERENCES users(id),
      auto_suggested INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      is_internal INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const commentColumns = sqliteDb.exec('PRAGMA table_info(comments)')[0]?.values.map(column => column[1]) || [];
  if (!commentColumns.includes('attachment_name')) {
    sqliteDb.run('ALTER TABLE comments ADD COLUMN attachment_name TEXT');
    sqliteDb.run('ALTER TABLE comments ADD COLUMN attachment_type TEXT');
    sqliteDb.run('ALTER TABLE comments ADD COLUMN attachment_data TEXT');
  }
  const userColumns = sqliteDb.exec('PRAGMA table_info(users)')[0]?.values.map(column => column[1]) || [];
  if (!userColumns.includes('is_bot')) {
    sqliteDb.run('ALTER TABLE users ADD COLUMN is_bot INTEGER NOT NULL DEFAULT 0');
  }
  if (!userColumns.includes('skills')) {
    sqliteDb.run("ALTER TABLE users ADD COLUMN skills TEXT DEFAULT 'Technical,Billing,General'");
  }
  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS knowledge_base (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('Technical','Billing','General')),
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function run(sql, params = []) {
  const conn = await getDb();
  if (conn.kind === 'mysql') {
    const [result] = await conn.pool.query(sql, params);
    return { changes: result.affectedRows, lastId: result.insertId };
  }
  conn.db.run(sql, params);
  const changes = conn.db.getRowsModified();
  const lastId = conn.db.exec('SELECT last_insert_rowid() as id')[0]?.values[0][0] ?? 0;
  saveSqliteDb(conn.db);
  return { changes, lastId };
}

async function get(sql, params = []) {
  const conn = await getDb();
  if (conn.kind === 'mysql') {
    const [rows] = await conn.pool.query(sql, params);
    return rows[0] || null;
  }
  const stmt = conn.db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

async function all(sql, params = []) {
  const conn = await getDb();
  if (conn.kind === 'mysql') {
    const [rows] = await conn.pool.query(sql, params);
    return rows;
  }
  const stmt = conn.db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

module.exports = { getDb, run, get, all };