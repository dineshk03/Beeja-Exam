import ActivityLog from '../models/ActivityLog.js';

export const logActivity = async (userId, action, entity = null, entityId = null, details = {}, req = null) => {
  try {
    const log = new ActivityLog({
      user: userId,
      action,
      entity,
      entityId,
      details,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.headers?.['user-agent'],
    });
    
    await log.save();
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

export default logActivity;
