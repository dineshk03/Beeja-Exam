// Run this script to fix exam settings
// Usage: node fix-exam-settings.js

import mongoose from 'mongoose';

// Try different database names
const dbNames = ['exam-module', 'exam_system', 'test', 'exam', 'exams'];

for (const dbName of dbNames) {
  console.log(`\n🔍 Trying database: ${dbName}`);
  
  try {
    await mongoose.connect(`mongodb://localhost:27017/${dbName}`);
    
    const exams = await mongoose.connection.db.collection('exams').find({}).toArray();
    
    if (exams.length > 0) {
      console.log(`✅ Found ${exams.length} exams in database: ${dbName}`);
      
      // List all exams
      console.log('\n📋 Exams found:');
      exams.forEach(exam => {
        console.log(`  - ${exam.title} (enableWebcam: ${exam.enableWebcam}, enableMicrophone: ${exam.enableMicrophone})`);
      });
      
      // Update ALL exams
      const result = await mongoose.connection.db.collection('exams').updateMany(
        {},
        { 
          $set: { 
            enableWebcam: false,
            enableMicrophone: false,
            requirePhotoCapture: false,
            showCalculator: false,
            showReviewScreen: false
          }
        }
      );
      
      console.log(`\n✅ Updated ${result.modifiedCount} exams`);
      
      // Show updated exams
      const updatedExams = await mongoose.connection.db.collection('exams').find({}).toArray();
      console.log('\n📝 Updated exam settings:');
      updatedExams.forEach(exam => {
        console.log(`  - ${exam.title}:`);
        console.log(`    enableWebcam: ${exam.enableWebcam}`);
        console.log(`    enableMicrophone: ${exam.enableMicrophone}`);
        console.log(`    requirePhotoCapture: ${exam.requirePhotoCapture}`);
      });
      
      await mongoose.disconnect();
      console.log('\n✅ Done! Restart your server now.');
      process.exit(0);
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.log(`❌ Error with ${dbName}: ${error.message}`);
    await mongoose.disconnect();
  }
}

console.log('\n❌ Could not find any exams in any database!');
process.exit(1);
