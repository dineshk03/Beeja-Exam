import dotenv from 'dotenv';
import { sendEmail, testEmailConfig } from '../server/utils/emailService.js';

// Load environment variables
dotenv.config();

console.log('🧪 Testing Email Configuration...\n');

// Test email configuration
console.log('📧 Email Settings:');
console.log('   SMTP Host:', process.env.SMTP_HOST);
console.log('   SMTP Port:', process.env.SMTP_PORT);
console.log('   SMTP User:', process.env.SMTP_USER);
console.log('   SMTP Pass:', process.env.SMTP_PASS ? '***configured***' : '❌ NOT SET');
console.log('   From Name:', process.env.SMTP_FROM_NAME);
console.log('');

// Test SMTP connection
console.log('🔌 Testing SMTP Connection...');
const isValid = await testEmailConfig();

if (!isValid) {
    console.log('\n❌ Email configuration test failed!');
    console.log('Please check your SMTP credentials and try again.');
    process.exit(1);
}

console.log('✅ SMTP connection successful!\n');

// Send test email
console.log('📨 Sending test email...');
const testEmail = process.env.SMTP_USER; // Send to yourself

const result = await sendEmail(
    testEmail,
    'welcome',
    'Test User'
);

if (result.success) {
    console.log('✅ Test email sent successfully!');
    console.log('   Message ID:', result.messageId);
    console.log('   Recipient:', testEmail);
    console.log('\n📬 Check your inbox for the welcome email!');
} else {
    console.log('❌ Failed to send test email');
    console.log('   Error:', result.error);
}

console.log('\n✅ Email configuration test complete!');
