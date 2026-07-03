import jwt from 'jsonwebtoken';
import User from '../models/user.js';

// Helper to generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretkey', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/signup
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'User',
      profileImage: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      accessToken: generateToken(user._id),
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide an email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    res.status(200).json({
      success: true,
      accessToken: generateToken(user._id),
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user profile
// @route   GET /api/profile
// @access  Private
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (SuperAdmin only)
// @route   GET /api/users
// @access  Private/SuperAdmin
export const getAllUsers = async (req, res, next) => {
  try {
    if (req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ success: false, error: 'Access denied. SuperAdmin only' });
    }

    const users = await User.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Give user second chance to retake exam
// @route   POST /api/users/:id/second-chance
// @access  Private/SuperAdmin
export const giveSecondChance = async (req, res, next) => {
  try {
    if (req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ success: false, error: 'Access denied. SuperAdmin only' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.retakeAllowed = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Second chance granted to ${user.name}`,
      user
    });
  } catch (error) {
    next(error);
  }
};
