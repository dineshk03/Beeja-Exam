# Schedule Not Showing - Troubleshooting Guide

## 🔍 **Issue:**
Scheduled exam created but not showing on student dashboard

## ✅ **Checklist - Why Schedule Might Not Show:**

### **1. Student Not Assigned to Exam** ⭐ MOST COMMON
**Problem:**
- Schedule created ✅
- But student not assigned to the exam ❌

**Solution:**
```
Admin Dashboard
  ↓
Go to "Exams"
  ↓
Find the exam you scheduled
  ↓
Click "Assign Students"
  ↓
Select the student
  ↓
Click "Assign"
  ↓
Now student will see the schedule! ✅
```

**OR** - If exam has NO assigned students, it's open to ALL students automatically.

---

### **2. Schedule Date in Past**
**Problem:**
- Schedule date is yesterday or earlier
- System only shows future schedules

**Solution:**
- Edit schedule
- Change date to today or future
- Save

---

### **3. Schedule Status Not 'scheduled'**
**Problem:**
- Status is 'completed', 'cancelled', or 'ongoing'
- Only 'scheduled' status shows

**Solution:**
- Check schedule status
- Should be 'scheduled'

---

### **4. Exam Not Active**
**Problem:**
- Exam's `isActive` field is false
- Inactive exams don't show

**Solution:**
- Go to Exam Management
- Activate the exam
- Try again

---

## 🔧 **How to Fix:**

### **Step-by-Step Fix:**

**Step 1: Assign Student to Exam**
```
1. Login as Admin
2. Go to "Exam Management"
3. Find your exam (e.g., "JavaScript Basics")
4. Click "Assign Students" or edit exam
5. Select the student from list
6. Click "Assign" or "Save"
```

**Step 2: Verify Schedule**
```
1. Go to "Exam Scheduling"
2. Find your schedule
3. Check:
   - Date is today or future ✅
   - Status is "scheduled" ✅
   - Exam name is correct ✅
```

**Step 3: Student Refreshes Dashboard**
```
1. Student logs out
2. Logs back in
3. Goes to Dashboard
4. Clicks "Scheduled Exams" tab
5. Should see the exam! ✅
```

---

## 🧪 **Testing:**

### **Test 1: Open Exam (No Assignments)**
```
1. Admin creates exam
2. Don't assign any students
3. Create schedule for this exam
4. ANY student logs in
5. ✅ All students see it
```

### **Test 2: Assigned Exam**
```
1. Admin creates exam
2. Assign to Student A
3. Create schedule
4. Student A logs in → ✅ Sees it
5. Student B logs in → ❌ Doesn't see it
```

---

## 📊 **Backend Logs:**

**After the fix, check server console:**
```
Fetching schedules for student: 68f0d3120071817277160e92
Current date (start of day): 2025-10-17T00:00:00.000Z
Total schedules found: 1
Schedule 68f... for exam "JavaScript Basics": {
  assignedStudents: 1,
  isOpenToAll: false,
  isStudentAssigned: true,  ← Should be true!
  result: true
}
Available schedules for student: 1  ← Should be > 0
```

---

## 🎯 **Quick Fix Summary:**

**Most Common Issue:**
```
❌ Student not assigned to exam

✅ Fix:
   Admin → Exams → Select Exam → Assign Students → Select Student → Save
```

**Then:**
```
Student → Refresh Dashboard → Click "Scheduled Exams" → ✅ See exam!
```

---

## 💡 **Pro Tips:**

### **Tip 1: Open Exams**
- Don't assign any students = Open to all
- Good for public exams
- All students see it automatically

### **Tip 2: Assigned Exams**
- Assign specific students = Private
- Only assigned students see it
- Good for specific groups

### **Tip 3: Check Logs**
- Server console shows detailed logs
- See exactly why schedule filtered out
- Easy debugging

---

## ✅ **Verification:**

**Admin Side:**
1. ✅ Exam created
2. ✅ Students assigned to exam
3. ✅ Schedule created
4. ✅ Schedule date is future
5. ✅ Schedule status is 'scheduled'

**Student Side:**
1. ✅ Student assigned to exam (or exam open to all)
2. ✅ Student logs in
3. ✅ Goes to Dashboard
4. ✅ Clicks "Scheduled Exams" tab
5. ✅ Sees exam with schedule info!

---

## 🎉 **Expected Result:**

**Student Dashboard:**
```
Scheduled Exams (1)  ← Shows count

┌─────────────────────────────────────────┐
│  📚 JavaScript Basics                   │
│  Learn the fundamentals...              │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 📅 Thu, Oct 17, 2025              │  │
│  │ 🕐 11:14 AM - 11:27 AM            │  │
│  │ 📍 Online                         │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [Start Exam]                           │
└─────────────────────────────────────────┘
```

---

**Follow these steps and the schedule will appear!** ✨

---

**Version**: 2.6.2  
**Last Updated**: October 17, 2025  
**Status**: ✅ Troubleshooting Guide
