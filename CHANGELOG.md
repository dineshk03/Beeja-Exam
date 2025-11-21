# Changelog

## Version 2.0.0 - MongoDB Integration (Current)

### 🎉 Major Changes

#### Database Migration
- **Migrated from in-memory storage to MongoDB**
- Implemented Mongoose ODM for data modeling
- Added database connection configuration
- Automatic database creation on first run

#### New Features

##### Student Management
- ✅ View all registered students
- ✅ View individual student details
- ✅ View student exam history
- ✅ Activate/deactivate student accounts
- ✅ Search students by name or email

##### Exam Assignment System
- ✅ Assign specific students to exams
- ✅ Bulk assign multiple students
- ✅ Unassign students from exams
- ✅ View assigned exams per student
- ✅ Students only see their assigned exams

##### Activity Logging & Audit Trail
- ✅ Log all user actions (login, logout, register)
- ✅ Track exam activities (start, submit)
- ✅ Monitor question management (create, update, delete)
- ✅ Record student assignments
- ✅ Store IP address and user agent
- ✅ Paginated activity log viewing

##### Enhanced Admin Panel
- ✅ Student management page
- ✅ Student details page with exam history
- ✅ Exam assignment interface
- ✅ Activity logs viewer
- ✅ Enhanced statistics (includes student count)

#### Backend Updates

##### Models Created
- `User` - User accounts with roles and assigned exams
- `Question` - Question bank with all question types
- `Exam` - Exam configurations with assigned students
- `ExamSession` - Exam attempts and results
- `ActivityLog` - Audit trail for all activities

##### API Endpoints Added

**Student Management:**
- `GET /api/admin/students` - List all students
- `GET /api/admin/students/:id` - Get student details
- `PUT /api/admin/students/:id/status` - Update student status

**Exam Assignment:**
- `POST /api/admin/exams/:examId/assign/:studentId` - Assign student
- `DELETE /api/admin/exams/:examId/assign/:studentId` - Unassign student
- `POST /api/admin/exams/:examId/assign-bulk` - Bulk assign students

**Activity Logs:**
- `GET /api/admin/logs` - Get activity logs (paginated)
- `GET /api/admin/students/:id/logs` - Get student activity logs

##### Routes Updated
- All admin routes now use MongoDB
- All exam routes now use MongoDB
- Authentication routes use MongoDB User model
- Real-time answer saving to database
- Automatic score calculation and storage

#### Frontend Updates

##### New Pages
- `StudentManagement.jsx` - Student list and management
- `StudentDetails.jsx` - Individual student details and exam assignment

##### Updated Components
- `AdminLayout.jsx` - Added Students menu item
- `AdminDashboard.jsx` - Added student count statistics
- `App.jsx` - Added student management routes

#### Technical Improvements

##### Security
- Password hashing with bcrypt (pre-save hook)
- Account activation/deactivation
- Session tracking with IP and user agent
- Activity logging for audit compliance

##### Performance
- Database indexing on frequently queried fields
- Efficient population of related documents
- Optimized queries with lean() where appropriate

##### Data Persistence
- All data persists across server restarts
- No data loss on application restart
- Proper database relationships with refs

### 📝 Documentation

#### New Documentation Files
- `MONGODB_SETUP.md` - Complete MongoDB setup guide
- `CHANGELOG.md` - This file
- Updated `README.md` - Added MongoDB information
- Updated `QUICKSTART.md` - Added MongoDB setup steps
- Updated `ADMIN_GUIDE.md` - Added student management section

### 🔄 Migration Notes

#### Breaking Changes
- **In-memory data will not be migrated**
- All questions, exams, and users need to be recreated
- Default admin account is auto-created on first run

#### What You Need to Do
1. Install MongoDB (local or Atlas)
2. Update `.env` file with MongoDB URI
3. Start the application
4. Default admin will be created automatically
5. Recreate questions in Question Bank
6. Recreate exams
7. Students can register new accounts

### 🐛 Bug Fixes
- Fixed question ID handling (now uses MongoDB ObjectId)
- Fixed exam session tracking
- Improved error handling across all routes
- Fixed answer storage for different question types

### ⚡ Performance Improvements
- Faster data retrieval with MongoDB indexes
- Efficient query population
- Reduced memory usage (data in database, not memory)
- Better scalability for large datasets

---

## Version 1.0.0 - Initial Release

### Features
- User authentication (login/register)
- Admin panel with dashboard
- Question bank with 5 question types
- Exam management
- Exam builder
- Student exam interface
- Real-time timer
- Question navigation and flagging
- Results display
- In-memory data storage

### Question Types
- Multiple Choice
- Single Choice
- Short Answer
- Match the Following
- Code Test (with Monaco Editor)

### Admin Features
- Dashboard with statistics
- Question bank management
- Exam creation and management
- Exam builder interface

### Student Features
- Browse available exams
- Take exams with timer
- Answer different question types
- Flag questions for review
- View results after submission

---

## Upcoming Features (Roadmap)

### Version 2.1.0 (Planned)
- [ ] Email notifications for exam assignments
- [ ] Export exam results to CSV/PDF
- [ ] Question import from CSV/JSON
- [ ] Exam templates
- [ ] Question randomization
- [ ] Time limits per question

### Version 2.2.0 (Planned)
- [ ] Advanced analytics dashboard
- [ ] Student performance reports
- [ ] Question difficulty analysis
- [ ] Exam scheduling with date/time
- [ ] Automatic exam activation/deactivation

### Version 3.0.0 (Future)
- [ ] Code execution for code test questions
- [ ] Plagiarism detection
- [ ] Video proctoring
- [ ] Screen recording
- [ ] Multi-language support
- [ ] Mobile app
- [ ] LMS integration (Moodle, Canvas)

---

## Support & Feedback

For issues, questions, or feature requests:
- Check documentation files
- Review MongoDB setup guide
- Check console logs for errors
- Verify database connection

## Contributors

- Admin Panel & Question Types
- MongoDB Integration
- Student Management System
- Activity Logging System
