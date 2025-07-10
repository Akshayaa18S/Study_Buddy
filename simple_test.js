// Simple file upload test
const http = require('http');
const fs = require('fs');
const FormData = require('form-data');

const form = new FormData();
form.append('file', fs.createReadStream('test_updated_file.txt'));

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/files/upload',
  method: 'POST',
  headers: form.getHeaders()
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

form.pipe(req);
