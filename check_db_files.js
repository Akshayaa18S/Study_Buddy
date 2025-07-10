// Check database file storage
require('dotenv').config({ path: './server/.env' });
const { FileAnalysis } = require('./server/models');

async function checkDatabaseFiles() {
  try {
    console.log('🔍 Checking Database File Storage...\n');
    
    const totalFiles = await FileAnalysis.count();
    console.log(`Total files in database: ${totalFiles}`);
    
    if (totalFiles > 0) {
      const recentFiles = await FileAnalysis.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'fileName', 'userId', 'fileSize', 'fileType', 'createdAt']
      });
      
      console.log('\n📁 Recent files in database:');
      recentFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file.fileName} (${file.fileSize} bytes)`);
        console.log(`   User ID: ${file.userId || 'No User'}`);
        console.log(`   Type: ${file.fileType}`);
        console.log(`   Created: ${file.createdAt}`);
        console.log('');
      });
    } else {
      console.log('No files found in database.');
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
}

checkDatabaseFiles();
