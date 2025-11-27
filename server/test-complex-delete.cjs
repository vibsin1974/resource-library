const http = require('http');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const API_URL = 'http://localhost:3001/api';

// Helper to make requests
const request = (method, path, data = null, headers = {}) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: `/api${path}`,
            method: method,
            headers: headers
        };

        if (data && !headers['Content-Type'] && !headers['content-type']) {
            options.headers['Content-Type'] = 'application/json';
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve(body);
                }
            });
        });

        req.on('error', reject);

        if (data) {
            if (data instanceof FormData) {
                data.pipe(req);
            } else {
                req.write(JSON.stringify(data));
                req.end();
            }
        } else {
            req.end();
        }
    });
};

async function testFullDeleteFlow() {
    try {
        console.log('1. Creating Test Category...');
        const category = await request('POST', '/categories', {
            name: 'DeleteTest_Complex',
            icon: '🧪',
            color: '#ff0000'
        });
        console.log('Category created:', category);

        console.log('\n2. Creating Test Post with Attachment...');
        const form = new FormData();
        form.append('title', 'Test Post');
        form.append('category_id', category.id);

        // Create a dummy file
        const dummyFilePath = path.join(__dirname, 'test_file.txt');
        fs.writeFileSync(dummyFilePath, 'This is a test file');
        form.append('files', fs.createReadStream(dummyFilePath));

        const post = await new Promise((resolve, reject) => {
            const options = {
                hostname: 'localhost',
                port: 3001,
                path: '/api/posts',
                method: 'POST',
                headers: form.getHeaders()
            };
            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => resolve(JSON.parse(body)));
            });
            form.pipe(req);
        });
        console.log('Post created:', post);

        // Clean up dummy file
        fs.unlinkSync(dummyFilePath);

        console.log(`\n3. Deleting Category ${category.id} (Should cascade delete post and file)...`);
        const result = await request('DELETE', `/categories/${category.id}`);
        console.log('Delete result:', result);

        if (result.message === 'Category deleted successfully') {
            console.log('\nSUCCESS: Complex deletion logic works!');
        } else {
            console.error('\nFAILURE: Unexpected response:', result);
        }

    } catch (error) {
        console.error('\nERROR during test:', error);
    }
}

testFullDeleteFlow();
