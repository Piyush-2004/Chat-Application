import mysql_db from '../backend/config/db.js';

(async () => {
  try {
    const db = await mysql_db();
    
    console.log('Adding reactions JSON column to group_messages table if not exists...');
    
    // We can check if column exists first or use ALTER TABLE but in MySQL it might throw if exists,
    // so we can wrap in try-catch or query information_schema.
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'group_messages' 
        AND COLUMN_NAME = 'reactions'
    `);
    
    if (columns.length === 0) {
      await db.execute('ALTER TABLE group_messages ADD COLUMN reactions JSON DEFAULT NULL');
      console.log('✅ reactions JSON column successfully added to group_messages table.');
    } else {
      console.log('ℹ️ reactions JSON column already exists in group_messages table.');
    }
    
    await db.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Alter table failed:', err);
    process.exit(1);
  }
})();
