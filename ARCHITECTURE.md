# Exam Management System - Complete Architecture

## System Overview

A comprehensive, production-ready exam management system with advanced proctoring, scheduling, and analytics capabilities.

---

## Architecture Diagram

```
Frontend (Web App)
│
├── Admin Panel (for exam center / org staff)
│   ├── Dashboard (stats, system status) ✅
│   ├── Exam Management ✅
│   ├── Candidate Management ✅
│   ├── Scheduling ✅ NEW
│   ├── Proctoring Monitor ✅ NEW
│   └── Reports & Analytics ✅ NEW
│
├── Candidate Portal
│   ├── Exam Registration ✅
│   ├── Identity Verification ✅ NEW
│   ├── Pre-checks (System, ID, Camera) ✅ NEW
│   ├── Exam Delivery (Timer, Secure UI) ✅
│   └── Result View ✅
│
└── Backend (Server)
    ├── Authentication (JWT / OAuth) ✅
    ├── Exam Engine ✅
    ├── Result Processor ✅ NEW
    ├── Scheduling Engine ✅ NEW
    ├── Proctoring Service (logs, webcam) ✅ NEW
    └── Database (MongoDB) ✅
```

---

## Technology Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **React Router v6** - Client-side routing
- **Zustand** - Lightweight state management
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icon library
- **Recharts** - Data visualization for analytics
- **Monaco Editor** - Code editor for programming questions
- **Axios** - HTTP client
- **Vite** - Fast build tool

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Token-based authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment configuration

---

## Database Models

### 1. User
- Authentication and profile data
- Role-based access (admin/student)
- Assigned exams tracking
- Account status management

### 2. Exam
- Exam configuration and metadata
- Question references
- Student assignments
- Scheduling information
- Proctoring settings

### 3. Question
- 5 question types support
- Category and difficulty levels
- Points and correct answers
- Active/inactive status

### 4. ExamSession
- Live exam tracking
- Answer storage
- Timer management
- Submission status
- Score calculation

### 5. Schedule ✅ NEW
- Exam scheduling with time slots
- Candidate registration
- Venue management
- Proctoring configuration
- Status tracking

### 6. ProctorLog ✅ NEW
- Real-time event logging
- Severity classification
- Webcam snapshots
- Suspicious activity tracking
- Session correlation

### 7. IdentityVerification ✅ NEW
- Document verification
- Face matching
- Verification status
- Manual review support
- Audit trail

### 8. SystemCheck ✅ NEW
- Pre-exam system validation
- Browser compatibility
- Hardware checks (webcam, mic)
- Internet connectivity
- Recommendations

### 9. ActivityLog
- Comprehensive audit trail
- User action tracking
- System events
- Security monitoring

---

## Core Features

### Admin Panel

#### 1. Dashboard
- **System Statistics**
  - Total exams, active exams
  - Question bank size
  - Student count
  - Session metrics
- **Quick Actions**
  - Create exam
  - Add questions
  - Schedule exams
  - View analytics
- **Question Type Breakdown**
  - Visual distribution of question types

#### 2. Exam Management
- **CRUD Operations**
  - Create, read, update, delete exams
  - Bulk operations support
- **Configuration**
  - Duration, passing score
  - Start/end dates
  - Allowed attempts
  - Category assignment
- **Status Management**
  - Activate/deactivate exams
  - Archive old exams

#### 3. Question Bank
- **5 Question Types**
  1. Multiple Choice
  2. Single Choice (True/False)
  3. Short Answer
  4. Match the Following
  5. Code Test (with Monaco editor)
- **Management Features**
  - Search and filter
  - Category organization
  - Difficulty levels
  - Points assignment
  - Bulk import/export

#### 4. Exam Builder
- **Drag-and-Drop Interface**
  - Add questions from bank
  - Remove questions
  - Reorder questions
- **Real-time Preview**
  - Total points calculation
  - Duration estimation
  - Question distribution

#### 5. Student Management
- **Student Directory**
  - View all students
  - Search and filter
  - Account status management
- **Individual Student View**
  - Exam assignments
  - Performance history
  - Activity logs
  - Proctoring incidents

#### 6. Scheduling ✅ NEW
- **Schedule Creation**
  - Select exam
  - Set date and time slots
  - Define capacity limits
  - Configure venue
- **Proctoring Settings**
  - Webcam requirement
  - Screen recording
  - ID verification
  - Browser lockdown
- **Registration Management**
  - View registered candidates
  - Capacity tracking
  - Status updates

#### 7. Proctoring Monitor ✅ NEW
- **Live Monitoring**
  - Active session tracking
  - Real-time alerts
  - Student webcam feeds
- **Event Dashboard**
  - Severity-based filtering
  - Event type categorization
  - Timeline view
- **Alert System**
  - High-priority notifications
  - Suspicious activity flagging
  - Automated logging
- **Session Details**
  - Student information
  - Event statistics
  - Historical logs

#### 8. Analytics & Reports ✅ NEW
- **Dashboard Analytics**
  - Overall statistics
  - Pass/fail distribution
  - Score distribution
  - Question type usage
- **Exam-Specific Reports**
  - Performance metrics
  - Question-wise analysis
  - Success rates
  - Time analysis
- **Student Performance**
  - Individual reports
  - Category-wise performance
  - Progress tracking
  - Comparison metrics
- **Timeline Analytics**
  - Activity trends
  - Peak usage times
  - Historical data
- **Export Functionality**
  - JSON/CSV export
  - Custom date ranges
  - Filtered reports

### Candidate Portal

#### 1. Registration & Authentication
- **User Registration**
  - Email verification
  - Profile creation
  - Secure password
- **Login System**
  - JWT authentication
  - Session management
  - Auto-redirect

#### 2. Pre-Exam Checks ✅ NEW
- **System Verification**
  - Browser compatibility check
  - Internet speed test
  - Webcam detection
  - Microphone detection
  - Screen resolution check
- **Identity Verification**
  - Document upload (ID/Passport/License)
  - Live photo capture
  - Face matching
  - Manual review option
- **Status Indicators**
  - Pass/fail for each check
  - Warning messages
  - Recommendations
- **Proceed Validation**
  - All checks must pass
  - Admin approval required
  - Time-limited validity

#### 3. Exam Dashboard
- **Available Exams**
  - Assigned exams only
  - Exam details display
  - Attempt tracking
- **Exam Cards**
  - Title and description
  - Duration and questions
  - Passing score
  - Start button

#### 4. Exam Lobby
- **Pre-Exam Information**
  - Exam overview
  - Rules and instructions
  - Time allocation
- **Agreement**
  - Terms acceptance
  - Honor code
  - Proctoring consent
- **Final Check**
  - Ready confirmation
  - Start exam button

#### 5. Exam Interface
- **Timer System**
  - Countdown display
  - Warning at 5 minutes
  - Auto-submit on expiry
- **Question Navigation**
  - Previous/Next buttons
  - Jump to question
  - Progress indicator
- **Question Features**
  - Flag for review
  - Answer status
  - Question navigator modal
- **Answer Types**
  - Radio buttons (MC/SC)
  - Text input (Short Answer)
  - Dropdown matching (Match Following)
  - Code editor (Code Test)
- **Auto-Save**
  - Periodic answer saving
  - Session recovery
  - Network resilience

#### 6. Proctoring Integration ✅ NEW
- **Live Monitoring**
  - Webcam feed display
  - Face detection
  - Periodic snapshots
- **Event Detection**
  - Tab switching
  - Window blur
  - Copy/paste attempts
  - Right-click detection
  - Fullscreen exit
  - Multiple faces
- **Automated Logging**
  - All events logged
  - Severity classification
  - Timestamp recording
- **Visual Feedback**
  - Monitoring indicator
  - Warning messages
  - Status display

#### 7. Submission & Results
- **Submission Process**
  - Review unanswered questions
  - Confirmation dialog
  - Final submit
- **Results Display**
  - Score percentage
  - Pass/fail status
  - Correct answers count
  - Performance rating
  - Visual feedback
- **Result History**
  - Past exam results
  - Performance trends
  - Detailed breakdowns

---

## API Endpoints

### Authentication
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login user
```

### Student - Exams
```
GET    /api/exams                  - List available exams
GET    /api/exams/:id              - Get exam details
POST   /api/exams/:id/start        - Start exam session
GET    /api/exams/session/:id      - Get session status
POST   /api/exams/session/:id/answer    - Save answer
POST   /api/exams/session/:id/flag      - Toggle flag
POST   /api/exams/session/:id/submit    - Submit exam
```

### Admin - Exams
```
GET    /api/admin/exams            - List all exams
POST   /api/admin/exams            - Create exam
PUT    /api/admin/exams/:id        - Update exam
DELETE /api/admin/exams/:id        - Delete exam
POST   /api/admin/exams/:examId/questions/:questionId    - Add question
DELETE /api/admin/exams/:examId/questions/:questionId    - Remove question
```

### Admin - Questions
```
GET    /api/admin/questions        - List questions
POST   /api/admin/questions        - Create question
PUT    /api/admin/questions/:id    - Update question
DELETE /api/admin/questions/:id    - Delete question
```

### Admin - Students
```
GET    /api/admin/students         - List students
GET    /api/admin/students/:id     - Get student details
PUT    /api/admin/students/:id/status    - Update status
POST   /api/admin/exams/:examId/assign/:studentId       - Assign exam
DELETE /api/admin/exams/:examId/assign/:studentId       - Unassign exam
POST   /api/admin/exams/:examId/assign-bulk             - Bulk assign
```

### Scheduling ✅ NEW
```
GET    /api/admin/schedules        - List all schedules
POST   /api/admin/schedules        - Create schedule
PUT    /api/admin/schedules/:id    - Update schedule
DELETE /api/admin/schedules/:id    - Delete schedule
GET    /api/schedules              - List available schedules (student)
POST   /api/schedules/:id/register - Register for schedule
DELETE /api/schedules/:id/register - Unregister from schedule
```

### Proctoring ✅ NEW
```
POST   /api/sessions/:sessionId/proctor-log              - Log event
GET    /api/admin/sessions/:sessionId/proctor-logs       - Get session logs
GET    /api/admin/students/:studentId/proctor-logs       - Get student logs
GET    /api/admin/sessions/:sessionId/proctor-stats      - Get statistics
GET    /api/admin/proctor-monitor                        - Live monitor data
```

### Verification ✅ NEW
```
POST   /api/verification/identity                        - Submit ID verification
GET    /api/verification/identity/status                 - Get verification status
GET    /api/admin/verifications/pending                  - Get pending verifications
PUT    /api/admin/verifications/:id                      - Update verification
POST   /api/verification/system-check                    - Submit system check
GET    /api/verification/system-check/latest             - Get latest check
GET    /api/admin/users/:userId/system-checks            - Get user checks
```

### Analytics ✅ NEW
```
GET    /api/admin/analytics/dashboard                    - Dashboard data
GET    /api/admin/analytics/exam/:examId                 - Exam analytics
GET    /api/admin/analytics/student/:studentId           - Student analytics
GET    /api/admin/analytics/timeline                     - Timeline data
GET    /api/admin/analytics/export                       - Export reports
```

### Activity Logs
```
GET    /api/admin/logs             - Get activity logs
GET    /api/admin/students/:id/logs    - Get student logs
```

### Statistics
```
GET    /api/admin/stats            - Get system statistics
```

---

## Security Features

### 1. Authentication & Authorization
- JWT token-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Token expiration (24 hours)
- Protected routes middleware
- Session validation

### 2. Data Security
- Passwords never sent to frontend
- Correct answers hidden from students
- User ownership verification
- Admin-only endpoint protection
- Input validation and sanitization
- SQL injection prevention (NoSQL)

### 3. Proctoring Security ✅ NEW
- Encrypted webcam streams
- Secure snapshot storage
- Event tampering prevention
- Audit trail immutability
- Privacy compliance (GDPR)

### 4. Exam Security
- Session validation
- Answer encryption in transit
- Time-based access control
- Attempt limit enforcement
- Anti-cheating measures
- Browser lockdown option

### 5. Audit & Compliance
- Comprehensive activity logging
- IP address tracking
- User agent tracking
- Timestamp for all activities
- Immutable log records
- Data retention policies

---

## Deployment Guide

### Prerequisites
- Node.js 16+ installed
- MongoDB 4.4+ (local or Atlas)
- npm or yarn package manager

### Installation Steps

1. **Clone/Navigate to Project**
   ```bash
   cd d:\Exam
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create `.env` file:
   ```env
   PORT=5000
   JWT_SECRET=your-secret-key-change-in-production
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/exam-module
   ```

4. **Start MongoDB**
   ```bash
   # Windows
   net start MongoDB
   
   # Linux/Mac
   sudo systemctl start mongod
   ```

5. **Run Application**
   ```bash
   npm run dev
   ```

6. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Admin: admin@exam.com / admin123

### Production Deployment

1. **Build Frontend**
   ```bash
   npm run build
   ```

2. **Environment Variables**
   - Set `NODE_ENV=production`
   - Use strong `JWT_SECRET`
   - Configure MongoDB Atlas URI
   - Enable HTTPS

3. **Process Manager**
   ```bash
   npm install -g pm2
   pm2 start server/index.js --name exam-api
   pm2 startup
   pm2 save
   ```

4. **Reverse Proxy (Nginx)**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
       
       location / {
           root /path/to/dist;
           try_files $uri /index.html;
       }
   }
   ```

---

## Performance Optimization

### Database
- Indexed fields for fast queries
- Compound indexes for complex queries
- Connection pooling
- Query optimization
- Aggregation pipelines

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- Caching strategies
- Minification and compression

### Backend
- Response caching
- Rate limiting
- Gzip compression
- Efficient algorithms
- Async/await patterns

---

## Monitoring & Maintenance

### Logging
- Application logs
- Error logs
- Access logs
- Proctoring logs
- Activity logs

### Monitoring
- Server health checks
- Database performance
- API response times
- Error rates
- User activity

### Backup
- Database backups (daily)
- Configuration backups
- User data exports
- Disaster recovery plan

---

## Future Enhancements

### Planned Features
- [ ] AI-powered face recognition
- [ ] Advanced plagiarism detection
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Video proctoring with AI
- [ ] Certificate generation
- [ ] Email notifications
- [ ] SMS alerts
- [ ] Payment integration
- [ ] Advanced reporting
- [ ] Question randomization
- [ ] Adaptive testing
- [ ] Peer review system
- [ ] Discussion forums

---

## Support & Documentation

### Available Documentation
- README.md - Main documentation
- QUICKSTART.md - Quick start guide
- ADMIN_GUIDE.md - Admin user guide
- MONGODB_SETUP.md - Database setup
- ARCHITECTURE.md - This file
- COMPLETE_FEATURES.md - Feature list
- CHANGELOG.md - Version history

### Getting Help
- Check documentation first
- Review error logs
- Test in development mode
- Contact support team

---

**Version**: 3.0.0  
**Status**: Production Ready ✅  
**Last Updated**: October 16, 2025  
**Architecture**: Complete Implementation
