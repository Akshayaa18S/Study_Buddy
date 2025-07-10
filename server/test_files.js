const fs = require('fs');
const path = require('path');

// Test file processing
console.log('Testing file upload system...');

const uploadsDir = path.join(__dirname, 'uploads');
console.log('Uploads directory:', uploadsDir);
console.log('Directory exists:', fs.existsSync(uploadsDir));

if (fs.existsSync(uploadsDir)) {
  const files = fs.readdirSync(uploadsDir);
  console.log('Files in uploads:', files.length);
  
  if (files.length > 0) {
    const latestFile = files[files.length - 1];
    const filePath = path.join(uploadsDir, latestFile);
    const stats = fs.statSync(filePath);
    
    console.log('Latest file:', latestFile);
    console.log('File size:', stats.size, 'bytes');
    console.log('File created:', stats.birthtime);
    
    // Test MIME type detection
    const extension = path.extname(latestFile).toLowerCase();
    console.log('File extension:', extension);
    
    // Test text extraction simulation
    if (extension === '.txt') {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        console.log('Text content length:', content.length);
        console.log('First 100 chars:', content.substring(0, 100));
      } catch (error) {
        console.log('Cannot read as text:', error.message);
      }
    } else {
      console.log('Non-text file - would use placeholder or parser');
    }
  }
}

// Test file validation logic
const testFiles = [
  { name: 'test.pdf', mimetype: 'application/pdf' },
  { name: 'test.txt', mimetype: 'text/plain' },
  { name: 'test.docx', mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  { name: 'test.exe', mimetype: 'application/octet-stream' }
];

console.log('\nTesting file validation:');
testFiles.forEach(file => {
  const allowedExtensions = /jpeg|jpg|png|gif|pdf|txt|doc|docx/;
  const allowedMimeTypes = /image\/|application\/pdf|text\/plain|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document/;
  
  const extname = allowedExtensions.test(path.extname(file.name).toLowerCase());
  const mimetype = allowedMimeTypes.test(file.mimetype);
  
  console.log(`${file.name}: ext=${extname}, mime=${mimetype}, valid=${extname && mimetype}`);
});
