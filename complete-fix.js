// Complete fix for exam system
import mongoose from 'mongoose';

await mongoose.connect('mongodb://localhost:27017/exam-module');
console.log('✅ Connected to MongoDB\n');

// 1. Fix all exams
console.log('📝 Fixing all exams...');
const examResult = await mongoose.connection.db.collection('exams').updateMany(
  {},
  { 
    $set: { 
      enableWebcam: false,
      enableMicrophone: false,
      requirePhotoCapture: false,
      showCalculator: false,
      showReviewScreen: false,
      isActive: true
    }
  }
);
console.log(`✅ Updated ${examResult.modifiedCount} exams\n`);

// 2. List all exams
const exams = await mongoose.connection.db.collection('exams').find({}).toArray();
console.log('📋 Current exams:');
exams.forEach(exam => {
  console.log(`  - ${exam.title} (ID: ${exam._id})`);
  console.log(`    enableWebcam: ${exam.enableWebcam}`);
  console.log(`    enableMicrophone: ${exam.enableMicrophone}`);
  console.log(`    isActive: ${exam.isActive}\n`);
});

// 3. List all schedules
const schedules = await mongoose.connection.db.collection('schedules').find({}).toArray();
console.log('📅 Current schedules:');
if (schedules.length === 0) {
  console.log('  ⚠️  NO SCHEDULES FOUND!');
  console.log('  This is why students cannot take exams!\n');
} else {
  schedules.forEach(schedule => {
    console.log(`  - Schedule ID: ${schedule._id}`);
    console.log(`    Exam: ${schedule.exam}`);
    console.log(`    Start: ${schedule.startDate}`);
    console.log(`    End: ${schedule.endDate}`);
    console.log(`    isOpenToAll: ${schedule.isOpenToAll}\n`);
  });
}

// 4. Create a schedule if none exists
if (schedules.length === 0) {
  console.log('🔧 Creating a default schedule...');
  
  const jsExam = exams.find(e => e.title === 'JS');
  if (jsExam) {
    const newSchedule = {
      exam: jsExam._id,
      startDate: new Date('2024-01-01'), // Past date so it's always available
      endDate: new Date('2026-12-31'),   // Future date
      duration: jsExam.duration || 60,
      isOpenToAll: true,
      assignedStudents: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await mongoose.connection.db.collection('schedules').insertOne(newSchedule);
    console.log('✅ Created schedule for JS exam\n');
  }
}

// 5. Final verification
console.log('🔍 Final check:');
const finalExams = await mongoose.connection.db.collection('exams').find({}).toArray();
const finalSchedules = await mongoose.connection.db.collection('schedules').find({}).toArray();

console.log(`  Exams: ${finalExams.length}`);
console.log(`  Schedules: ${finalSchedules.length}`);
console.log(`  JS exam settings:`);
const jsExam = finalExams.find(e => e.title === 'JS');
if (jsExam) {
  console.log(`    enableWebcam: ${jsExam.enableWebcam}`);
  console.log(`    enableMicrophone: ${jsExam.enableMicrophone}`);
  console.log(`    isActive: ${jsExam.isActive}`);
}

await mongoose.disconnect();
console.log('\n✅ Done! Restart your server and try again.');
