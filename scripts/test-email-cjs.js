import { createRequire } from 'module';
import dotenv from 'dotenv';

const require = createRequire(import.meta.url);
const nodemailer = require('nodemailer');

// Load environment variables
dotenv.config();

(async () => {
    console.log('🧪 Email Test - Using CommonJS Import\n');

    console.log('Environment Variables:');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_PORT:', process.env.SMTP_PORT);
    console.log('SMTP_USER:', process.env.SMTP_USER);
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT SET');
    console.log('');

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('❌ SMTP credentials not configured!');
        console.log('Please check your .env file');
        process.exit(1);
    }

    console.log('Creating transporter...');
    const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    console.log('Testing connection...');
    try {
        await transporter.verify();
        console.log('✅ SMTP connection successful!');

        console.log('\nSending test email...');
        const info = await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || 'Exam Portal'}" <${process.env.SMTP_USER}>`,
            to: process.env.SMTP_USER,
            subject: '✅ Email Test Successful!',
            html: `
        <h2>Email Configuration Test</h2>
        <p>Congratulations! Your email system is working correctly.</p>
        <p><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</p>
        <p><strong>From:</strong> ${process.env.SMTP_USER}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      `,
        });

        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('\n📬 Check your inbox at:', process.env.SMTP_USER);

    } catch (error) {
        console.log('❌ Error:', error.message);
        if (error.code === 'EAUTH') {
            console.log('\n⚠️  Authentication failed!');
            console.log('Please check:');
            console.log('1. SMTP_USER is correct');
            console.log('2. SMTP_PASS is the Gmail App Password (16 chars, no spaces)');
            console.log('3. 2-Factor Authentication is enabled on Gmail');
            console.log('4. App Password was generated correctly');
        }
        process.exit(1);
    }
})();
