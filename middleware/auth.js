// This file contains middleware for JWT authentication

const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ==================== AUTHENTICATION MIDDLEWARE ====================

/**
 * Middleware to verify JWT token and authenticate user
 * This protects routes that require a logged-in user
 *
 * How it works:
 * 1. Extracts token from Authorization header
 * 2. Verifies the token using JWT_SECRET
 * 3. Finds the user from the token payload
 * 4. Attaches user to request object (req.user)
 * 5. Allows request to proceed to the next middleware/route
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    // Format: "Bearer <token>"
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.split(" ")[1];

    // Check if token exists after "Bearer"
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Invalid token format.",
      });
    }

    // Verify token using JWT_SECRET from environment variables
    // This will throw an error if token is invalid or expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by ID from token payload
    // Select only necessary fields, exclude password
    const user = await User.findById(decoded.userId).select("-password");

    // Check if user still exists (might have been deleted)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found. Token invalid.",
      });
    }

    // Attach user to request object
    // Now any route using this middleware can access req.user
    req.user = user;

    // Continue to next middleware or route handler
    next();
  } catch (error) {
    // Handle different JWT errors
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }

    // Generic error
    return res.status(500).json({
      success: false,
      message: "Authentication failed.",
      error: error.message,
    });
  }
};

// ==================== OPTIONAL AUTHENTICATION MIDDLEWARE ====================

/**
 * Middleware for routes that work for both logged-in and logged-out users
 * If token is present and valid, attaches user to req.user
 * If no token or invalid token, continues without user
 *
 * Used for routes like "get all published blogs" where login is optional
 */
const optionalAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    // If no token, continue without authentication
    if (!authHeader) {
      req.user = null;
      return next();
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    // If no token after "Bearer", continue without authentication
    if (!token) {
      req.user = null;
      return next();
    }

    // Try to verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.userId).select("-password");

    // Attach user if found, otherwise null
    req.user = user || null;

    next();
  } catch (error) {
    // If token verification fails, continue without user
    // Don't send error response, just continue
    req.user = null;
    next();
  }
};

// Export both middleware functions
module.exports = {
  authenticate,
  optionalAuth,
};
