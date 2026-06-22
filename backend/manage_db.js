import mysql_db from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const command = process.argv[2];
const arg = process.argv[3];

async function run() {
  let db;
  try {
    db = await mysql_db();
    
    if (command === 'users') {
      console.log('Fetching users...');
      const [users] = await db.execute('SELECT id, username, email, image, created_at FROM users');
      console.table(users);
      
    } else if (command === 'messages') {
      console.log('Fetching messages...');
      const [messages] = await db.execute('SELECT id, sender_id, receiver_id, text, created_at FROM messages');
      console.table(messages);
      
    } else if (command === 'delete' && arg) {
      console.log(`Deleting user with username: "${arg}"...`);
      const [result] = await db.execute('DELETE FROM users WHERE username = ?', [arg]);
      if (result.affectedRows > 0) {
        console.log(`✅ Successfully deleted user "${arg}"`);
      } else {
        console.log(`❌ User "${arg}" not found.`);
      }
      
    } else {
      console.log('Usage:');
      console.log('  node manage_db.js users          - Show all users');
      console.log('  node manage_db.js messages       - Show all messages');
      console.log('  node manage_db.js delete <name>  - Delete a user by username');
    }
    
    await db.end();
  } catch (err) {
    console.error('❌ Error executing database command:', err);
    if (db) {
      try {
        await db.end();
      } catch (_) {}
    }
  }
}

run();
