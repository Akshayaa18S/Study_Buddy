// Check file analysis count in database
const { FileAnalysis, User, StudyActivity } = require('./server/models');

async function checkFileAnalysisData() {
  try {
    console.log('🔍 Checking File Analysis Data...\n');
    
    // Check total file analyses
    const totalFiles = await FileAnalysis.count();
    console.log(`📊 Total File Analyses in Database: ${totalFiles}`);
    
    // Check recent file analyses
    const recentFiles = await FileAnalysis.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'fileName', 'userId', 'fileSize', 'fileType', 'createdAt']
    });
    
    console.log('\n📋 Recent File Analyses:');
    recentFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file.fileName} (User: ${file.userId || 'Guest'}) - ${file.createdAt}`);
    });
    
    // Check users and their file counts
    const users = await User.findAll({
      attributes: ['id', 'email', 'name']
    });
    
    console.log('\n👥 Users and their file counts:');
    for (const user of users) {
      const userFileCount = await FileAnalysis.count({ where: { userId: user.id } });
      console.log(`   ${user.name || user.email}: ${userFileCount} files`);
    }
    
    // Check study activities related to file uploads
    const fileActivities = await StudyActivity.findAll({
      where: { activityType: 'file_upload' },
      limit: 10,
      order: [['createdAt', 'DESC']],
      attributes: ['userId', 'details', 'points', 'createdAt']
    });
    
    console.log('\n📈 Recent File Upload Activities:');
    fileActivities.forEach((activity, index) => {
      const fileName = activity.details?.fileName || 'Unknown';
      console.log(`${index + 1}. User ${activity.userId}: ${fileName} (${activity.points} points) - ${activity.createdAt}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking file analysis data:', error);
  }
}

checkFileAnalysisData();
