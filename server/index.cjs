const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const archiver = require('archiver');
const { db, initDatabase } = require('./database.cjs');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Initialize database
// Initialize database
initDatabase();

// Helper to fix encoding (latin1 -> utf8) for Multer
const fixEncoding = (str) => {
    return Buffer.from(str, 'latin1').toString('utf8');
};

// ============ Categories ============

app.get('/api/categories', (req, res) => {
    db.all('SELECT * FROM categories', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/categories', (req, res) => {
    const { name, icon, color } = req.body;
    db.run(
        'INSERT INTO categories (name, icon, color) VALUES (?, ?, ?)',
        [name, icon, color],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID, name, icon, color });
        }
    );
});

app.put('/api/categories/:id', (req, res) => {
    const { id } = req.params;
    const { name, icon, color } = req.body;
    db.run(
        'UPDATE categories SET name = ?, icon = ?, color = ? WHERE id = ?',
        [name, icon, color, id],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id, name, icon, color });
        }
    );
});

app.delete('/api/categories/:id', (req, res) => {
    const { id } = req.params;
    console.log(`[DELETE] Request to delete category ${id}`);

    db.serialize(() => {
        // 1. Turn off foreign keys temporarily to allow manual cleanup
        db.run("PRAGMA foreign_keys = OFF");

        // 2. Get posts to find attachments
        db.all('SELECT id FROM posts WHERE category_id = ?', [id], (err, posts) => {
            if (err) {
                console.error('[DELETE] Error finding posts:', err);
                res.status(500).json({ error: err.message });
                return;
            }

            const postIds = posts.map(p => p.id);

            if (postIds.length > 0) {
                const placeholders = postIds.map(() => '?').join(',');

                // 3. Find and delete physical files
                db.all(`SELECT * FROM attachments WHERE post_id IN (${placeholders})`, postIds, (err, attachments) => {
                    if (!err && attachments) {
                        attachments.forEach(attachment => {
                            if (attachment.file_path) {
                                try {
                                    const filePath = path.join(__dirname, attachment.file_path);
                                    if (fs.existsSync(filePath)) {
                                        fs.unlinkSync(filePath);
                                        console.log(`[DELETE] Deleted file: ${filePath}`);
                                    }
                                } catch (e) {
                                    console.error(`[DELETE] Failed to delete file`, e);
                                }
                            }
                        });
                    }

                    // 4. Delete attachments from DB
                    db.run(`DELETE FROM attachments WHERE post_id IN (${placeholders})`, postIds);

                    // 5. Delete posts
                    db.run('DELETE FROM posts WHERE category_id = ?', [id]);
                });
            } else {
                // Even if no posts, try to delete posts just in case
                db.run('DELETE FROM posts WHERE category_id = ?', [id]);
            }

            // 6. Delete category
            db.run('DELETE FROM categories WHERE id = ?', [id], function (err) {
                // 7. Turn foreign keys back on
                db.run("PRAGMA foreign_keys = ON");

                if (err) {
                    console.error('[DELETE] Error deleting category:', err);
                    res.status(500).json({ error: err.message });
                } else {
                    console.log(`[DELETE] Successfully deleted category ${id}`);
                    res.json({ message: 'Category deleted successfully' });
                }
            });
        });
    });
});

// ============ Posts ============

app.get('/api/posts', (req, res) => {
    const { category_id } = req.query;
    let query = `
        SELECT 
            p.id,
            p.title,
            p.category_id,
            p.created_date,
            COUNT(a.id) as attachment_count,
            COALESCE(SUM(a.file_size), 0) as total_size
        FROM posts p
        LEFT JOIN attachments a ON p.id = a.post_id
    `;
    const params = [];

    if (category_id) {
        query += ' WHERE p.category_id = ?';
        params.push(category_id);
    }

    query += ' GROUP BY p.id, p.title, p.category_id, p.created_date ORDER BY p.created_date DESC';

    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.get('/api/posts/:id', (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM posts WHERE id = ?', [id], (err, post) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!post) {
            res.status(404).json({ error: 'Post not found' });
            return;
        }

        db.all('SELECT * FROM attachments WHERE post_id = ?', [id], (err, attachments) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ ...post, attachments });
        });
    });
});

app.post('/api/posts', upload.array('files', 5), (req, res) => {
    const { title, category_id } = req.body;
    const created_date = new Date().toISOString().split('T')[0];

    if (!title) {
        res.status(400).json({ error: 'Title is required' });
        return;
    }

    if (!req.files || req.files.length === 0) {
        res.status(400).json({ error: 'At least one file is required' });
        return;
    }

    db.run(
        'INSERT INTO posts (title, category_id, created_date) VALUES (?, ?, ?)',
        [title, category_id, created_date],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            const postId = this.lastID;
            const insertAttachment = db.prepare(
                'INSERT INTO attachments (post_id, file_name, file_size, file_path) VALUES (?, ?, ?, ?)'
            );

            req.files.forEach(file => {
                const file_path = `/uploads/${file.filename}`;
                // Fix encoding for Korean filenames
                const originalName = fixEncoding(file.originalname);
                insertAttachment.run(postId, originalName, file.size, file_path);
            });

            insertAttachment.finalize((err) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }

                res.json({
                    id: postId,
                    title,
                    category_id,
                    created_date,
                    attachment_count: req.files.length
                });
            });
        }
    );
});

app.put('/api/posts/:id', (req, res) => {
    const { id } = req.params;
    const { title, category_id } = req.body;

    if (!title) {
        res.status(400).json({ error: 'Title is required' });
        return;
    }

    db.run(
        'UPDATE posts SET title = ?, category_id = ? WHERE id = ?',
        [title, category_id, id],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id, title, category_id });
        }
    );
});

app.delete('/api/posts/:id', (req, res) => {
    const { id } = req.params;

    db.all('SELECT * FROM attachments WHERE post_id = ?', [id], (err, attachments) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        attachments.forEach(attachment => {
            if (attachment.file_path) {
                const filePath = path.join(__dirname, attachment.file_path);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        });

        db.run('DELETE FROM attachments WHERE post_id = ?', [id], (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            db.run('DELETE FROM posts WHERE id = ?', [id], (err) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({ message: 'Post deleted' });
            });
        });
    });
});

app.get('/api/posts/:id/download', (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM posts WHERE id = ?', [id], (err, post) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!post) {
            res.status(404).json({ error: 'Post not found' });
            return;
        }

        db.all('SELECT * FROM attachments WHERE post_id = ?', [id], (err, attachments) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            if (attachments.length === 0) {
                res.status(404).json({ error: 'No attachments found' });
                return;
            }

            const archive = archiver('zip', { zlib: { level: 9 } });
            // UTF-8 encoding for Korean filename support (RFC 5987)
            const zipFilename = `${post.title}.zip`;
            const encodedFilename = encodeURIComponent(zipFilename);
            res.setHeader('Content-Type', 'application/zip');
            // Use safe ASCII name for fallback, encoded name for modern browsers
            res.setHeader('Content-Disposition', `attachment; filename="download.zip"; filename*=UTF-8''${encodedFilename}`);
            archive.pipe(res);

            attachments.forEach(attachment => {
                const filePath = path.join(__dirname, attachment.file_path);
                if (!fs.existsSync(filePath)) {
                    const content = `Sample file: ${attachment.file_name}\\nThis is a placeholder for demonstration purposes.`;
                    fs.writeFileSync(filePath, content);
                }
                archive.file(filePath, { name: attachment.file_name });
            });

            archive.finalize();
        });
    });
});

// ============ Attachments ============

app.get('/api/attachments/:id/download', (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM attachments WHERE id = ?', [id], (err, attachment) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!attachment) {
            res.status(404).json({ error: 'Attachment not found' });
            return;
        }

        const filePath = path.join(__dirname, attachment.file_path);
        if (!fs.existsSync(filePath)) {
            const content = `Sample file: ${attachment.file_name}\\nThis is a placeholder for demonstration purposes.`;
            fs.writeFileSync(filePath, content);
        }

        // UTF-8 encoding for Korean filename support (RFC 5987)
        const encodedFilename = encodeURIComponent(attachment.file_name);
        // Use safe ASCII name for fallback
        const ext = path.extname(attachment.file_name);
        const fallbackName = `download${ext}`;
        res.setHeader('Content-Disposition', `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodedFilename}`);
        res.sendFile(filePath, (err) => {
            if (err) {
                console.error('Download error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Download failed' });
                }
            }
        });
    });
});

app.post('/api/posts/:id/attachments', upload.single('file'), (req, res) => {
    const { id } = req.params;

    if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
    }

    db.get('SELECT COUNT(*) as count FROM attachments WHERE post_id = ?', [id], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        if (result.count >= 5) {
            res.status(400).json({ error: 'Maximum 5 attachments per post' });
            return;
        }

        const { originalname, size, filename } = req.file;
        const file_path = `/uploads/${filename}`;
        // Fix encoding for Korean filenames
        const fixedOriginalName = fixEncoding(originalname);

        db.run(
            'INSERT INTO attachments (post_id, file_name, file_size, file_path) VALUES (?, ?, ?, ?)',
            [id, fixedOriginalName, size, file_path],
            function (err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({
                    id: this.lastID,
                    post_id: id,
                    file_name: originalname,
                    file_size: size,
                    file_path
                });
            }
        );
    });
});

app.delete('/api/attachments/:id', (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM attachments WHERE id = ?', [id], (err, attachment) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!attachment) {
            res.status(404).json({ error: 'Attachment not found' });
            return;
        }

        if (attachment.file_path) {
            const filePath = path.join(__dirname, attachment.file_path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        db.run('DELETE FROM attachments WHERE id = ?', [id], (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Attachment deleted' });
        });
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`- Local: http://localhost:${PORT}`);
    console.log(`- Network: http://0.0.0.0:${PORT}`);
});
