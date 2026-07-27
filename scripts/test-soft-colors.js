import dotenv from 'dotenv';
import { sendEmail } from '../server/utils/emailService.js';

dotenv.config();

console.log('📧 Testing Updated Email Templates with Soft Colors\n');

const testEmail = 'info@beejaacademy.com';

// Test Exam Completed - PASSED
console.log('1️⃣ Testing Exam Completed (PASSED) with soft green...');
await sendEmail(testEmail, 'examCompleted', [
    'Beeja',
    'JavaScript Fundamentals',
    85,
    true
]);

console.log('✅ Sent!\n');

// Wait 2 seconds
await new Promise(resolve => setTimeout(resolve, 2000));

// Test Exam Completed - FAILED
console.log('2️⃣ Testing Exam Completed (FAILED) with soft red...');
await sendEmail(testEmail, 'examCompleted', [
    'Beeja',
    'Advanced React',
    45,
    false
]);

console.log('✅ Sent!\n');

// Wait 2 seconds
await new Promise(resolve => setTimeout(resolve, 2000));

// Test Welcome Email
console.log('3️⃣ Testing Welcome Email with soft blue...');
await sendEmail(testEmail, 'welcome', 'Beeja');

console.log('✅ Sent!\n');

console.log('🎉 All test emails sent! Check your inbox at:', testEmail);
console.log('\n📊 Color Changes:');
console.log('   • Background: Harsh gradients → Soft #f5f7fa');
console.log('   • Pass: Bright green → Soft #10b981');
console.log('   • Fail: Harsh pink/orange → Soft #ef4444');
console.log('   • Welcome: Purple → Soft blue #5b7cfa');
