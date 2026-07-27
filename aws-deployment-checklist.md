# AWS Deployment Checklist - Exam Portal

## ✅ Pre-Deployment Verification

### Environment Configuration
- [x] **Environment Variables**: `.env.production` configured with production values
- [x] **Database URI**: MongoDB/DocumentDB connection string ready
- [x] **JWT Secret**: Strong JWT secret key generated
- [x] **CORS Origins**: Production domain(s) configured
- [x] **File Upload Path**: Configurable upload directory for AWS EFS

### Application Configuration
- [x] **Production Scripts**: Added `start`, `build:prod`, `deploy` scripts
- [x] **CORS Configuration**: Production-ready CORS settings
- [x] **Static File Serving**: Configurable paths for AWS deployment
- [x] **Health Check Endpoint**: `/api/health` endpoint available
- [x] **PM2 Configuration**: `ecosystem.config.js` for process management

### Docker Configuration
- [x] **Dockerfile**: Multi-stage build optimized for production
- [x] **Docker Compose**: Complete stack with MongoDB and Nginx
- [x] **Health Checks**: Container health monitoring configured
- [x] **Security**: Non-root user and proper permissions

## 🔧 Critical Configuration Items

### 1. Environment Variables (Update these in AWS)
```bash
# Database
MONGODB_URI=mongodb://admin:password@docdb-cluster.amazonaws.com:27017/exam-module?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false

# Security
JWT_SECRET=your-super-secure-jwt-secret-key-change-this-in-production

# Application
NODE_ENV=production
PORT=5000
UPLOAD_PATH=/mnt/efs/uploads  # For AWS EFS

# CORS
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

### 2. Database Configuration
- **Connection**: Update `MONGODB_URI` for AWS DocumentDB
- **SSL**: DocumentDB requires SSL connections
- **Authentication**: Use AWS Secrets Manager for credentials
- **Indexes**: Ensure all required indexes are created

### 3. File Storage
- **Upload Directory**: Configure `UPLOAD_PATH` for AWS EFS mount
- **Static Files**: Ensure `/uploads` route serves from correct path
- **Permissions**: EFS mount permissions for certificate uploads

### 4. Security Settings
- **CORS Origins**: Update with your actual domain names
- **JWT Secret**: Use AWS Secrets Manager
- **Rate Limiting**: Configure for production load
- **HTTPS**: Ensure SSL/TLS termination at load balancer

## 🚀 Deployment Steps

### Step 1: Build and Test Locally
```bash
# Build production version
npm run build:prod

# Test production build
npm run start
```

### Step 2: Docker Build and Test
```bash
# Build Docker image
docker build -t exam-portal .

# Test Docker container
docker run -p 5000:5000 --env-file .env.production exam-portal
```

### Step 3: AWS ECR Push
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag and push image
docker tag exam-portal:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/exam-portal:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/exam-portal:latest
```

### Step 4: AWS Infrastructure Setup
1. **VPC and Subnets**: Create VPC with public/private subnets
2. **Security Groups**: Configure for ECS, DocumentDB, and ALB
3. **DocumentDB Cluster**: Set up MongoDB-compatible database
4. **EFS**: Create file system for uploads
5. **Secrets Manager**: Store database credentials and JWT secret
6. **ECR Repository**: Create container registry
7. **ECS Cluster**: Set up Fargate cluster
8. **Application Load Balancer**: Configure with SSL certificate

### Step 5: ECS Service Deployment
1. **Task Definition**: Create with environment variables and secrets
2. **Service**: Deploy with desired capacity and health checks
3. **Auto Scaling**: Configure based on CPU/memory usage
4. **Monitoring**: Set up CloudWatch logs and alarms

## 🔍 Post-Deployment Verification

### Health Checks
- [ ] **API Health**: `https://yourdomain.com/api/health` returns 200
- [ ] **Database Connection**: MongoDB connection successful
- [ ] **File Uploads**: Certificate upload functionality works
- [ ] **Authentication**: Login/logout functionality works
- [ ] **Scheduling**: Live exam scheduling works correctly

### Performance Tests
- [ ] **Load Testing**: Test with expected concurrent users
- [ ] **Database Performance**: Query response times acceptable
- [ ] **File Upload Performance**: Large file uploads work
- [ ] **Memory Usage**: Monitor container memory consumption

### Security Verification
- [ ] **HTTPS**: All traffic encrypted
- [ ] **CORS**: Only allowed origins can access API
- [ ] **Authentication**: JWT tokens properly validated
- [ ] **File Security**: Upload directory properly secured

## 🚨 Common Issues and Solutions

### Database Connection Issues
- Check DocumentDB security group allows ECS access
- Verify SSL certificate bundle is available
- Ensure connection string includes all required parameters

### File Upload Issues
- Verify EFS mount is properly configured
- Check file permissions on upload directory
- Ensure sufficient EFS storage provisioned

### Performance Issues
- Monitor ECS task CPU/memory usage
- Check DocumentDB performance insights
- Verify ALB target group health checks

### SSL/HTTPS Issues
- Ensure SSL certificate is valid and not expired
- Check ALB listener configuration
- Verify security group allows HTTPS traffic

## 📊 Monitoring and Maintenance

### CloudWatch Metrics to Monitor
- ECS task CPU and memory utilization
- DocumentDB connections and query performance
- ALB request count and response times
- EFS throughput and IOPS

### Log Monitoring
- Application logs in CloudWatch Logs
- ECS task logs for errors and warnings
- ALB access logs for traffic patterns

### Regular Maintenance
- Update container images with security patches
- Monitor and rotate JWT secrets
- Review and update security groups
- Backup DocumentDB data regularly

## 📞 Support and Troubleshooting

### Debug Commands
```bash
# Check ECS service status
aws ecs describe-services --cluster exam-cluster --services exam-service

# View CloudWatch logs
aws logs tail /ecs/exam-portal --follow

# Check DocumentDB status
aws docdb describe-db-clusters --db-cluster-identifier exam-docdb-cluster
```

### Key Metrics Dashboard
Create CloudWatch dashboard monitoring:
- Application response times
- Database connection pool
- File upload success rates
- User authentication rates
- Exam session metrics

---

**Note**: Replace placeholder values (domain names, account IDs, etc.) with your actual production values before deployment.
