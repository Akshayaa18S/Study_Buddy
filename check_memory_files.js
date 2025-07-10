// Check in-memory file storage
const { guestFileAnalyses } = require('./server/utils/fileStorage');

console.log('🔍 Checking In-Memory File Storage...\n');
console.log(`Total files in memory: ${guestFileAnalyses.size}`);

if (guestFileAnalyses.size > 0) {
  console.log('\n📁 Files in memory:');
  let index = 1;
  for (const [id, analysis] of guestFileAnalyses.entries()) {
    console.log(`${index}. ${analysis.fileName} (${analysis.fileSize} bytes)`);
    console.log(`   ID: ${id}`);
    console.log(`   User ID: ${analysis.userId || 'Guest'}`);
    console.log(`   Upload Date: ${analysis.uploadedAt}`);
    console.log(`   Analysis Preview: ${analysis.analysis?.substring(0, 100)}...`);
    console.log('');
    index++;
  }
} else {
  console.log('No files found in memory storage.');
}
