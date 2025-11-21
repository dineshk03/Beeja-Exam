# Schedule Module Debug Steps

## 🔍 **Problem:**
Schedule exam module not working properly - schedules not showing on student dashboard

---

## 🧪 **Debug Steps:**

### **Step 1: Test Debug Endpoint**

**Open browser or Postman:**
```
GET http://localhost:5000/api/schedules/debug
```

**With Authorization header:**
```
Authorization: Bearer YOUR_TOKEN
```

**This will show:**
- Total schedules in database
- All schedule details
- Exam assignments
- Your user ID

**Expected Response:**
```json
{
  "total": 1,
  "schedules": [
    {
      "_id": "...",
      "exam": {
        "title": "JavaScript Basics",
        "assignedStudents": ["student-id-1", "student-id-2"]
      },
      "scheduledDate": "2025-10-17",
      "status": "scheduled"
    }
  ],
  "currentUser": "your-student-id"
}
```

**Check:**
- ✅ Is `total` > 0? (Schedule exists)
- ✅ Is your `currentUser` ID in `assignedStudents`? (You're assigned)
- ✅ Is `scheduledDate` today or future? (Not past)
- ✅ Is `status` = "scheduled"? (Not completed/cancelled)

---

### **Step 2: Check Server Console**

**When student refreshes dashboard, you should see:**
```
Fetching schedules for student: 68f0d3120071817277160e92
Current date (start of day): 2025-10-17T00:00:00.000Z
Total schedules found: 1
Schedule 68f... for exam "JavaScript Basics": {
  assignedStudents: 1,
  isOpenToAll: false,
  isStudentAssigned: true,  ← Should be TRUE
  result: true
}
Available schedules for student: 1  ← Should be > 0
```

**If you see:**
- `Total schedules found: 0` → Schedule not in database or date is past
- `isStudentAssigned: false` → Student not assigned to exam
- `Available schedules for student: 0` → Filtering failed

---

### **Step 3: Check Browser Console (F12)**

**When on student dashboard:**
```
Dashboard Debug:
Total exams: 1
Total schedules: 0  ← Should be > 0
Schedules: []       ← Should have data
Exams with schedules: 0
```

**If schedules array is empty:**
- Backend not returning schedules
- API call failing
- Check Network tab for errors

---

## 🔧 **Common Issues & Fixes:**

### **Issue 1: Student Not Assigned to Exam** ⭐ MOST COMMON

**Symptom:**
```
isStudentAssigned: false
Available schedules for student: 0
```

**Fix:**
```
1. Admin → Exam Management
2. Click on the exam
3. Find "Assigned Students" section
4. Add the student
5. Save
6. Student refreshes dashboard
7. ✅ Should appear now!
```

---

### **Issue 2: Schedule Date in Past**

**Symptom:**
```
Total schedules found: 0
```

**Fix:**
```
1. Admin → Exam Scheduling
2. Edit the schedule
3. Change date to today or future
4. Save
5. ✅ Should appear now!
```

---

### **Issue 3: Exam Has No Assigned Students (But Should Be Open)**

**Symptom:**
```
assignedStudents: 0
isOpenToAll: true
result: true
```

**This is CORRECT** - Exam is open to all students.

**If still not showing:**
- Check exam's `isActive` field
- Check if exam exists in student's exam list

---

### **Issue 4: Schedule Not Saved to Database**

**Symptom:**
```
DEBUG: Total schedules in database: 0
```

**Fix:**
```
1. Check server console when creating schedule
2. Look for errors
3. Verify MongoDB connection
4. Try creating schedule again
5. Check /schedules/debug endpoint
```

---

## 📝 **Manual Database Check:**

**If you have MongoDB Compass or CLI:**

```javascript
// Connect to database
use exam-module

// Check schedules collection
db.schedules.find().pretty()

// Check if schedule exists
db.schedules.countDocuments()

// Check specific schedule
db.schedules.find({ status: 'scheduled' }).pretty()

// Check exam assignments
db.exams.find({}, { title: 1, assignedStudents: 1 }).pretty()
```

---

## ✅ **Complete Verification Checklist:**

### **Backend (Server Console):**
- [ ] Schedule created successfully (no errors)
- [ ] Schedule saved to database
- [ ] `/schedules/debug` returns schedule
- [ ] Student ID in exam's assignedStudents OR assignedStudents is empty
- [ ] Schedule date is today or future
- [ ] Schedule status is 'scheduled'

### **Frontend (Browser Console):**
- [ ] API call to `/schedules` succeeds (Network tab)
- [ ] Response contains schedule data
- [ ] `Total schedules` > 0 in debug logs
- [ ] Exam ID matches between schedule and exam list

### **Database:**
- [ ] Schedule document exists in `schedules` collection
- [ ] Exam document exists in `exams` collection
- [ ] Student ID in exam's `assignedStudents` array OR array is empty

---

## 🎯 **Quick Test Scenario:**

### **Test 1: Create Open Schedule (No Assignments)**

```
1. Admin creates exam "Test Exam"
2. Don't assign any students
3. Create schedule for "Test Exam"
4. Student logs in
5. ✅ Should see schedule (open to all)
```

### **Test 2: Create Assigned Schedule**

```
1. Admin creates exam "Private Exam"
2. Assign Student A
3. Create schedule for "Private Exam"
4. Student A logs in → ✅ Sees it
5. Student B logs in → ❌ Doesn't see it
```

---

## 🔍 **Debug Endpoint Usage:**

**In browser (while logged in as student):**
```
http://localhost:5000/api/schedules/debug
```

**Response tells you:**
1. How many schedules exist
2. Which exams they're for
3. Who's assigned
4. Your user ID
5. Why you can/can't see them

---

## 💡 **Pro Tips:**

1. **Always check server console first** - Most informative
2. **Use debug endpoint** - Shows raw database data
3. **Check both student and exam assignments** - Must match
4. **Verify dates** - Past dates won't show
5. **Test with open exam first** - Eliminates assignment issues

---

## 🎉 **When It Works:**

**Server Console:**
```
Available schedules for student: 1
```

**Browser Console:**
```
Total schedules: 1
Exams with schedules: 1
```

**Student Dashboard:**
```
Scheduled Exams (1)  ← Shows count!

[Exam card with schedule info displayed]
```

---

**Follow these steps to identify and fix the issue!** 🔍✨

---

**Version**: 2.6.3  
**Last Updated**: October 17, 2025  
**Status**: ✅ Debug Guide
