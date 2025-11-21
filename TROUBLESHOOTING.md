# Troubleshooting Guide

## ❌ Error Found: Missing .env File

**Status**: ✅ FIXED - `.env` file has been created

---

## 🔧 Current Issue: MongoDB Not Running

### Error Message
```
MongooseError: Cast to ObjectId failed
```

This error occurs because **MongoDB is not installed or not running**.

---

## ✅ Solution: Install and Start MongoDB

### Option 1: Install MongoDB Locally (Recommended for Development)

#### Windows Installation:

1. **Download MongoDB**
   - Go to: https://www.mongodb.com/try/download/community
   - Download MongoDB Community Server
   - Run the installer

2. **Install MongoDB**
   - Choose "Complete" installation
   - Check "Install MongoDB as a Service"
   - Complete the installation

3. **Start MongoDB Service**
   ```powershell
   net start MongoDB
   ```

4. **Verify MongoDB is Running**
   ```powershell
   mongod --version
   ```

### Option 2: Use MongoDB Atlas (Cloud - Free Tier Available)

1. **Create Account**
   - Go to: https://www.mongodb.com/cloud/atlas
   - Sign up for free

2. **Create Cluster**
   - Click "Build a Database"
   - Choose FREE tier (M0)
   - Select region closest to you
   - Click "Create Cluster"

3. **Setup Database Access**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Create username and password (remember these!)
   - Set permissions to "Read and write to any database"

4. **Setup Network Access**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)

5. **Get Connection String**
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - It looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/exam-module`

6. **Update .env File**
   ```
   MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/exam-module
   ```
   Replace:
   - `YOUR_USERNAME` with your database username
   - `YOUR_PASSWORD` with your database password
   - `YOUR_CLUSTER` with your actual cluster address

---

## 🚀 After Installing MongoDB

### 1. Restart the Application

```bash
# Stop the current process (Ctrl+C in terminal)
# Then start again:
npm run dev
```

### 2. You Should See:

```
✅ MongoDB Connected: localhost
✅ Default admin created: admin@exam.com / admin123
Server running on port 5000
```

### 3. Access the Application

- Frontend: http://localhost:3000
- Login with: admin@exam.com / admin123

---

## 📋 Quick Checklist

- [x] `.env` file created ✅
- [ ] MongoDB installed
- [ ] MongoDB service running
- [ ] Application restarted

---

## 🆘 Still Having Issues?

### Check MongoDB Status

```powershell
# Check if MongoDB service is running
Get-Service MongoDB

# If not running, start it:
net start MongoDB
```

### Check .env File

Make sure your `.env` file contains:
```
PORT=5000
JWT_SECRET=your-secret-key-change-this-in-production
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/exam-module
```

### Check Console Logs

Look for these messages:
- ✅ Good: "MongoDB Connected"
- ❌ Bad: "MongoDB Connection Error"

---

## 📞 Common Errors & Solutions

### Error: "ECONNREFUSED"
**Cause**: MongoDB is not running  
**Solution**: Start MongoDB service: `net start MongoDB`

### Error: "Authentication failed"
**Cause**: Wrong username/password in connection string  
**Solution**: Check your MongoDB Atlas credentials

### Error: "Network timeout"
**Cause**: Firewall or network issue  
**Solution**: Check firewall settings, allow MongoDB port (27017)

### Error: "Port 5000 already in use"
**Cause**: Another process is using port 5000  
**Solution**: Kill the process or change PORT in .env

---

## 📚 Next Steps After MongoDB is Running

1. **Login as Admin**
   - Email: admin@exam.com
   - Password: admin123

2. **Create Questions**
   - Go to Question Bank
   - Add questions (5 types available)

3. **Create Exams**
   - Go to Exam Management
   - Create and build exams

4. **Manage Students**
   - Go to Students page
   - View and assign exams

---

## 🎯 Summary

**Current Status:**
- ✅ `.env` file created
- ⏳ Waiting for MongoDB installation
- ⏳ Application will work once MongoDB is running

**What You Need to Do:**
1. Install MongoDB (Option 1 or Option 2 above)
2. Start MongoDB service
3. Restart the application with `npm run dev`
4. Login and start using the system!

---

For detailed MongoDB setup instructions, see: **MONGODB_SETUP.md**
