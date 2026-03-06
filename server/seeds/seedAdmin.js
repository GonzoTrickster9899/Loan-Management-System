const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const { ROLES } = require('../config/roles');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existingAdmin = await User.findOne({ role: ROLES.ADMIN });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      process.exit(0);
    }

    const admin = await User.create({
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@loanmanagement.com',
      password: 'Admin@1234',
      role: ROLES.ADMIN,
      isEmailVerified: true,
      isActive: true,
    });

    console.log('✅ Admin user created successfully!');
    console.log('   Email:', admin.email);
    console.log('   Password: Admin@1234');
    console.log('   ⚠️  Change the default password after first login!');

    // Create demo users
    const demoUsers = [
      {
        firstName: 'John',
        lastName: 'Officer',
        email: 'officer@loanmanagement.com',
        password: 'Officer@1234',
        role: ROLES.LOAN_OFFICER,
        isEmailVerified: true,
      },
      {
        firstName: 'Jane',
        lastName: 'Manager',
        email: 'manager@loanmanagement.com',
        password: 'Manager@1234',
        role: ROLES.MANAGER,
        isEmailVerified: true,
      },
      {
        firstName: 'Bob',
        lastName: 'Customer',
        email: 'customer@loanmanagement.com',
        password: 'Customer@1234',
        role: ROLES.CUSTOMER,
        isEmailVerified: true,
      },
    ];

    for (const userData of demoUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (!existing) {
        await User.create(userData);
        console.log(`✅ Created demo user: ${userData.email} (${userData.role})`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedAdmin();
