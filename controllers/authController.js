// This file contains all authentication-related controller functions

const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const logger = require("../utils/logger");

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate JWT token for a user
 * Token expires after 1 hour as required
 *
 * @param {String} userId - User's MongoDB _id
 * @returns {String} - JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, // Payload - data stored in token
    process.env.JWT_SECRET, // Secret key from environment variables
    { expiresIn: "1h" } // Token expires in 1 hour
  );
};

// ==================== SIGNUP CONTROLLER ====================

/**
 * Register a new user
 * POST /api/auth/signup
 *
 * Required body:
 * - first_name
 * - last_name
 * - email
 * - password
 */
exports.signup = async (req, res, next) => {
  try {
    // Get data from request body
    const { first_name, last_name, email, password } = req.body;

    // Validate input
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check if email is valid format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email",
      });
    }

    // Check if password meets minimum length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Create new user
    const user = new User({
      first_name,
      last_name,
      email: email.toLowerCase(),
      password, // Will be hashed automatically by pre-save hook
    });

    // Save user to database
    await user.save();

    // Generate JWT token for the new user
    const token = generateToken(user._id);

    // Log successful signup
    logger.info("User registered successfully", {
      userId: user._id,
      email: user.email,
    });

    // Send success response
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: user.toJSON(), // Remove sensitive data like password
        token,
      },
    });
  } catch (error) {
    // Log error
    logger.error("Signup error", error);

    // Pass error to global error handler
    next(error);
  }
};

// ==================== LOGIN CONTROLLER ====================

/**
 * Login existing user
 * POST /api/auth/login
 *
 * Required body:
 * - email
 * - password
 */
exports.login = async (req, res, next) => {
  try {
    // Get credentials from request body
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Compare provided password with stored hashed password
    const isMatch = await user.comparePassword(password);

    // Check if password matches
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Log successful login
    logger.info("User logged in successfully", {
      userId: user._id,
      email: user.email,
    });

    // Send success response
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    // Log error
    logger.error("Login error", error);

    // Pass error to global error handler
    next(error);
  }
};

// ==================== GET CURRENT USER CONTROLLER ====================

/**
 * Get currently logged in user's information
 * GET /api/auth/me
 *
 * Requires authentication (JWT token in header)
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    // req.user is set by authenticate middleware
    // It contains the user object without password

    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    logger.error("Get current user error", error);
    next(error);
  }
};
