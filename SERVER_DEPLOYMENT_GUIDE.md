# TCS iON Exam System - Server Deployment Guide

## 🚀 Deploy to Server: 54.91.136.135

This guide will help you deploy your TCS iON exam system to your server using Docker.

## 📋 Prerequisites

### Local Machine
- **Docker Desktop** installed and running
- **Node.js** and npm installed
- **SSH access** to your server
- **PowerShell** (Windows) or **Bash** (Linux/Mac)

### Server Requirements (54.91.136.135)
- **Ubuntu 20.04+** or similar Linux distribution
- **2GB+ RAM** (4GB recommended)
- **20GB+ disk space**
- **SSH access** with sudo privileges
- **Ports 80 and 443** open for web traffic

## 🚀 Quick Deployment

### Option 1: Automated Deployment (Recommended)

```powershell
# Navigate to your project directory
cd d:\Exam

# Deploy to server (replace with your SSH key path if needed)
.\deploy-to-server.ps1 -Action deploy -ServerIP 54.91.136.135 -Username ubuntu
```

### Option 2: Manual Deployment

#### Step 1: Build the Application
```bash
# Build frontend
npm run build

# Build Docker image
docker build -t exam-system:latest .
```

#### Step 2: Upload Files to Server
```bash
# Copy files to server
scp docker-compose.prod.yml ubuntu@54.91.136.135:/tmp/
scp -r nginx ubuntu@54.91.136.135:/tmp/
```

#### Step 3: Setup on Server
```bash
# SSH into server
ssh ubuntu@54.91.136.135

# Install Docker (if not installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
sudo mkdir -p /opt/exam-system
cd /opt/exam-system

# Copy files
sudo cp /tmp/docker-compose.prod.yml ./docker-compose.yml
sudo cp -r /tmp/nginx ./

# Start the application
sudo docker-compose up -d
```

## 🌐 Access Your Application

After successful deployment:

- **Frontend URL**: `http://54.91.136.135`
- **API Base URL**: `http://54.91.136.135/api`
- **Health Check**: `http://54.91.136.135/api/health`

## 🔧 Configuration Details

### Docker Compose Configuration
The production setup includes:
- **MongoDB**: Database with authentication
- **Exam App**: Node.js application container
- **Nginx**: Reverse proxy with rate limiting

### Security Features
- **Rate limiting**: API and login endpoints protected
- **Security headers**: XSS, CSRF, and other protections
- **Internal networking**: Database not exposed publicly
- **Authentication**: MongoDB with username/password

### Default Credentials
```
MongoDB:
- Username: admin
- Password: ExamSystem2024!

JWT Secret: ExamSystem2024SuperSecretJWTKey!ChangeThis
```

**⚠️ IMPORTANT: Change these credentials before production use!**

## 🛠️ Management Commands

### Using the Deployment Script

```powershell
# Check application status
.\deploy-to-server.ps1 -Action status

# View application logs
.\deploy-to-server.ps1 -Action logs

# Update application
.\deploy-to-server.ps1 -Action update

# Stop application
.\deploy-to-server.ps1 -Action stop
```

### Manual Server Commands

```bash
# SSH into server
ssh ubuntu@54.91.136.135

# Navigate to application directory
cd /opt/exam-system

# Check container status
sudo docker-compose ps

# View logs
sudo docker-compose logs -f

# Restart services
sudo docker-compose restart

# Stop all services
sudo docker-compose down

# Update and restart
sudo docker-compose pull
sudo docker-compose up -d
```

## 📊 Monitoring and Logs

### Application Logs
```bash
# View all logs
sudo docker-compose logs

# View specific service logs
sudo docker-compose logs exam-app-prod
sudo docker-compose logs nginx
sudo docker-compose logs mongodb

# Follow logs in real-time
sudo docker-compose logs -f --tail=100
```

### System Monitoring
```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check Docker stats
sudo docker stats

# Check network connections
sudo netstat -tlnp | grep :80
```

## 🔒 Security Recommendations

### 1. Change Default Passwords
Edit `docker-compose.prod.yml` and update:
- MongoDB password
- JWT secret

### 2. Enable Firewall
```bash
# Install UFW
sudo apt install ufw

# Allow SSH
sudo ufw allow ssh

# Allow HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Enable firewall
sudo ufw enable
```

### 3. SSL Certificate (Optional)
```bash
# Install Certbot
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d your-domain.com

# Update nginx configuration to use SSL
# Uncomment HTTPS server block in nginx/nginx.conf
```

### 4. Regular Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Update Docker images
sudo docker-compose pull
sudo docker-compose up -d
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Application Not Starting
```bash
# Check container logs
sudo docker-compose logs exam-app-prod

# Check if ports are available
sudo netstat -tlnp | grep :5000
```

#### 2. Database Connection Issues
```bash
# Check MongoDB logs
sudo docker-compose logs mongodb

# Verify MongoDB is running
sudo docker-compose exec mongodb mongo --eval "db.adminCommand('ismaster')"
```

#### 3. Nginx Issues
```bash
# Check Nginx configuration
sudo docker-compose exec nginx nginx -t

# Reload Nginx configuration
sudo docker-compose exec nginx nginx -s reload
```

#### 4. Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER /opt/exam-system
sudo chmod -R 755 /opt/exam-system
```

### Health Checks

```bash
# Test application health
curl http://54.91.136.135/api/health

# Test database connection
sudo docker-compose exec exam-app-prod node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('DB Connected'))
  .catch(err => console.error('DB Error:', err));
"
```

## 📈 Performance Optimization

### 1. Resource Limits
Edit `docker-compose.prod.yml` to add resource limits:
```yaml
exam-app:
  deploy:
    resources:
      limits:
        cpus: '1.0'
        memory: 1G
      reservations:
        cpus: '0.5'
        memory: 512M
```

### 2. Database Optimization
```bash
# MongoDB performance tuning
sudo docker-compose exec mongodb mongo admin --eval "
db.runCommand({setParameter: 1, internalQueryExecMaxBlockingSortBytes: 335544320})
"
```

### 3. Nginx Caching
Add to nginx configuration:
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🔄 Backup and Recovery

### Database Backup
```bash
# Create backup
sudo docker-compose exec mongodb mongodump --uri="mongodb://admin:ExamSystem2024!@localhost:27017/exam-module?authSource=admin" --out=/data/backup

# Copy backup from container
sudo docker cp exam-mongodb-prod:/data/backup ./backup-$(date +%Y%m%d)
```

### Application Backup
```bash
# Backup entire application
sudo tar -czf exam-system-backup-$(date +%Y%m%d).tar.gz /opt/exam-system
```

## 📞 Support

### Getting Help
1. Check application logs: `sudo docker-compose logs`
2. Verify system resources: `htop` or `free -h`
3. Check network connectivity: `curl http://localhost:5000/api/health`
4. Review this documentation for common solutions

### Useful Commands Reference
```bash
# Quick status check
sudo docker-compose ps && curl -s http://localhost/api/health

# Quick restart
sudo docker-compose restart exam-app-prod

# Emergency stop
sudo docker-compose down

# Clean restart
sudo docker-compose down && sudo docker-compose up -d
```

---

## 🎉 Success!

Your TCS iON Exam System should now be live at:
**http://54.91.136.135**

The system includes all features:
- ✅ Student and Admin interfaces
- ✅ Exam management and scheduling
- ✅ Proctoring capabilities
- ✅ Analytics and reporting
- ✅ Question bank management
- ✅ Batch management
- ✅ Real-time monitoring

**Remember to change default passwords and configure SSL for production use!**
