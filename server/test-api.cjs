const http = require('http');

const postData = JSON.stringify({
    name: 'TestAPI',
    icon: '🧪',
    color: '#000000'
});

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/categories',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log('1. Creating category...');
const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Create Response:', data);
        const category = JSON.parse(data);

        if (category.id) {
            console.log(`\n2. Deleting category ${category.id}...`);
            const delOptions = {
                hostname: 'localhost',
                port: 3001,
                path: `/api/categories/${category.id}`,
                method: 'DELETE'
            };

            const delReq = http.request(delOptions, (delRes) => {
                let delData = '';
                delRes.on('data', (chunk) => { delData += chunk; });
                delRes.on('end', () => {
                    console.log('Delete Response:', delData);
                });
            });
            delReq.end();
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();
