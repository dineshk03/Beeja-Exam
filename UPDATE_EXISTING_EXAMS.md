# Fix for Existing Exams - Add Webcam/Microphone Fields

## Problem
Exams created before the webcam/microphone feature don't have these fields, so they default to `undefined` which causes issues.

## Solution

Run this MongoDB command to update all existing exams:

### Option 1: MongoDB Shell
```javascript
// Connect to MongoDB
mongo

// Use your database
use exam_system

// Update all exams to have the new fields with default values
db.exams.updateMany(
  { 
    $or: [
      { enableWebcam: { $exists: false } },
      { enableMicrophone: { $exists: false } }
    ]
  },
  { 
    $set: { 
      enableWebcam: false,
      enableMicrophone: false
    }
  }
)

// Verify the update
db.exams.find({}, { title: 1, enableWebcam: 1, enableMicrophone: 1 })
```

### Option 2: MongoDB Compass
1. Open MongoDB Compass
2. Connect to your database
3. Go to `exams` collection
4. Click "Add Data" → "Import File" or manually edit
5. For each exam, add:
   ```json
   {
     "enableWebcam": false,
     "enableMicrophone": false
   }
   ```

### Option 3: Quick Fix - Edit Your Java Exam
1. Go to Admin Panel
2. Click "Exams"
3. Click **Edit** on your Java exam
4. Scroll to **Advanced Exam Features**
5. Make sure these are **UNCHECKED** (off):
   - ☐ Enable Webcam Monitoring
   - ☐ Enable Microphone Monitoring
6. Click **Update Exam**

This will save the fields properly in the database.

## After Fix
The System Requirements Check will show:
- 📹 Webcam: **Not required for this exam** ✓
- 🎤 Microphone: **Not required for this exam** ✓

Instead of trying to access the devices.
