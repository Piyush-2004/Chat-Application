import express, { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import userModel from '../models/user.model.js';
import upload from '../middleware/upload.js';
import mysql_db from '../config/db.js';
import { updateUserImage } from '../controllers/userController.js';

const router = Router();

router.get('/', (req, res) => {
  res.send('🚀 User route is working!');
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await userModel.findById(parseInt(id));
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 chars'),
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 chars'),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
        message: 'Invalid Data',
      });
    }

    const { username, email, password } = req.body;

    try {
      const existingUser = await userModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await userModel.createUser({ username, email, password: hashedPassword });

      return res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const user = await userModel.findByUsername(username);
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        image: user.image
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Create test users for nunu and nabin
router.post('/create-test-users', async (req, res) => {
  try {
    const testUsers = [
      { username: 'nunu', email: 'nunu@example.com', password: 'password123' },
      { username: 'nabin', email: 'nabin@example.com', password: 'password123' },
      { username: 'alice', email: 'alice@example.com', password: 'password123' },
      { username: 'bob', email: 'bob@example.com', password: 'password123' }
    ];

    const createdUsers = [];

    for (const user of testUsers) {
      try {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await userModel.createUser({ 
          username: user.username, 
          email: user.email, 
          password: hashedPassword 
        });
        createdUsers.push(user.username);
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
          throw error;
        }
        console.log(`User ${user.username} already exists, skipping...`);
      }
    }

    res.status(201).json({ 
      message: 'Test users created successfully',
      created: createdUsers
    });
  } catch (error) {
    console.error('Error creating test users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// router.post('/user/upload/:id', upload.single('image'), updateUserImage);
router.post('/upload/:id', upload.single('image'), (req, res, next) => {
  console.log("Hit /user/upload/:id");
  next();
}, updateUserImage);

router.put('/password/:id', async (req, res) => {
  const userId = req.params.id;
  const { password } = req.body;

  if (!password) return res.status(400).json({ message: 'Password is required' });

  try {
    const hashed = await bcrypt.hash(password, 10);
    const db = await mysql_db();
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);
    await db.end();
    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error('Password update error:', err);
    res.status(500).json({ message: 'Failed to update password' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { username, email, newPassword } = req.body;

  if (!username || !email || !newPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const user = await userModel.findByUsername(username);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.email !== email) {
      return res.status(400).json({ message: 'Username and email do not match' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    const db = await mysql_db();
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, user.id]);
    await db.end();

    return res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Password reset error:', err);
    return res.status(500).json({ message: 'Server error during password reset' });
  }
});

export default router;
