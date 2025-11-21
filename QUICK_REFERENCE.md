# Quick Reference Card

## 🚀 Quick Start (4 Steps)

```bash
# 1. Install dependencies
npm install

# 2. Setup MongoDB (choose one)
# Option A: Local - Install and start MongoDB
# Option B: Atlas - Get connection string from cloud.mongodb.com

# 3. Configure .env
MONGODB_URI=mongodb://localhost:27017/exam-module

# 4. Start application
npm run dev
```

**Access:** http://localhost:3000

---

## 🔑 Login Credentials

### Admin
- **Email**: `admin@exam.com`
- **Password**: `admin123`
- **Access**: Full admin panel

### Student
- Register new account at `/register`

---

## 📍 Key URLs

| Page | URL | Access |
|------|-----|--------|
| Login | `/login` | Public |
| Register | `/register` | Public |
| Admin Dashboard | `/admin` | Admin only |
| Question Bank | `/admin/questions` | Admin only |
| Exam Management | `/admin/exams` | Admin only |
| Students | `/admin/students` | Admin only |
| Student Dashboard | `/dashboard` | Student only |

---

## 🎯 Admin Quick Actions

### Create Question
1. Go to `/admin/questions`
2. Click "Add Question"
3. Select type (5 types available)
4. Fill details → Save

### Create Exam
1. Go to `/admin/exams`
2. Click "Create Exam"
3. Fill details → Save
4. Click Settings icon → Add questions

### Assign Exam to Student
1. Go to `/admin/students`
2. Click on student name
3. Click "Assign Exam"
4. Select exam → Confirm

---

## 📊 API Endpoints (Quick Reference)

### Authentication
```
POST /api/auth/register    # Register
POST /api/auth/login       # Login
```

### Admin - Students
```
GET    /api/admin/students           # List students
GET    /api/admin/students/:id       # Student details
PUT    /api/admin/students/:id/status # Update status
```

### Admin - Exam Assignment
```
POST   /api/admin/exams/:examId/assign/:studentId    # Assign
DELETE /api/admin/exams/:examId/assign/:studentId    # Unassign
POST   /api/admin/exams/:examId/assign-bulk          # Bulk assign
```

### Admin - Questions
```
GET    /api/admin/questions     # List
POST   /api/admin/questions     # Create
PUT    /api/admin/questions/:id # Update
DELETE /api/admin/questions/:id # Delete
```

### Admin - Exams
```
GET    /api/admin/exams     # List
POST   /api/admin/exams     # Create
PUT    /api/admin/exams/:id # Update
DELETE /api/admin/exams/:id # Delete
```

### Student - Exams
```
GET  /api/exams                           # List available
POST /api/exams/:id/start                 # Start exam
POST /api/exams/session/:id/answer        # Save answer
POST /api/exams/session/:id/submit        # Submit
```

---

## 🗄️ Database Collections

| Collection | Purpose |
|------------|---------|
| users | Students and admins |
| questions | Question bank |
| exams | Exam configurations |
| examsessions | Exam attempts |
| activitylogs | Audit trail |

---

## 🎨 Question Types

1. **Multiple Choice** - Radio buttons, single answer
2. **Single Choice** - True/False, Yes/No
3. **Short Answer** - Text input
4. **Match Following** - Match items between columns
5. **Code Test** - Monaco editor, 5 languages

---

## 🔧 Environment Variables

```env
PORT=5000
JWT_SECRET=your-secret-key
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/exam-module
```

---

## 📱 Admin Workflow

```
Login → Dashboard → Create Questions → Create Exam → 
Build Exam (Add Questions) → View Students → 
Assign Exam → Monitor Activity
```

---

## 👨‍🎓 Student Workflow

```
Register → Login → View Assigned Exams → 
Start Exam → Answer Questions → Submit → 
View Results
```

---

## 🐛 Troubleshooting

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
net start MongoDB

# Verify connection string in .env
MONGODB_URI=mongodb://localhost:27017/exam-module
```

### Admin Not Created
- Check console for "✅ Default admin created"
- Wait 1-2 seconds after server starts
- Check MongoDB users collection

### Port Already in Use
- Kill process on port 5000 or 3000
- Or change PORT in .env

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| README.md | Main documentation |
| QUICKSTART.md | Quick start guide |
| MONGODB_SETUP.md | MongoDB setup |
| ADMIN_GUIDE.md | Admin features |
| COMPLETE_FEATURES.md | All features |
| FINAL_SUMMARY.md | Project summary |
| QUICK_REFERENCE.md | This file |

---

## ✅ Feature Checklist

### Admin Features
- [x] Dashboard with stats
- [x] Question bank (5 types)
- [x] Exam management
- [x] Exam builder
- [x] Student management
- [x] Exam assignment
- [x] Activity logs

### Student Features
- [x] Registration/Login
- [x] View assigned exams
- [x] Take exams
- [x] All question types
- [x] Timer with warnings
- [x] Flag questions
- [x] View results

### Database
- [x] MongoDB integration
- [x] 5 models created
- [x] Data persistence
- [x] Activity logging
- [x] Relationships

---

## 🎯 Common Tasks

### Add New Question
```
Admin → Question Bank → Add Question → 
Select Type → Fill Details → Save
```

### Assign Student to Exam
```
Admin → Students → Click Student → 
Assign Exam → Select Exam → Confirm
```

### View Student Results
```
Admin → Students → Click Student → 
View Exam History (bottom of page)
```

### Take an Exam (Student)
```
Login → Dashboard → Click Exam Card → 
Start Exam → Answer → Submit
```

---

## 🔐 Security Notes

- ✅ Passwords hashed with bcrypt
- ✅ JWT token authentication
- ✅ Role-based access control
- ✅ Activity logging enabled
- ✅ IP address tracking
- ⚠️ Change admin password in production
- ⚠️ Use strong JWT_SECRET
- ⚠️ Enable HTTPS in production

---

## 📞 Quick Help

**MongoDB not connecting?**
→ See MONGODB_SETUP.md

**Need admin guide?**
→ See ADMIN_GUIDE.md

**Want all features?**
→ See COMPLETE_FEATURES.md

**Technical details?**
→ See IMPLEMENTATION_SUMMARY.md

---

## 🎊 Status

✅ **Application**: Running  
✅ **MongoDB**: Connected  
✅ **Admin**: Created  
✅ **Features**: 100% Complete  

**Ready to use!** 🚀

---

**Version**: 2.0.0  
**Last Updated**: October 16, 2025
