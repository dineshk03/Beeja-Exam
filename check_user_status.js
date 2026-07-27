import('./server/models/User.js').then(({ default: User }) => {
  User.findOne({ email: 'qa@mail.com' }).then(user => {
    if (user) {
      console.log('User found and active:', user.isActive);
      console.log('Permissions:', user.permissions);
    } else {
      console.log('User not found');
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
