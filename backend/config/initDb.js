import mysql_db from './db.js';

export async function initDb() {
  console.log('🚀 Starting sequential database initialization...');
  let db = null;
  try {
    db = await mysql_db();

    // 1. Create users table with image column
    console.log('📊 Ensuring users table exists...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        image VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Users table check passed.');

    // 1b. Schema migration: Ensure 'image' column exists in case 'users' table was created without it
    const [userColumns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'image'
    `);
    if (userColumns.length === 0) {
      console.log('➕ Adding missing "image" column to users table...');
      await db.execute('ALTER TABLE users ADD COLUMN image VARCHAR(255) DEFAULT NULL');
      console.log('✅ "image" column added successfully.');
    }

    // 2. Create usersList table
    console.log('📊 Ensuring usersList table exists...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS usersList (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ UsersList table check passed.');

    // 3. Create messages table
    console.log('📊 Ensuring messages table exists...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL,
        receiver_id INT,
        text TEXT,
        image VARCHAR(255),
        status ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reactions JSON,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ Messages table check passed.');

    // 4. Create groups table
    console.log('📊 Ensuring groups table exists...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS \`groups\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      );
    `);
    console.log('✅ Groups table check passed.');

    // 5. Create group_members table
    console.log('📊 Ensuring group_members table exists...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS group_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        user_id INT NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES \`groups\`(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ Group members table check passed.');

    // 6. Create group_messages table
    console.log('📊 Ensuring group_messages table exists...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS group_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        sender_id INT NOT NULL,
        text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reactions JSON,
        FOREIGN KEY (group_id) REFERENCES \`groups\`(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ Group messages table check passed.');

    console.log('🎉 Database sequential initialization completed successfully.');
    await db.end();
  } catch (err) {
    console.error('❌ Database initialization error:', err);
    if (db) {
      try {
        await db.end();
      } catch (_) {}
    }
  }
}
