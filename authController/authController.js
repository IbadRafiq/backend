const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
};

// Signup
exports.signup = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Signup request:', { email });

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const user = new User({ email, password, role: 'admin' });
    await user.save();

    const token = generateToken(user);
    res.status(201).json({ message: '✅ Admin registered successfully!', token });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: `❌ Failed to register admin: ${err.message}` });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login request:', { email });

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    res.status(200).json({ message: '✅ Login successful!', token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: `❌ Failed to login: ${err.message}` });
  }
};