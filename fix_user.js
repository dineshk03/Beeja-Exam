import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/exam-module')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define User schema (simplified version)
const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  password: String,
  role: String,
  isActive: Boolean,
  permissions: Object
});

const User = mongoose.model('User', userSchema);

async function checkAndFixUser() {
  try {
    console.log('Checking for user: qa@mail.com');
    
    // Check if user exists
    let user = await User.findOne({ email: 'qa@mail.com' });
    
    if (!user) {
      console.log('User not found. Creating user...');
      
      // Create the user with a default password
      const hashedPassword = await bcrypt.hash('password', 10);
      user = new User({
        email: 'qa@mail.com',
        name: 'QA User',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        permissions: {
          questionManagement: {
            create: true,
            read: true,
            update: true,
            delete: true
          }
        }
      });
      
      await user.save();
      console.log('✅ User created successfully!');
      console.log('Email: qa@mail.com');
      console.log('Password: password');
    } else {
      console.log('User found:', {
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        permissions: user.permissions
      });
      
      // Reset password if needed
      const hashedPassword = await bcrypt.hash('password', 10);
      user.password = hashedPassword;
      user.isActive = true;
      await user.save();
      console.log('✅ Password reset to: password');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkAndFixUser();
