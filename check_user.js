import('./server/models/User.js').then(({ default: User }) => {
  User.findOne({ email: 'qa@mail.com' }).then(user => {
    if (user) {
      console.log('User found:', {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        permissions: user.permissions
      });
    } else {
      console.log('User not found in database');
    }
    process.exit(0);
  }).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}).catch(err => {
  console.error('Import error:', err.message);
  process.exit(1);
});
