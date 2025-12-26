const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('현재 카테고리 목록:');
db.all('SELECT * FROM categories', (err, rows) => {
    if (err) {
        console.error('Error:', err);
        return;
    }

    console.log(rows);

    // Check if '오디오' category already exists
    const audioExists = rows.some(row => row.name === '오디오');

    if (audioExists) {
        console.log('\n오디오 카테고리가 이미 존재합니다.');
        db.close();
    } else {
        console.log('\n오디오 카테고리를 추가합니다...');
        db.run(
            'INSERT INTO categories (name, icon, color) VALUES (?, ?, ?)',
            ['오디오', '🎵', '#ec4899'],
            function (err) {
                if (err) {
                    console.error('Error adding category:', err);
                } else {
                    console.log('오디오 카테고리가 성공적으로 추가되었습니다! (ID:', this.lastID + ')');
                }

                // Display updated categories
                console.log('\n업데이트된 카테고리 목록:');
                db.all('SELECT * FROM categories', (err, rows) => {
                    if (err) {
                        console.error('Error:', err);
                    } else {
                        console.log(rows);
                    }
                    db.close();
                });
            }
        );
    }
});
