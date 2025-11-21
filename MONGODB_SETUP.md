# MongoDB Setup Guide

## Prerequisites

1. **Install MongoDB**
   - Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
   - Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

## Local MongoDB Setup

### Windows

1. **Install MongoDB**
   - Download and run the MongoDB installer
   - Choose "Complete" installation
   - Install MongoDB as a service (recommended)

2. **Verify Installation**
   ```powershell
   mongod --version
   ```

3. **Start MongoDB Service**
   ```powershell
   net start MongoDB
   ```

### MongoDB Atlas (Cloud) Setup

1. **Create Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for a free account

2. **Create Cluster**
   - Click "Build a Database"
   - Choose "Free" tier (M0)
   - Select your preferred region
   - Click "Create Cluster"

3. **Setup Database Access**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Create username and password
   - Set permissions to "Read and write to any database"

4. **Setup Network Access**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Or add your specific IP address

5. **Get Connection String**
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

## Application Configuration

### 1. Update .env File

Create or update the `.env` file in the root directory:

```env
PORT=5000
JWT_SECRET=your-secret-key-change-this-in-production
NODE_ENV=development

# For Local MongoDB
MONGODB_URI=mongodb://localhost:27017/exam-module

# OR For MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/exam-module?retryWrites=true&w=majority
```

**Important:** Replace the connection string values:
- `username`: Your MongoDB Atlas username
- `password`: Your MongoDB Atlas password
- `cluster0.xxxxx`: Your actual cluster address

### 2. Install Dependencies

Make sure mongoose is installed:

```bash
npm install
```

### 3. Start the Application

```bash
npm run dev
```

## Database Structure

The application uses the following MongoDB collections:

### 1. **users**
- Stores user accounts (students and admins)
- Fields: name, email, password (hashed), role, assignedExams, isActive
- Default admin created automatically on first run

### 2. **questions**
- Stores all question bank questions
- Supports 5 question types: multiple-choice, single-choice, short-answer, match-following, code-test
- Fields: type, question, options, correctAnswer, points, category, difficulty

### 3. **exams**
- Stores exam configurations
- Fields: title, description, duration, passingScore, questions (refs), assignedStudents (refs)
- Can be assigned to specific students or available to all

### 4. **examsessions**
- Stores student exam attempts
- Fields: exam (ref), student (ref), answers, score, percentage, status
- Tracks in-progress and completed exams

### 5. **activitylogs**
- Audit trail for all system activities
- Fields: user (ref), action, entity, entityId, details, timestamp
- Logs: login, exam start/submit, question create/update, student assignments

## Features Using MongoDB

### ✅ Implemented Features

1. **User Management**
   - Registration and authentication
   - Role-based access (admin/student)
   - Password hashing with bcrypt
   - Account activation/deactivation

2. **Question Bank**
   - Create, read, update, delete questions
   - 5 question types support
   - Category and difficulty management
   - Soft delete (isActive flag)

3. **Exam Management**
   - Create and configure exams
   - Add/remove questions from exams
   - Activate/deactivate exams
   - Set passing scores and duration

4. **Student Management**
   - View all students
   - View student details and exam history
   - Activate/deactivate student accounts
   - Track student performance

5. **Exam Assignment**
   - Assign specific students to exams
   - Bulk assign multiple students
   - Unassign students from exams
   - View assigned exams per student

6. **Exam Sessions**
   - Track exam attempts
   - Save answers in real-time
   - Calculate scores automatically
   - Store exam results

7. **Activity Logging**
   - Log all user actions
   - Track exam submissions
   - Monitor question management
   - Audit student assignments

## Verification Steps

### 1. Check MongoDB Connection

After starting the application, you should see:
```
✅ MongoDB Connected: localhost (or your Atlas cluster)
✅ Default admin created: admin@exam.com / admin123
Server running on port 5000
```

### 2. Test Database Operations

1. **Login as Admin**
   - Email: admin@exam.com
   - Password: admin123

2. **Create a Question**
   - Go to Question Bank
   - Click "Add Question"
   - Fill in details and save
   - Check MongoDB to verify it's saved

3. **Register a Student**
   - Logout from admin
   - Register a new student account
   - Login as admin again
   - Go to Students page to see the new student

4. **Create and Assign Exam**
   - Create an exam in Exam Management
   - Add questions to the exam
   - Go to Students
   - Click on a student
   - Assign the exam to the student

## MongoDB Compass (GUI Tool)

For easier database management, use MongoDB Compass:

1. **Download**: https://www.mongodb.com/products/compass
2. **Connect**: Use your MongoDB URI
3. **Browse Collections**: View and edit data visually

## Troubleshooting

### Connection Issues

**Error: "MongooseServerSelectionError"**
- Check if MongoDB service is running
- Verify connection string in .env
- Check network access (for Atlas)
- Ensure firewall allows MongoDB port (27017)

**Error: "Authentication failed"**
- Verify username and password in connection string
- Check database user permissions in Atlas
- Ensure password doesn't contain special characters (URL encode if needed)

### Data Issues

**Admin not created**
- Check console logs for errors
- Verify MongoDB connection is successful
- Check if admin already exists in database

**Questions/Exams not appearing**
- Check `isActive` field (should be true)
- Verify user is logged in as admin
- Check browser console for API errors

## Migration from In-Memory Storage

If you had data in the old in-memory system:

1. **Data is not migrated automatically**
2. **You need to recreate**:
   - Questions in Question Bank
   - Exams in Exam Management
   - Student accounts (they can register)

## Production Deployment

### Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT_SECRET
- [ ] Enable MongoDB authentication
- [ ] Use MongoDB Atlas with IP whitelist
- [ ] Enable SSL/TLS for MongoDB connection
- [ ] Set NODE_ENV=production
- [ ] Use environment variables for sensitive data
- [ ] Enable rate limiting
- [ ] Implement backup strategy

### MongoDB Atlas Production Settings

1. **Upgrade Tier**: Consider paid tier for production
2. **Backups**: Enable automated backups
3. **Monitoring**: Set up alerts
4. **IP Whitelist**: Restrict to production server IPs
5. **Connection Pooling**: Configure for your load

## Backup and Restore

### Backup

```bash
# Local MongoDB
mongodump --db exam-module --out ./backup

# MongoDB Atlas
# Use Atlas UI → Clusters → Backup
```

### Restore

```bash
# Local MongoDB
mongorestore --db exam-module ./backup/exam-module

# MongoDB Atlas
# Use Atlas UI → Clusters → Restore
```

## Performance Tips

1. **Indexes**: Already created on frequently queried fields
2. **Populate Wisely**: Only populate needed fields
3. **Pagination**: Implement for large datasets
4. **Caching**: Consider Redis for frequently accessed data
5. **Connection Pooling**: Mongoose handles this automatically

## Support

If you encounter issues:

1. Check MongoDB logs
2. Check application console logs
3. Verify .env configuration
4. Test MongoDB connection separately
5. Check MongoDB Atlas dashboard (if using Atlas)

## Next Steps

After successful setup:

1. Login as admin
2. Create questions in Question Bank
3. Create exams
4. Register student accounts
5. Assign exams to students
6. Students can take exams
7. View results and analytics
