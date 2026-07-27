import User from '../models/User.js';

// Check if user has specific permission
export const checkPermission = (module, action) => {
  return async (req, res, next) => {
    try {
      console.log(`🔍 Checking permission: ${module}.${action} for user: ${req.user.email}`);
      const user = await User.findById(req.user.id);
      
      if (!user) {
        console.log('❌ User not found in permission check');
        return res.status(401).json({ error: 'User not found' });
      }

      // Super admin (default admin) has all permissions
      if (user.email === 'admin@exam.com') {
        console.log('✅ Super admin access granted');
        return next();
      }

      // Students don't have admin permissions
      if (user.role === 'student') {
        console.log('❌ Student access denied to admin features');
        return res.status(403).json({ error: 'Access denied. Students cannot access admin features.' });
      }

      // Check if user has the required permission
      if (user.permissions && user.permissions[module] && user.permissions[module][action]) {
        console.log(`✅ Permission granted: ${module}.${action}`);
        return next();
      }

      console.log(`❌ Permission denied: ${module}.${action} for user ${user.email}`);
      console.log('User permissions:', user.permissions);
      res.status(403).json({ 
        error: `Access denied. You don't have permission to ${action} ${module}.` 
      });
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

// Check if user can access any admin features
export const requireAnyAdminPermission = async (req, res, next) => {
  try {
    console.log(`🔍 Checking any admin permission for user: ${req.user.email}`);
    const user = await User.findById(req.user.id);
    
    if (!user) {
      console.log('❌ User not found in requireAnyAdminPermission');
      return res.status(401).json({ error: 'User not found' });
    }

    // Super admin has all permissions
    if (user.email === 'admin@exam.com') {
      console.log('✅ Super admin access granted');
      return next();
    }

    // Students cannot access admin features
    if (user.role === 'student') {
      console.log('❌ Student access denied');
      return res.status(403).json({ error: 'Access denied. Students cannot access admin features.' });
    }

    // Check if user has ANY admin permissions
    if (user.permissions && Object.keys(user.permissions).length > 0) {
      // Check if user has at least one permission set to true
      const hasAnyPermission = Object.values(user.permissions).some(module => 
        Object.values(module).some(permission => permission === true)
      );
      
      if (hasAnyPermission) {
        console.log(`✅ Admin access granted for user ${user.email}`);
        return next();
      }
    }

    console.log(`❌ No admin permissions found for user ${user.email}`);
    console.log('User permissions:', user.permissions);
    res.status(403).json({ error: 'Access denied. No admin permissions assigned.' });
  } catch (error) {
    console.error('Admin permission check error:', error);
    res.status(500).json({ error: 'Permission check failed' });
  }
};

// Get user permissions
export const getUserPermissions = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('permissions role email');
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Super admin has all permissions
    if (user.email === 'admin@exam.com') {
      const allPermissions = {
        userManagement: { create: true, read: true, update: true, delete: true },
        examManagement: { create: true, read: true, update: true, delete: true },
        questionManagement: { create: true, read: true, update: true, delete: true },
        scheduling: { create: true, read: true, update: true, delete: true },
        reports: { read: true, export: true },
        analytics: { read: true, dashboard: true },
        systemSettings: { read: true, update: true }
      };
      return res.json({ role: user.role, permissions: allPermissions });
    }

    res.json({ role: user.role, permissions: user.permissions });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ error: 'Failed to get permissions' });
  }
};
