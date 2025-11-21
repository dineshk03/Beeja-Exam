# Timer Persistence - Testing Guide

## ✅ **Changes Complete!**

The timer will now persist correctly across page refreshes.

---

## 🧪 **How to Test:**

### **Step 1: Restart Server**
```bash
# Stop the server (Ctrl+C)
# Start it again
npm start
```

### **Step 2: Clear Old Data**
```
1. Open browser (student side)
2. Press F12 (open DevTools)
3. Go to "Application" tab
4. Click "Local Storage"
5. Click your site (http://localhost:3000)
6. Find key "exam-storage"
7. Right-click → Delete
8. Close DevTools
```

### **Step 3: Start New Exam**
```
1. Login as student
2. Go to dashboard
3. Click "Start Exam" on any exam
4. Complete pre-exam checks
5. Start the exam
6. ✅ Timer starts (e.g., 60:00)
```

### **Step 4: Wait and Refresh**
```
1. Wait 2-3 minutes
2. Timer shows (e.g., 57:30)
3. Press F5 (refresh page)
4. ✅ Timer should show same time (57:30)
5. ✅ NOT reset to 60:00!
```

---

## 📊 **What to Check:**

### **In Browser Console (F12):**
```javascript
// Check localStorage
localStorage.getItem('exam-storage')

// Should see:
{
  "state": {
    "sessionStartTime": "2025-10-17T07:00:00.000Z", // ✅ This should exist!
    "sessionId": "...",
    "currentExam": {...}
  }
}
```

### **Expected Behavior:**
```
Start exam at 12:00 PM (60 min duration)
Timer: 60:00

At 12:05 PM (5 minutes later):
Timer: 55:00

Refresh page:
✅ Timer: 55:00 (correct!)
❌ NOT 60:00 (would be wrong)

At 12:10 PM:
Timer: 50:00

Refresh again:
✅ Timer: 50:00 (correct!)
```

---

## 🐛 **If Timer Still Resets:**

### **Check 1: Is startTime in localStorage?**
```javascript
// In browser console
const storage = JSON.parse(localStorage.getItem('exam-storage'));
console.log('Start Time:', storage.state.sessionStartTime);

// Should show: "2025-10-17T07:00:00.000Z"
// If null or undefined → Problem!
```

### **Check 2: Is backend returning startTime?**
```javascript
// In Network tab (F12)
// Look for POST request to /exams/:id/start
// Check response:
{
  "sessionId": "...",
  "startTime": "2025-10-17T07:00:00.000Z", // ✅ Should be here!
  "exam": {...}
}
```

### **Check 3: Is timer receiving startTime?**
```javascript
// In ExamInterface.jsx, add console.log
console.log('Session Start Time:', sessionStartTime);

// Should show: "2025-10-17T07:00:00.000Z"
// If undefined → Check store
```

---

## 🔧 **Troubleshooting:**

### **Problem: Timer shows 00:00**
**Cause:** startTime is in the future or calculation error

**Fix:**
```javascript
// Check in console
const start = new Date("2025-10-17T07:00:00.000Z");
const now = new Date();
console.log('Start:', start);
console.log('Now:', now);
console.log('Elapsed:', (now - start) / 1000, 'seconds');
```

### **Problem: Timer still resets to 60:00**
**Cause:** Old session data without startTime

**Fix:**
1. Clear localStorage completely
2. Logout and login again
3. Start a fresh exam

### **Problem: Timer shows wrong time**
**Cause:** Time zone issues

**Fix:**
- Backend uses UTC timestamps
- Frontend converts to local time
- Should work automatically

---

## ✅ **Success Indicators:**

You'll know it's working when:
- ✅ localStorage has `sessionStartTime`
- ✅ Timer counts down normally
- ✅ Refresh → Timer shows same time
- ✅ Close/reopen → Timer continues correctly
- ✅ Multiple refreshes → Time stays accurate

---

## 📝 **Quick Test Script:**

```
1. Start exam → Timer: 60:00
2. Wait 1 minute → Timer: 59:00
3. Refresh → Timer: 59:00 ✅
4. Wait 1 minute → Timer: 58:00
5. Refresh → Timer: 58:00 ✅
6. Close tab
7. Reopen and navigate to exam
8. Timer: ~57:00 ✅ (depends on time elapsed)
```

---

**After following these steps, the timer should persist correctly!** 🎉

---

**Version**: 3.0.3  
**Last Updated**: October 17, 2025  
**Status**: ✅ Ready to Test
