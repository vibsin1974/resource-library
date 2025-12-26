const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize database schema
const initDatabase = () => {
    db.serialize(() => {
        // Create categories table
        db.run(`
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                icon TEXT,
                color TEXT
            )
        `);

        // Create posts table
        db.run(`
            CREATE TABLE IF NOT EXISTS posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                category_id INTEGER,
                created_date TEXT,
                FOREIGN KEY (category_id) REFERENCES categories(id)
            )
        `);

        // Create attachments table
        db.run(`
            CREATE TABLE IF NOT EXISTS attachments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                post_id INTEGER NOT NULL,
                file_name TEXT NOT NULL,
                file_size INTEGER,
                file_path TEXT,
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
            )
        `);

        // Check if we need to migrate from old files table
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='files'", (err, row) => {
            if (err) {
                console.error('Error checking for files table:', err);
                return;
            }

            if (row) {
                // Migrate existing files to posts/attachments
                console.log('Migrating existing files to posts/attachments...');
                migrateFilesToPosts();
            } else {
                // Check if sample data exists
                db.get('SELECT COUNT(*) as count FROM categories', (err, row) => {
                    if (err) {
                        console.error('Error checking categories:', err);
                        return;
                    }

                    if (row.count === 0) {
                        console.log('Inserting sample data...');
                        insertSampleData();
                    } else {
                        console.log('Database already contains data');
                    }
                });
            }
        });
    });
};

// Migrate files to posts
const migrateFilesToPosts = () => {
    db.all('SELECT * FROM files', (err, files) => {
        if (err) {
            console.error('Error reading files:', err);
            return;
        }

        if (files.length === 0) {
            console.log('No files to migrate');
            db.run('DROP TABLE IF EXISTS files');
            return;
        }

        let completed = 0;
        const total = files.length;

        files.forEach(file => {
            db.run(
                'INSERT INTO posts (title, category_id, created_date) VALUES (?, ?, ?)',
                [file.name, file.category_id, file.upload_date],
                function (err) {
                    if (err) {
                        console.error('Error inserting post:', err);
                        return;
                    }
                    const postId = this.lastID;

                    db.run(
                        'INSERT INTO attachments (post_id, file_name, file_size, file_path) VALUES (?, ?, ?, ?)',
                        [postId, file.name, file.size, file.file_path],
                        (err) => {
                            if (err) {
                                console.error('Error inserting attachment:', err);
                                return;
                            }

                            completed++;
                            if (completed === total) {
                                console.log('Migration completed successfully!');
                                db.run('DROP TABLE IF EXISTS files', (err) => {
                                    if (err) {
                                        console.error('Error dropping files table:', err);
                                    }
                                });
                            }
                        }
                    );
                }
            );
        });
    });
};

// Insert sample data
const insertSampleData = () => {
    const categories = [
        { name: '문서', icon: '📄', color: '#3b82f6' },
        { name: '이미지', icon: '🖼️', color: '#10b981' },
        { name: '동영상', icon: '🎬', color: '#f59e0b' },
        { name: '오디오', icon: '🎵', color: '#ec4899' },
        { name: '기타', icon: '📦', color: '#8b5cf6' }
    ];

    let catCompleted = 0;
    categories.forEach(cat => {
        db.run('INSERT INTO categories (name, icon, color) VALUES (?, ?, ?)',
            [cat.name, cat.icon, cat.color],
            (err) => {
                if (err) {
                    console.error('Error inserting category:', err);
                    return;
                }
                catCompleted++;
                if (catCompleted === categories.length) {
                    insertSamplePosts();
                }
            }
        );
    });
};

const insertSamplePosts = () => {
    const posts = [
        {
            title: '프로젝트 제안서',
            category_id: 1,
            created_date: '2025-01-15',
            attachments: [
                { file_name: '프로젝트_제안서_v1.pdf', file_size: 2457600, file_path: '/uploads/sample1.pdf' },
                { file_name: '프로젝트_제안서_v2.pdf', file_size: 2500000, file_path: '/uploads/sample1-2.pdf' }
            ]
        },
        {
            title: '회사 브랜딩 자료',
            category_id: 2,
            created_date: '2025-01-20',
            attachments: [
                { file_name: '로고.png', file_size: 524288, file_path: '/uploads/sample2.png' },
                { file_name: '배너.jpg', file_size: 2097152, file_path: '/uploads/sample2-2.jpg' },
                { file_name: '명함.png', file_size: 300000, file_path: '/uploads/sample2-3.png' }
            ]
        },
        {
            title: '제품 소개 영상',
            category_id: 3,
            created_date: '2025-01-22',
            attachments: [
                { file_name: '제품소개_KR.mp4', file_size: 15728640, file_path: '/uploads/sample3.mp4' },
                { file_name: '제품소개_EN.mp4', file_size: 16000000, file_path: '/uploads/sample3-2.mp4' }
            ]
        },
        {
            title: '사업계획서',
            category_id: 1,
            created_date: '2025-01-18',
            attachments: [
                { file_name: '사업계획서.docx', file_size: 1843200, file_path: '/uploads/sample4.docx' }
            ]
        },
        {
            title: '마케팅 자료',
            category_id: 2,
            created_date: '2025-01-21',
            attachments: [
                { file_name: '제품사진1.png', file_size: 3145728, file_path: '/uploads/sample5.png' },
                { file_name: '제품사진2.png', file_size: 3200000, file_path: '/uploads/sample5-2.png' },
                { file_name: '제품사진3.png', file_size: 3100000, file_path: '/uploads/sample5-3.png' }
            ]
        }
    ];

    let postCompleted = 0;
    posts.forEach(post => {
        db.run(
            'INSERT INTO posts (title, category_id, created_date) VALUES (?, ?, ?)',
            [post.title, post.category_id, post.created_date],
            function (err) {
                if (err) {
                    console.error('Error inserting post:', err);
                    return;
                }
                const postId = this.lastID;

                let attachCompleted = 0;
                post.attachments.forEach(attachment => {
                    db.run(
                        'INSERT INTO attachments (post_id, file_name, file_size, file_path) VALUES (?, ?, ?, ?)',
                        [postId, attachment.file_name, attachment.file_size, attachment.file_path],
                        (err) => {
                            if (err) {
                                console.error('Error inserting attachment:', err);
                                return;
                            }
                            attachCompleted++;
                            if (attachCompleted === post.attachments.length) {
                                postCompleted++;
                                if (postCompleted === posts.length) {
                                    console.log('Sample data inserted successfully!');
                                }
                            }
                        }
                    );
                });
            }
        );
    });
};

// Export database instance
module.exports = {
    db,
    initDatabase
};
