# Deployment Guide - Complete Exam Management System

## Quick Start

### Development Environment

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
# Copy .env.example to .env and update values

# 3. Start MongoDB (if local)
net start MongoDB  # Windows
# or
sudo systemctl start mongod  # Linux

# 4. Run the application
npm run dev
```

**Access Points:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Admin Login: admin@exam.com / admin123

---

## Complete Feature Set

### ✅ Admin Panel
- **Dashboard** - System statistics and quick actions
- **Exam Management** - Create, edit, delete exams
- **Question Bank** - 5 question types (MC, SC, Short Answer, Match, Code)
- **Exam Builder** - Drag-and-drop question assignment
- **Student Management** - View, assign, track students
- **Scheduling** ⭐ NEW - Schedule exams with time slots
- **Proctoring Monitor** ⭐ NEW - Live monitoring dashboard
- **Analytics & Reports** ⭐ NEW - Comprehensive analytics

### ✅ Candidate Portal
- **Registration** - Secure account creation
- **Pre-Exam Checks** ⭐ NEW - System, camera, ID verification
- **Identity Verification** ⭐ NEW - Document upload and face matching
- **Exam Dashboard** - Browse assigned exams
- **Exam Lobby** - Pre-exam instructions
- **Exam Interface** - Timer, navigation, auto-save
- **Live Proctoring** ⭐ NEW - Webcam monitoring during exam
- **Results** - Detailed score breakdown

### ✅ Backend Services
- **Authentication** - JWT-based auth with roles
- **Exam Engine** - Session management and scoring
- **Scheduling Engine** ⭐ NEW - Time slot management
- **Proctoring Service** ⭐ NEW - Event logging and monitoring
- **Result Processor** ⭐ NEW - Enhanced result calculation
- **Analytics Engine** ⭐ NEW - Data aggregation and reporting
- **Database** - MongoDB with 9 models

---

## Architecture Overview

```
Frontend (React + Vite)
    ↓
Backend API (Express.js)
    ↓
Database (MongoDB)
```

**New Components Added:**
- 4 new database models (Schedule, ProctorLog, IdentityVerification, SystemCheck)
- 4 new route handlers (scheduling, proctoring, verification, analytics)
- 5 new frontend pages (PreExamChecks, ProctorMonitor, Scheduling, Analytics, ProctorMonitoring component)
- Enhanced admin navigation and dashboard

---

## Environment Configuration

### Required Environment Variables

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Database
MONGODB_URI=mongodb://localhost:27017/exam-module
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/exam-module

# Optional: File Upload (for future use)
# MAX_FILE_SIZE=10485760  # 10MB
# UPLOAD_DIR=./uploads
```

### Security Recommendations

**Development:**
- Use any JWT_SECRET
- HTTP is acceptable
- Local MongoDB is fine

**Production:**
- Use strong, random JWT_SECRET (32+ characters)
- Enable HTTPS/SSL
- Use MongoDB Atlas or secured MongoDB
- Set NODE_ENV=production
- Enable rate limiting
- Configure CORS properly
- Use environment-specific configs

---

## Database Setup

### Option 1: Local MongoDB

**Windows:**
```bash
# Install MongoDB Community Server
# Download from: https://www.mongodb.com/try/download/community

# Start service
net start MongoDB

# Verify connection
mongosh
```

**Linux:**
```bash
# Install MongoDB
sudo apt-get install -y mongodb-org

# Start service
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
mongosh
```

### Option 2: MongoDB Atlas (Cloud)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Add database user
4. Whitelist IP address (0.0.0.0/0 for development)
5. Get connection string
6. Update MONGODB_URI in .env

**Connection String Format:**
```
mongodb+srv://<username>:<password>@cluster.mongodb.net/exam-module?retryWrites=true&w=majority
```

### Database Indexes

The application automatically creates indexes, but you can manually create them for better performance:

```javascript
// Exam indexes
db.exams.createIndex({ isActive: 1 })
db.exams.createIndex({ createdBy: 1 })

// Question indexes
db.questions.createIndex({ type: 1 })
db.questions.createIndex({ category: 1 })
db.questions.createIndex({ isActive: 1 })

// ExamSession indexes
db.examsessions.createIndex({ student: 1, exam: 1 })
db.examsessions.createIndex({ status: 1 })

// Schedule indexes
db.schedules.createIndex({ exam: 1, scheduledDate: 1 })
db.schedules.createIndex({ status: 1 })

// ProctorLog indexes
db.proctorlogs.createIndex({ session: 1, timestamp: -1 })
db.proctorlogs.createIndex({ student: 1, eventType: 1 })
db.proctorlogs.createIndex({ severity: 1 })
```

---

## Production Deployment

### Step 1: Prepare Application

```bash
# Build frontend
npm run build

# Test production build locally
npm run preview
```

### Step 2: Server Setup

**Using PM2 (Recommended):**

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start server/index.js --name exam-api

# Configure auto-restart on system reboot
pm2 startup
pm2 save

# Monitor application
pm2 monit

# View logs
pm2 logs exam-api
```

**Using systemd (Linux):**

Create `/etc/systemd/system/exam-api.service`:

```ini
[Unit]
Description=Exam Management API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/exam
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable exam-api
sudo systemctl start exam-api
sudo systemctl status exam-api
```

### Step 3: Nginx Configuration

**Install Nginx:**
```bash
sudo apt-get install nginx
```

**Configure Nginx** (`/etc/nginx/sites-available/exam`):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/exam/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for long-running requests
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/exam /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 4: SSL/HTTPS Setup

**Using Let's Encrypt (Free):**

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

### Step 5: Firewall Configuration

```bash
# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Allow SSH (if not already allowed)
sudo ufw allow OpenSSH

# Enable firewall
sudo ufw enable
```

---

## Docker Deployment (Optional)

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Build frontend
RUN npm run build

# Expose port
EXPOSE 5000

# Start application
CMD ["node", "server/index.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - JWT_SECRET=${JWT_SECRET}
      - MONGODB_URI=mongodb://mongo:27017/exam-module
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    restart: unless-stopped

volumes:
  mongo-data:
```

**Deploy with Docker:**
```bash
docker-compose up -d
```

---

## Monitoring & Logging

### Application Logs

**PM2 Logs:**
```bash
pm2 logs exam-api
pm2 logs exam-api --lines 100
pm2 logs exam-api --err
```

**Custom Logging:**
Add to `server/index.js`:
```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Health Monitoring

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "OK",
  "message": "Exam Module API is running"
}
```

**Monitoring Script:**
```bash
#!/bin/bash
# health-check.sh

RESPONSE=$(curl -s http://localhost:5000/api/health)
if [[ $RESPONSE == *"OK"* ]]; then
    echo "✓ API is healthy"
else
    echo "✗ API is down"
    pm2 restart exam-api
fi
```

**Cron Job (every 5 minutes):**
```bash
*/5 * * * * /path/to/health-check.sh
```

---

## Backup & Recovery

### Database Backup

**Manual Backup:**
```bash
# Backup
mongodump --uri="mongodb://localhost:27017/exam-module" --out=/backup/$(date +%Y%m%d)

# Restore
mongorestore --uri="mongodb://localhost:27017/exam-module" /backup/20231016
```

**Automated Daily Backup:**
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backup/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)

mongodump --uri="mongodb://localhost:27017/exam-module" --out="$BACKUP_DIR/$DATE"

# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;
```

**Cron Job (daily at 2 AM):**
```bash
0 2 * * * /path/to/backup.sh
```

### Application Backup

```bash
# Backup application files
tar -czf exam-backup-$(date +%Y%m%d).tar.gz /path/to/exam

# Backup environment
cp .env .env.backup
```

---

## Performance Optimization

### 1. Database Optimization
- Enable indexes (done automatically)
- Use projection to limit returned fields
- Implement pagination for large datasets
- Use aggregation pipelines efficiently

### 2. Caching
```javascript
// Add Redis caching (optional)
import redis from 'redis';
const client = redis.createClient();

// Cache frequently accessed data
app.get('/api/exams', async (req, res) => {
  const cached = await client.get('exams');
  if (cached) return res.json(JSON.parse(cached));
  
  const exams = await Exam.find();
  await client.setEx('exams', 3600, JSON.stringify(exams));
  res.json(exams);
});
```

### 3. Frontend Optimization
- Code splitting (already implemented with Vite)
- Lazy loading routes
- Image optimization
- Minimize bundle size

### 4. Server Optimization
```javascript
// Add compression
import compression from 'compression';
app.use(compression());

// Rate limiting
import rateLimit from 'express-rate-limit';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);
```

---

## Troubleshooting

### Common Issues

**1. MongoDB Connection Failed**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:**
- Check if MongoDB is running: `mongosh`
- Verify MONGODB_URI in .env
- Check firewall settings

**2. Port Already in Use**
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:**
```bash
# Find process using port
netstat -ano | findstr :5000  # Windows
lsof -i :5000  # Linux/Mac

# Kill process
taskkill /PID <PID> /F  # Windows
kill -9 <PID>  # Linux/Mac
```

**3. JWT Authentication Failed**
```
Error: invalid token
```
**Solution:**
- Clear browser localStorage
- Check JWT_SECRET matches
- Verify token expiration

**4. Webcam Not Working**
```
Error: Permission denied
```
**Solution:**
- Enable camera permissions in browser
- Use HTTPS (required for webcam in production)
- Check browser compatibility

**5. Build Errors**
```
Error: Cannot find module
```
**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Security Checklist

### Production Security

- [ ] Change default admin password
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set secure cookie flags
- [ ] Implement input validation
- [ ] Enable helmet.js security headers
- [ ] Regular security updates
- [ ] Database access restrictions
- [ ] Backup encryption
- [ ] Monitor logs for suspicious activity

### Implementation

```javascript
// Add to server/index.js
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);
```

---

## Maintenance

### Regular Tasks

**Daily:**
- Monitor application logs
- Check error rates
- Verify backups completed

**Weekly:**
- Review system performance
- Check disk space
- Update dependencies (if needed)

**Monthly:**
- Security audit
- Database optimization
- Performance review
- Backup testing

### Update Procedure

```bash
# 1. Backup current version
tar -czf exam-backup-$(date +%Y%m%d).tar.gz /path/to/exam

# 2. Pull updates
git pull origin main

# 3. Install dependencies
npm install

# 4. Build frontend
npm run build

# 5. Restart application
pm2 restart exam-api

# 6. Verify
curl http://localhost:5000/api/health
```

---

## Support & Resources

### Documentation
- **ARCHITECTURE.md** - System architecture
- **NEW_FEATURES.md** - New features guide
- **README.md** - Main documentation
- **QUICKSTART.md** - Quick start guide
- **ADMIN_GUIDE.md** - Admin user guide

### Getting Help
1. Check documentation
2. Review error logs
3. Test in development mode
4. Check GitHub issues
5. Contact support team

---

**Version**: 3.0.0  
**Last Updated**: October 16, 2025  
**Status**: Production Ready ✅
