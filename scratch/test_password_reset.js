import mysql_db from '../backend/config/db.js';
import bcrypt from 'bcryptjs';

console.log('🔄 Verifying Reset Password Endpoint (using native fetch)...');

(async () => {
  try {
    // 1. Trigger Reset Password POST call
    console.log('  - Sending POST to /user/reset-password for Roshan...');
    const response = await fetch('http://localhost:8080/user/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Roshan',
        email: 'Roshan@gmail.com',
        newPassword: 'roshanpassword123'
      })
    });
    
    console.log('  - Response status:', response.status);
    const data = await response.json();
    console.log('  - Response data:', data);
    
    // 2. Retrieve hashed password from DB and check matches
    console.log('  - Checking database record...');
    const db = await mysql_db();
    const [rows] = await db.execute('SELECT password FROM users WHERE username = ?', ['Roshan']);
    await db.end();
    
    const dbHashed = rows[0].password;
    console.log('  - Password Hash in DB:', dbHashed);
    
    const isMatch = await bcrypt.compare('roshanpassword123', dbHashed);
    if (isMatch) {
      console.log('🎉 PASSWORD RESET AND DB UPDATE SUCCESSFULLY VERIFIED!');
      process.exit(0);
    } else {
      console.error('❌ Hashed password in DB does not match roshanpassword123!');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Integration test failed:', err.message);
    process.exit(1);
  }
})();
