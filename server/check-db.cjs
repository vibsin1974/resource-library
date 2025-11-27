const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Checking attachments table...\n');

db.all('SELECT a.id, a.post_id, a.file_name, a.file_size FROM attachments a LIMIT 10', (err, rows) => {
    if (err) {
        console.error('Error:', err.message);
        db.close();
        return;
    }

    console.log('Attachments:');
    console.table(rows);

    console.log('\nChecking posts with total size...\n');

    db.all(`
        SELECT 
            p.id,
            p.title,
            COUNT(a.id) as attachment_count,
            COALESCE(SUM(a.file_size), 0) as total_size
        FROM posts p
        LEFT JOIN attachments a ON p.id = a.post_id
        GROUP BY p.id
        LIMIT 5
    `, (err, posts) => {
        if (err) {
            console.error('Error:', err.message);
        } else {
            console.log('Posts with total size:');
            console.table(posts);
        }
        db.close();
    });
});
