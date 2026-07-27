import dotenv from 'dotenv';
import nodemailerModule from 'nodemailer';
import { sendEmail } from '../server/utils/emailService.js';

dotenv.config();

const nodemailer = nodemailerModule.default || nodemailerModule;

console.log('🧪 Testing All Email Templates\n');
console.log('='.repeat(60));

const testEmail = process.env.SMTP_USER || 'info@beejaacademy.com';

// Test all 8 templates
const tests = [
    {
        name: '1. Welcome Email',
        template: 'welcome',
        data: 'Test User',
    },
    {
        name: '2. Exam Assigned',
        template: 'examAssigned',
        data: ['Test User', 'JavaScript Fundamentals', {
            duration: 60,
            passingScore: 70,
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }],
    },
    {
        name: '3. Exam Reminder',
        template: 'examReminder',
        data: ['Test User', 'JavaScript Fundamentals', 24],
    },
    {
        name: '4. Exam Completed (Passed)',
        template: 'examCompleted',
        data: ['Test User', 'JavaScript Fundamentals', 85, true],
    },
    {
        name: '5. Exam Completed (Failed)',
        template: 'examCompleted',
        data: ['Test User', 'JavaScript Fundamentals', 45, false],
    },
    {
        name: '6. Certificate Generated',
        template: 'certificateGenerated',
        data: ['Test User', 'JavaScript Fundamentals', 'https://example.com/cert/123'],
    },
    {
        name: '7. Password Reset',
        template: 'passwordReset',
        data: ['Test User', 'reset-token-abc123'],
    },
    {
        name: '8. Account Activated',
        template: 'accountActivated',
        data: 'Test User',
    },
    {
        name: '9. Account Deactivated',
        template: 'accountDeactivated',
        data: ['Test User', 'Policy violation'],
    },
];

console.log(`Testing ${tests.length} email templates...\n`);
console.log(`Recipient: ${testEmail}\n`);
console.log('='.repeat(60));

let successCount = 0;
let failCount = 0;

for (const test of tests) {
    try {
        console.log(`\n📧 ${test.name}`);
        console.log(`   Template: ${test.template}`);

        const result = await sendEmail(testEmail, test.template, test.data);

        if (result.success) {
            console.log(`   ✅ SUCCESS - Message ID: ${result.messageId}`);
            successCount++;
        } else {
            console.log(`   ❌ FAILED - ${result.error || result.message}`);
            failCount++;
        }

        // Small delay between emails
        await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
        console.log(`   ❌ ERROR - ${error.message}`);
        failCount++;
    }
}

console.log('\n' + '='.repeat(60));
console.log('\n📊 Test Results:');
console.log(`   ✅ Successful: ${successCount}/${tests.length}`);
console.log(`   ❌ Failed: ${failCount}/${tests.length}`);

if (successCount === tests.length) {
    console.log('\n🎉 All email templates are working perfectly!');
    console.log(`📬 Check your inbox at: ${testEmail}`);
} else {
    console.log('\n⚠️  Some templates failed. Check the errors above.');
}

console.log('\n' + '='.repeat(60));
