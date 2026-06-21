#!/usr/bin/env node

import mysql_db from './config/db.js';

const setupDatabase = async () => {
    console.log('🚀 Starting database setup...');

    try {
        const db = await mysql_db();

        // Create users table first (referenced by other tables)
        console.log('📊 Creating users table...');
        await db.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Users table ready');

        // Create usersList table
        console.log('📊 Creating usersList table...');
        await db.execute(`
            CREATE TABLE IF NOT EXISTS usersList (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ UsersList table ready');

        // Create messages table
        console.log('📊 Creating messages table...');
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
        console.log('✅ Messages table ready');

        // Create groups table
        console.log('📊 Creating groups table...');
        await db.execute(`
            CREATE TABLE IF NOT EXISTS \`groups\` (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                created_by INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id)
            );
        `);
        console.log('✅ Groups table ready');

        // Create group_members table
        console.log('📊 Creating group_members table...');
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
        console.log('✅ Group members table ready');

        // Create group_messages table
        console.log('📊 Creating group_messages table...');
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
        console.log('✅ Group messages table ready');

        // Insert sample data (optional)
        console.log('🌱 Inserting sample data...');

        // Check if users table is empty
        const [userRows] = await db.execute('SELECT COUNT(*) as count FROM users');
        if (userRows[0].count === 0) {
            await db.execute(`
                INSERT INTO users (username, email, password) VALUES
                ('admin', 'admin@example.com', '$2b$10$example_hashed_password'),
                ('john_doe', 'john@example.com', '$2b$10$example_hashed_password'),
                ('jane_smith', 'jane@example.com', '$2b$10$example_hashed_password');
            `);
            console.log('✅ Sample users created');
        }

        // Check if usersList table is empty
        const [userListRows] = await db.execute('SELECT COUNT(*) as count FROM usersList');
        if (userListRows[0].count === 0) {
            await db.execute(`
                INSERT INTO usersList (username) VALUES
                ('User1'),
                ('User2'),
                ('TestUser1'),
                ('TestUser2');
            `);
            console.log('✅ Sample users list created');
        }

        console.log('🎉 Database setup completed successfully!');
        console.log('');
        console.log('📝 Tables created:');
        console.log('  - users');
        console.log('  - usersList');
        console.log('  - messages');
        console.log('  - groups');
        console.log('  - group_members');
        console.log('  - group_messages');

        await db.end();
        process.exit(0);

    } catch (error) {
        console.error('❌ Database setup failed:', error);
        process.exit(1);
    }
};

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    setupDatabase();
}

export default setupDatabase;