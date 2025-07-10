const { User, Quiz, QuizResult, sequelize } = require('./server/models');

async function checkDatabase() {
  try {
    console.log('🔍 Checking database directly...\n');

    // Check if Akshayaa_S user exists
    const user = await User.findOne({
      where: { email: 'abc@gmail.com' }
    });

    if (!user) {
      console.log('❌ User not found in database');
      return;
    }

    console.log(`✅ User found: ${user.username} (ID: ${user.id})`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`📊 Study Stats: ${JSON.stringify(user.studyStats, null, 2)}\n`);

    // Check for quizzes created by this user
    const quizzes = await Quiz.findAll({
      where: { userId: user.id }
    });

    console.log(`📋 Quizzes created by user: ${quizzes.length}`);
    if (quizzes.length > 0) {
      quizzes.forEach((quiz, index) => {
        console.log(`   ${index + 1}. ${quiz.title} (ID: ${quiz.id}) - ${quiz.topic}`);
      });
    }

    // Check for quiz results by this user
    const quizResults = await QuizResult.findAll({
      where: { userId: user.id },
      include: [{ model: Quiz, as: 'quiz', required: false }]
    });

    console.log(`\n📊 Quiz results by user: ${quizResults.length}`);
    if (quizResults.length > 0) {
      quizResults.forEach((result, index) => {
        console.log(`   ${index + 1}. Quiz: ${result.quiz?.title || result.quizId} - Score: ${result.score}%`);
        console.log(`      Completed: ${result.createdAt}`);
      });
    }

    // Check total counts in database
    const totalUsers = await User.count();
    const totalQuizzes = await Quiz.count();
    const totalResults = await QuizResult.count();

    console.log(`\n🗄️ Database Summary:`);
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Total Quizzes: ${totalQuizzes}`);
    console.log(`   Total Quiz Results: ${totalResults}`);

    // Check if there are any quiz results at all
    if (totalResults > 0) {
      console.log('\n📊 All quiz results in database:');
      const allResults = await QuizResult.findAll({
        include: [{ model: User, as: 'user' }, { model: Quiz, as: 'quiz', required: false }]
      });
      allResults.forEach((result, index) => {
        console.log(`   ${index + 1}. User: ${result.user?.username || 'Unknown'} - Score: ${result.score}%`);
      });
    }

  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await sequelize.close();
  }
}

checkDatabase();
