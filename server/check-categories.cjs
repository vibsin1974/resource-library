const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Checking categories...\n');

db.all('SELECT * FROM categories', (err, categories) => {
    if (err) {
        console.error('Error:', err.message);
        db.close();
        return;
    }

    console.log('Categories:');
    console.table(categories);

    console.log('\nChecking posts with categories...\n');

    db.all(`
        SELECT 
            p.id,
            p.title,
            p.category_id,
            c.name as category_name,
            c.icon as category_icon
        FROM posts p
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY p.id
    `, (err, posts) => {
        if (err) {
            console.error('Error:', err.message);
        } else {
            console.log('Posts with categories:');
            console.table(posts);
        }
        db.close();
    });
});
