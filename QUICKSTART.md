# Quick Start Guide

## Getting Started in 4 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup MongoDB
**Option A: Local MongoDB**
- Install MongoDB from https://www.mongodb.com/try/download/community
- Start MongoDB service: `net start MongoDB` (Windows)

**Option B: MongoDB Atlas (Cloud)**
- Create free account at https://www.mongodb.com/cloud/atlas
- Create cluster and get connection string
- See [MONGODB_SETUP.md](./MONGODB_SETUP.md) for detailed steps

### 3. Create Environment File
Create a `.env` file in the root directory with:
```
PORT=5000
JWT_SECRET=your-secret-key-change-this-in-production
NODE_ENV=development

# For Local MongoDB
MONGODB_URI=mongodb://localhost:27017/exam-module

# OR For MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/exam-module
```

### 4. Start the Application
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- MongoDB: Connected automatically

## Login Credentials

### Admin Account (Pre-created)
- **Email**: admin@exam.com
- **Password**: admin123
- **Access**: Full admin panel with exam and question management

### Student Account
- Register a new account at http://localhost:3000/register
- Or create one through the registration page

## First Time Usage

### As Admin:
1. Login with admin credentials
2. Go to Question Bank and create questions (5 types available)
3. Create an exam in Exam Management
4. Use Exam Builder to add questions to your exam
5. Activate the exam to make it available to students

### As Student:
1. Register a new account
2. Browse available exams on the dashboard
3. Click "Start Exam" on any exam
4. Complete the exam with various question types
5. View your results

## Question Types Supported

1. **Multiple Choice** - Select one correct answer from multiple options
2. **Single Choice** - True/false or yes/no questions
3. **Short Answer** - Text-based answers
4. **Match the Following** - Match items between two columns
5. **Code Test** - Write and test code with built-in editor

## Sample Exams Included

The system comes with 2 pre-configured sample exams:
- **JavaScript Fundamentals** - 60 minutes, 5 questions
- **React Basics** - 45 minutes, 3 questions

Admins can create unlimited custom exams with any combination of question types.

## Need Help?

- **Admin Guide**: See ADMIN_GUIDE.md for complete admin documentation
- **Full Documentation**: Check README.md for detailed information
- **Question Types**: Each type has specific creation and answering interfaces
