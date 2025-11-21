# Session Termination - Debug Guide

## 🔍 **Debug Logs Added**

I've added console logs to help debug the termination issue.

---

## 🧪 **Testing Steps:**

### **Step 1: Start Exam as Student**
```
1. Open browser (Student)
2. Login as student
3. Start an exam
4. Keep browser console open (F12)
5. ✅ You should see:
   "Checking session status for: [session-id]"
   "Session status response: { status: 'in-progress' }"
```

### **Step 2: Open Admin Panel**
```
1. Open another browser/tab (Admin)
2. Login as admin
3. Go to Proctoring Monitor
4. Find the student's active session
5. Click on the session
```

### **Step 3: Terminate Session**
```
1. Click "Terminate" button (red)
2. Confirm the action
3. ✅ Check server console, you should see:
   "Terminating session: [session-id]"
   "Current session status: in-progress"
   "Session terminated successfully. New status: terminated"
4. ✅ Check admin browser, you should see:
   "Session terminated successfully" alert
```

### **Step 4: Check Student Side**
```
1. Go back to student's browser
2. ✅ Within 5 seconds, check console:
   "Checking session status for: [session-id]"
   "Session status response: { status: 'terminated' }"
   "Session terminated! Ending exam..."
3. ✅ Alert should appear:
   "This exam has been terminated by an administrator."
4. ✅ Student redirected to dashboard
```

---

## 🐛 **Common Issues & Solutions:**

### **Issue 1: Console shows "No sessionId"**
**Problem:** Session ID not set in store

**Check:**
```javascript
// In browser console (student side)
console.log(sessionId);
```

**Solution:**
- Make sure student properly started exam
- Check ExamLobby sets sessionId
- Verify sessionId is in Zustand store

---

### **Issue 2: "Session not found" error**
**Problem:** Session ID doesn't exist in database

**Check:**
```javascript
// In MongoDB
db.examsessions.findOne({ _id: ObjectId("session-id") })
```

**Solution:**
- Verify session was created when exam started
- Check if session ID is correct
- Look at server logs for session creation

---

### **Issue 3: Status check not happening**
**Problem:** Polling not working

**Check:**
```javascript
// Student browser console should show every 5 seconds:
"Checking session status for: [session-id]"
```

**Solution:**
- Verify useEffect is running
- Check if sessionId exists
- Look for JavaScript errors in console

---

### **Issue 4: Status stays "in-progress"**
**Problem:** Termination didn't save to database

**Check:**
```javascript
// In MongoDB after termination
db.examsessions.findOne({ _id: ObjectId("session-id") })
// Should show: status: "terminated"
```

**Solution:**
- Check server logs for save errors
- Verify admin has permission
- Check if session was already submitted

---

### **Issue 5: Student not redirected**
**Problem:** Frontend not detecting terminated status

**Check:**
```javascript
// Student console should show:
"Session status response: { status: 'terminated' }"
"Session terminated! Ending exam..."
```

**Solution:**
- Verify status check is running
- Check if alert appears
- Look for navigation errors

---

## 📊 **Expected Console Output:**

### **Server Console (Backend):**
```
When admin terminates:
> Terminating session: 673abc123def456789012345
> Current session status: in-progress
> Session terminated successfully. New status: terminated

Every 5 seconds (student checking):
> Checking session status for: 673abc123def456789012345
> Session status: terminated
```

### **Admin Browser Console:**
```
When terminating:
> POST /admin/sessions/673abc123def456789012345/terminate
> Response: { message: "Session terminated successfully" }
```

### **Student Browser Console:**
```
Every 5 seconds:
> Checking session status for: 673abc123def456789012345
> Session status response: { status: "in-progress" }

After termination:
> Checking session status for: 673abc123def456789012345
> Session status response: { status: "terminated" }
> Session terminated! Ending exam...
```

---

## 🔧 **Manual Testing:**

### **Test 1: Direct API Call**
```bash
# Get session status
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/exams/sessions/SESSION_ID/status

# Expected response:
{"status":"in-progress"}

# After termination:
{"status":"terminated"}
```

### **Test 2: Check Database**
```javascript
// Before termination
db.examsessions.findOne({ _id: ObjectId("session-id") })
// status: "in-progress"

// After termination
db.examsessions.findOne({ _id: ObjectId("session-id") })
// status: "terminated"
// terminatedBy: ObjectId("admin-id")
// terminatedAt: ISODate("2025-10-17T06:30:00.000Z")
```

---

## ✅ **Checklist:**

Before testing, verify:
- [ ] Server is running
- [ ] Student is logged in
- [ ] Exam is started (session created)
- [ ] Browser console is open (F12)
- [ ] Admin is logged in
- [ ] Proctoring Monitor is open

During testing, check:
- [ ] Student console shows status checks
- [ ] Server console shows termination
- [ ] Admin sees success message
- [ ] Student console shows "terminated"
- [ ] Alert appears on student side
- [ ] Student redirected to dashboard

---

## 🎯 **What Should Happen:**

### **Timeline:**
```
T+0s:  Admin clicks "Terminate"
T+0s:  Server updates status to "terminated"
T+0s:  Admin sees "Success" message
T+0-5s: Student's next status check
T+0-5s: Student detects "terminated"
T+0-5s: Alert shown to student
T+0-5s: Student redirected to dashboard
```

### **Maximum Delay:** 5 seconds

---

## 📝 **Report Issues:**

If termination still doesn't work, provide:

1. **Server Console Output:**
   - Copy all logs related to termination
   - Include session ID

2. **Student Console Output:**
   - Copy all "Checking session status" logs
   - Include any errors

3. **Admin Console Output:**
   - Copy network tab for terminate request
   - Include response

4. **Database State:**
   - Session status before termination
   - Session status after termination

---

## 🎉 **Success Indicators:**

You'll know it's working when:
- ✅ Server logs show "Session terminated successfully"
- ✅ Student console shows "Session terminated! Ending exam..."
- ✅ Alert appears on student screen
- ✅ Student redirected to dashboard
- ✅ Database shows status="terminated"

---

**Now restart the server and test with the console logs!**

The logs will show exactly where the issue is.

---

**Version**: 2.9.3  
**Last Updated**: October 17, 2025  
**Status**: ✅ Debug Logs Added
