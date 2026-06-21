import mysql_db from '../backend/config/db.js';

(async () => {
  try {
    const db = await mysql_db();
    
    // 1. Get Table Schema
    console.log('=== USERS TABLE SCHEMA ===');
    const [schema] = await db.execute('DESCRIBE users');
    console.table(schema);
    
    // 2. Get Table Rows
    console.log('\n=== USERS TABLE DATA ===');
    const [rows] = await db.execute('SELECT id, username, email, image, created_at FROM users');
    console.table(rows);
    
    await db.end();
    process.exit(0);
  } catch (err) {
    console.error('Error fetching users table:', err);
    process.exit(1);
  }
})();
