import nodemailerModule from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const nodemailer = nodemailerModule.default || nodemailerModule;

// Create reusable transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

// Modern, interactive email templates with beautiful design
const emailTemplates = {
    welcome: (name) => ({
        subject: '🎉 Welcome to Beeja Academy - Your Learning Journey Begins!',
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Beeja Academy</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #5b7cfa 0%, #4a5fd6 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                🎓 Welcome to Beeja Academy!
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <div style="display: inline-block; background: linear-gradient(135deg, #5b7cfa 0%, #4a5fd6 100%); width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                                    <span style="font-size: 40px;">✨</span>
                                </div>
                            </div>
                            
                            <h2 style="color: #1a202c; font-size: 24px; margin: 0 0 20px 0; text-align: center;">
                                Hi ${name}! 👋
                            </h2>
                            
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Congratulations! Your account has been successfully created. You're now part of the <strong>Beeja Academy</strong> community, where excellence meets opportunity.
                            </p>
                            
                            <div style="background: linear-gradient(135deg, #f6f8fb 0%, #e9ecf2 100%); border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid #e2e8f0;">
                                <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px;">🚀 What's Next?</h3>
                                <ul style="color: #4a5568; margin: 0; padding-left: 20px; line-height: 1.8;">
                                    <li>Access your personalized dashboard</li>
                                    <li>Browse available exams and courses</li>
                                    <li>Track your progress and achievements</li>
                                    <li>Earn certificates upon completion</li>
                                </ul>
                            </div>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
                                   style="display: inline-block; background: linear-gradient(135deg, #5b7cfa 0%, #4a5fd6 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(91, 124, 250, 0.3);">
                                    🎯 Get Started Now
                                </a>
                            </div>
                            
                            <div style="background: #f7fafc; border-left: 4px solid #5b7cfa; padding: 20px; border-radius: 8px; margin: 30px 0;">
                                <p style="color: #4a5568; margin: 0; font-size: 14px; line-height: 1.6;">
                                    <strong>💡 Pro Tip:</strong> Complete your profile to unlock all features and get personalized exam recommendations!
                                </p>
                            </div>
                            
                            <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                                Need help? Our support team is here for you 24/7. Just reply to this email!
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="color: #718096; font-size: 14px; margin: 0 0 10px 0;">
                                Best regards,<br>
                                <strong style="color: #5b7cfa;">The Beeja Academy Team</strong>
                            </p>
                            <p style="color: #a0aec0; font-size: 12px; margin: 10px 0 0 0;">
                                © 2026 Beeja Academy. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `,
    }),

    examAssigned: (name, examTitle, examDetails) => ({
        subject: `📝 New Exam Assigned: ${examTitle}`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">
                                📝 New Exam Assigned!
                            </h1>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #1a202c; font-size: 24px; margin: 0 0 20px 0;">
                                Hi ${name}! 👋
                            </h2>
                            
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                Great news! A new exam has been assigned to you. Time to showcase your skills!
                            </p>
                            
                            <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); border-radius: 20px; padding: 30px; margin: 30px 0; box-shadow: 0 10px 30px rgba(250, 112, 154, 0.3);">
                                <h3 style="color: white; margin: 0 0 20px 0; font-size: 24px; text-align: center;">
                                    ${examTitle}
                                </h3>
                                
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="padding: 12px 0;">
                                            <div style="background: rgba(255,255,255,0.2); border-radius: 10px; padding: 15px; backdrop-filter: blur(10px);">
                                                <span style="color: white; font-size: 14px; display: block; margin-bottom: 5px;">⏱️ Duration</span>
                                                <span style="color: white; font-size: 20px; font-weight: 700;">${examDetails.duration} minutes</span>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 0;">
                                            <div style="background: rgba(255,255,255,0.2); border-radius: 10px; padding: 15px;">
                                                <span style="color: white; font-size: 14px; display: block; margin-bottom: 5px;">🎯 Passing Score</span>
                                                <span style="color: white; font-size: 20px; font-weight: 700;">${examDetails.passingScore}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                    ${examDetails.startDate ? `
                                    <tr>
                                        <td style="padding: 12px 0;">
                                            <div style="background: rgba(255,255,255,0.2); border-radius: 10px; padding: 15px;">
                                                <span style="color: white; font-size: 14px; display: block; margin-bottom: 5px;">📅 Start Date</span>
                                                <span style="color: white; font-size: 18px; font-weight: 600;">${new Date(examDetails.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                            </div>
                                        </td>
                                    </tr>
                                    ` : ''}
                                    ${examDetails.endDate ? `
                                    <tr>
                                        <td style="padding: 12px 0;">
                                            <div style="background: rgba(255,255,255,0.2); border-radius: 10px; padding: 15px;">
                                                <span style="color: white; font-size: 14px; display: block; margin-bottom: 5px;">⏰ End Date</span>
                                                <span style="color: white; font-size: 18px; font-weight: 600;">${new Date(examDetails.endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                            </div>
                                        </td>
                                    </tr>
                                    ` : ''}
                                </table>
                            </div>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
                                   style="display: inline-block; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 18px 50px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 18px; box-shadow: 0 8px 20px rgba(79, 172, 254, 0.4);">
                                    🚀 Start Exam
                                </a>
                            </div>
                            
                            <div style="background: #fff5f5; border-left: 4px solid #fc8181; padding: 20px; border-radius: 8px; margin: 30px 0;">
                                <p style="color: #742a2a; margin: 0; font-size: 14px; line-height: 1.6;">
                                    <strong>⚠️ Important:</strong> Make sure you have a stable internet connection and enough time before starting the exam. Once started, the timer cannot be paused!
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="background: #f7fafc; padding: 30px; text-align: center;">
                            <p style="color: #718096; font-size: 14px; margin: 0 0 10px 0;">
                                Good luck! 🍀<br>
                                <strong style="color: #4facfe;">The Beeja Academy Team</strong>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `,
    }),

    examReminder: (name, examTitle, hoursRemaining) => ({
        subject: `⏰ Reminder: ${examTitle} - ${hoursRemaining} hours left!`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 30px; text-align: center;">
                            <div style="font-size: 60px; margin-bottom: 10px;">⏰</div>
                            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">
                                Time is Running Out!
                            </h1>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #1a202c; font-size: 24px; margin: 0 0 20px 0;">
                                Hi ${name}! 👋
                            </h2>
                            
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                This is a friendly reminder that your exam <strong>${examTitle}</strong> is due soon!
                            </p>
                            
                            <div style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); border-radius: 20px; padding: 40px; text-align: center; margin: 30px 0;">
                                <div style="font-size: 48px; font-weight: 700; color: white; margin-bottom: 10px;">
                                    ${hoursRemaining}
                                </div>
                                <div style="font-size: 24px; color: white; font-weight: 600;">
                                    Hours Remaining
                                </div>
                            </div>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
                                   style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 18px 50px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 18px; box-shadow: 0 8px 20px rgba(240, 147, 251, 0.4); animation: pulse 2s infinite;">
                                    📝 Take Exam Now
                                </a>
                            </div>
                            
                            <div style="background: #fffaf0; border-left: 4px solid #ed8936; padding: 20px; border-radius: 8px; margin: 30px 0;">
                                <p style="color: #7c2d12; margin: 0; font-size: 14px; line-height: 1.6;">
                                    <strong>⚡ Don't wait!</strong> Complete your exam before the deadline to ensure your submission is counted.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="background: #f7fafc; padding: 30px; text-align: center;">
                            <p style="color: #718096; font-size: 14px; margin: 0;">
                                <strong style="color: #f093fb;">The Beeja Academy Team</strong>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `,
    }),

    examCompleted: (name, examTitle, score, passed) => ({
        subject: `${passed ? '🎉 Congratulations!' : '📊 Results Ready'} - ${examTitle}`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                    <tr>
                        <td style="background: ${passed ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}; padding: 40px 30px; text-align: center;">
                            <div style="font-size: 80px; margin-bottom: 10px;">${passed ? '🎉' : '📊'}</div>
                            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                ${passed ? 'Congratulations!' : 'Exam Completed'}
                            </h1>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #1a202c; font-size: 24px; margin: 0 0 20px 0;">
                                Hi ${name}! 👋
                            </h2>
                            
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                You have successfully completed the exam: <strong>${examTitle}</strong>
                            </p>
                            
                            <div style="background: ${passed ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'}; border-radius: 16px; padding: 40px; text-align: center; margin: 30px 0; border: 2px solid ${passed ? '#10b981' : '#ef4444'};">
                                <div style="color: ${passed ? '#065f46' : '#991b1b'}; font-size: 18px; margin-bottom: 15px; font-weight: 600;">
                                    Your Score
                                </div>
                                <div style="font-size: 72px; font-weight: 700; color: ${passed ? '#10b981' : '#ef4444'}; margin: 20px 0;">
                                    ${score}%
                                </div>
                                <div style="background: ${passed ? '#10b981' : '#ef4444'}; border-radius: 8px; padding: 15px 30px; display: inline-block; margin-top: 20px;">
                                    <span style="color: white; font-size: 24px; font-weight: 700;">
                                        ${passed ? '✅ PASSED' : '❌ NOT PASSED'}
                                    </span>
                                </div>
                            </div>
                            
                            ${passed ? `
                            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center; border: 1px solid #fbbf24;">
                                <div style="font-size: 40px; margin-bottom: 10px;">🏆</div>
                                <h3 style="color: #78350f; margin: 0 0 10px 0; font-size: 20px;">Outstanding Performance!</h3>
                                <p style="color: #92400e; margin: 0; font-size: 14px;">
                                    You've demonstrated excellent knowledge and skills. Keep up the great work!
                                </p>
                            </div>
                            ` : `
                            <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px; margin: 30px 0;">
                                <p style="color: #991b1b; margin: 0; font-size: 14px; line-height: 1.6;">
                                    <strong>💪 Don't give up!</strong> Review the material and try again. Every attempt is a learning opportunity!
                                </p>
                            </div>
                            `}
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-results" 
                                   style="display: inline-block; background: ${passed ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px ${passed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'};">
                                    📈 View Detailed Results
                                </a>
                            </div>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="background: #f7fafc; padding: 30px; text-align: center;">
                            <p style="color: #718096; font-size: 14px; margin: 0;">
                                ${passed ? 'Congratulations once again! 🎊' : 'Keep learning and improving! 📚'}<br>
                                <strong style="color: ${passed ? '#10b981' : '#ef4444'};">The Beeja Academy Team</strong>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `,
    }),

    certificateGenerated: (name, examTitle, certificateUrl) => ({
        subject: '🏆 Your Certificate is Ready!',
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%);">
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%); padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%); padding: 50px 30px; text-align: center;">
                            <div style="font-size: 100px; margin-bottom: 15px; animation: bounce 2s infinite;">🏆</div>
                            <h1 style="color: white; margin: 0; font-size: 36px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                                Certificate Generated!
                            </h1>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #1a202c; font-size: 28px; margin: 0 0 20px 0; text-align: center;">
                                Congratulations, ${name}! 🎉
                            </h2>
                            
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0; text-align: center;">
                                Your hard work has paid off! Your certificate for <strong>${examTitle}</strong> is now ready to download.
                            </p>
                            
                            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; padding: 40px; margin: 30px 0; text-align: center;">
                                <div style="background: rgba(255,255,255,0.2); border-radius: 15px; padding: 30px; backdrop-filter: blur(10px);">
                                    <div style="font-size: 50px; margin-bottom: 15px;">📜</div>
                                    <h3 style="color: white; margin: 0 0 10px 0; font-size: 22px;">
                                        ${examTitle}
                                    </h3>
                                    <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 14px;">
                                        Certificate of Completion
                                    </p>
                                </div>
                            </div>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${certificateUrl}" 
                                   style="display: inline-block; background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%); color: white; padding: 20px 60px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 18px; box-shadow: 0 8px 20px rgba(255, 216, 155, 0.4);">
                                    📥 Download Certificate
                                </a>
                            </div>
                            
                            <div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); border-radius: 15px; padding: 25px; margin: 30px 0; text-align: center;">
                                <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px;">✨ Share Your Achievement!</h3>
                                <p style="color: #4a5568; margin: 0; font-size: 14px; line-height: 1.6;">
                                    Show off your accomplishment on LinkedIn, add it to your resume, or share it with friends and family!
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="background: #f7fafc; padding: 30px; text-align: center;">
                            <p style="color: #718096; font-size: 14px; margin: 0;">
                                We're proud of your achievement! 🌟<br>
                                <strong style="color: #ffd89b;">The Beeja Academy Team</strong>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `,
    }),

    passwordReset: (name, resetToken) => ({
        subject: '🔐 Password Reset Request - Beeja Academy',
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <div style="font-size: 70px; margin-bottom: 10px;">🔐</div>
                            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">
                                Password Reset Request
                            </h1>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #1a202c; font-size: 24px; margin: 0 0 20px 0;">
                                Hi ${name}! 👋
                            </h2>
                            
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                We received a request to reset your password. Click the button below to create a new password:
                            </p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}" 
                                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 18px 50px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 18px; box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);">
                                    🔑 Reset Password
                                </a>
                            </div>
                            
                            <div style="background: #fffaf0; border-left: 4px solid #ed8936; padding: 20px; border-radius: 8px; margin: 30px 0;">
                                <p style="color: #7c2d12; margin: 0; font-size: 14px; line-height: 1.6;">
                                    <strong>⏰ Important:</strong> This link will expire in 1 hour for security reasons.
                                </p>
                            </div>
                            
                            <div style="background: #f7fafc; border-radius: 10px; padding: 20px; margin: 30px 0;">
                                <p style="color: #718096; margin: 0; font-size: 14px; line-height: 1.6;">
                                    <strong>Didn't request this?</strong><br>
                                    If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="background: #f7fafc; padding: 30px; text-align: center;">
                            <p style="color: #718096; font-size: 14px; margin: 0;">
                                Stay secure! 🔒<br>
                                <strong style="color: #667eea;">The Beeja Academy Team</strong>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `,
    }),

    accountActivated: (name) => ({
        subject: '✅ Your Account Has Been Activated!',
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);">
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 40px 30px; text-align: center;">
                            <div style="font-size: 80px; margin-bottom: 10px;">✅</div>
                            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">
                                Account Activated!
                            </h1>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #1a202c; font-size: 24px; margin: 0 0 20px 0;">
                                Great News, ${name}! 🎉
                            </h2>
                            
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                Your account has been activated by an administrator. You now have full access to the Beeja Academy exam portal!
                            </p>
                            
                            <div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); border-radius: 15px; padding: 30px; margin: 30px 0;">
                                <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px;">🚀 You Can Now:</h3>
                                <ul style="color: #4a5568; margin: 0; padding-left: 20px; line-height: 2;">
                                    <li>Access all assigned exams</li>
                                    <li>View your progress and results</li>
                                    <li>Download certificates</li>
                                    <li>Update your profile</li>
                                </ul>
                            </div>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
                                   style="display: inline-block; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 18px 50px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 18px; box-shadow: 0 8px 20px rgba(17, 153, 142, 0.4);">
                                    🔓 Log In Now
                                </a>
                            </div>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="background: #f7fafc; padding: 30px; text-align: center;">
                            <p style="color: #718096; font-size: 14px; margin: 0;">
                                Welcome back! 🌟<br>
                                <strong style="color: #11998e;">The Beeja Academy Team</strong>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `,
    }),

    accountDeactivated: (name, reason) => ({
        subject: '⚠️ Account Deactivated - Beeja Academy',
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%);">
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%); padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%); padding: 40px 30px; text-align: center;">
                            <div style="font-size: 70px; margin-bottom: 10px;">⚠️</div>
                            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">
                                Account Deactivated
                            </h1>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #1a202c; font-size: 24px; margin: 0 0 20px 0;">
                                Hi ${name},
                            </h2>
                            
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                We're writing to inform you that your account has been deactivated.
                            </p>
                            
                            ${reason ? `
                            <div style="background: #fff5f5; border-left: 4px solid #fc8181; padding: 20px; border-radius: 8px; margin: 30px 0;">
                                <p style="color: #742a2a; margin: 0; font-size: 14px; line-height: 1.6;">
                                    <strong>Reason:</strong> ${reason}
                                </p>
                            </div>
                            ` : ''}
                            
                            <div style="background: #f7fafc; border-radius: 10px; padding: 25px; margin: 30px 0;">
                                <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px;">📞 Need Help?</h3>
                                <p style="color: #4a5568; margin: 0; font-size: 14px; line-height: 1.6;">
                                    If you believe this is an error or would like to discuss this decision, please contact our support team. We're here to help!
                                </p>
                            </div>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="mailto:info@beejaacademy.com" 
                                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                                    📧 Contact Support
                                </a>
                            </div>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="background: #f7fafc; padding: 30px; text-align: center;">
                            <p style="color: #718096; font-size: 14px; margin: 0;">
                                <strong style="color: #ee0979;">The Beeja Academy Team</strong>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `,
    }),
};

// Send email function
export const sendEmail = async (to, templateName, templateData) => {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn('Email credentials not configured. Email not sent.');
            return { success: false, message: 'Email not configured' };
        }

        const transporter = createTransporter();
        const template = emailTemplates[templateName];

        if (!template) {
            throw new Error(`Email template '${templateName}' not found`);
        }

        const { subject, html } = typeof template === 'function'
            ? template(...(Array.isArray(templateData) ? templateData : [templateData]))
            : template;

        const mailOptions = {
            from: `"${process.env.SMTP_FROM_NAME || 'Exam Portal'}" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);

        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};

// Bulk email function
export const sendBulkEmail = async (recipients, templateName, templateData) => {
    const results = [];

    for (const recipient of recipients) {
        const result = await sendEmail(recipient.email, templateName,
            typeof templateData === 'function' ? templateData(recipient) : templateData
        );
        results.push({ email: recipient.email, ...result });
    }

    return results;
};

// Test email configuration
export const testEmailConfig = async () => {
    try {
        const transporter = createTransporter();
        await transporter.verify();
        console.log('✅ Email configuration is valid');
        return true;
    } catch (error) {
        console.error('❌ Email configuration error:', error.message);
        return false;
    }
};

export default {
    sendEmail,
    sendBulkEmail,
    testEmailConfig,
    emailTemplates,
};
