# Dashboard Termination Behavior

## 📋 **Current Behavior:**

### **What Happens When Admin Terminates:**

1. **During Exam (ExamInterface):**
   - ✅ Student's exam checks status every 5 seconds
   - ✅ Detects termination
   - ✅ Shows alert: "This exam has been terminated by an administrator."
   - ✅ Redirects to dashboard
   - ✅ Exam ends immediately

2. **On Dashboard:**
   - ✅ Student returns to dashboard
   - ✅ Can see all available exams
   - ✅ Terminated session is recorded in database
   - ✅ Student can start a new attempt (if allowed)

---

## 🔍 **Understanding Termination:**

### **What Gets Terminated:**
- The **active exam session** (the current attempt)
- NOT the exam itself

### **What This Means:**
- ✅ Exam still appears on dashboard
- ✅ Student can start a new attempt (if attempts remaining)
- ✅ Previous terminated session is saved with status='terminated'
- ✅ Admin can review the terminated session

---

## 📊 **Session States:**

### **in-progress:**
- Student currently taking exam
- Can be terminated by admin

### **submitted:**
- Student completed and submitted
- Cannot be terminated (already done)

### **terminated:**
- Admin ended the session
- Saved in database
- Counts as an attempt
- Student can retry if attempts remaining

### **expired:**
- Time ran out
- Automatically submitted

---

## 🎯 **Expected Flow:**

### **Scenario 1: Termination During Exam**
```
1. Student starts exam
2. Admin sees suspicious activity
3. Admin terminates session
4. ✅ Student's exam ends (within 5 seconds)
5. ✅ Student redirected to dashboard
6. ✅ Exam still visible on dashboard
7. Student can start new attempt (if allowed)
```

### **Scenario 2: After Termination**
```
1. Student on dashboard
2. Sees exam they were terminated from
3. Clicks "Start Exam"
4. ✅ System checks:
   - Previous attempts: 1 (terminated)
   - Allowed attempts: 5
   - Remaining: 4
5. ✅ Can start new attempt
```

---

## ✅ **Why Exam Still Shows:**

### **Reason 1: Attempts System**
- Students get multiple attempts
- Termination counts as 1 attempt
- If attempts remaining, can retry

### **Reason 2: Fairness**
- Student might have been terminated unfairly
- Technical issues might have caused false flags
- Admin can review and allow retry

### **Reason 3: Database Integrity**
- Terminated session is preserved
- Admin can review what happened
- Evidence for disciplinary action

---

## 🔧 **If You Want Different Behavior:**

### **Option 1: Hide After Termination**
**Requirement:** Exam should not show after termination

**Implementation:**
```javascript
// In Dashboard.jsx
const fetchExams = async () => {
  const exams = await api.get('/exams');
  
  // Filter out exams with terminated sessions
  const examsWithStatus = await Promise.all(
    exams.data.map(async (exam) => {
      const sessions = await api.get(`/sessions/my-sessions/${exam._id}`);
      const hasTerminated = sessions.data.some(s => s.status === 'terminated');
      return { ...exam, hasTerminated };
    })
  );
  
  // Only show exams without termination
  setExams(examsWithStatus.filter(e => !e.hasTerminated));
};
```

### **Option 2: Show Warning**
**Requirement:** Show that previous attempt was terminated

**Implementation:**
```javascript
// In exam card
{hasTerminatedSession && (
  <div className="bg-red-50 border border-red-200 rounded p-2 mb-2">
    <p className="text-xs text-red-700">
      ⚠️ Previous attempt was terminated by administrator
    </p>
  </div>
)}
```

### **Option 3: Require Admin Approval**
**Requirement:** Student needs admin approval to retry

**Implementation:**
```javascript
// Backend check
if (hasTerminatedSession && !adminApproved) {
  return res.status(403).json({
    error: 'Cannot retake exam',
    message: 'Your previous attempt was terminated. Contact administrator for approval.'
  });
}
```

---

## 💡 **Recommended Approach:**

### **Current System is Good Because:**
1. ✅ Flexible - allows retries
2. ✅ Fair - student can explain/retry
3. ✅ Transparent - all sessions recorded
4. ✅ Simple - no complex approval workflow

### **If Needed, Add:**
1. Visual indicator on dashboard
2. Warning message before retry
3. Admin can block specific students
4. Automatic email to student/admin

---

## 🎯 **Summary:**

**Current Behavior:**
- ✅ Termination ends active exam immediately
- ✅ Student redirected to dashboard
- ✅ Exam still visible (for retry)
- ✅ Terminated session saved

**This is CORRECT because:**
- Allows fair retry system
- Preserves evidence
- Flexible for edge cases
- Standard exam system behavior

**If you want to hide terminated exams:**
- Let me know
- I can add that feature
- Will filter on dashboard
- Or show warning message

---

**Version**: 2.9.2  
**Last Updated**: October 17, 2025  
**Status**: ✅ Working as Designed
