// This file contains the global error handling middleware

const logger = require("../utils/logger");

/**
 * Global error handler middleware
 * Catches all errors from routes and sends appropriate response
 *
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  // Log the error for debugging
  logger.error("Global error handler", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Default error status code and message
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // ==================== HANDLE SPECIFIC ERROR TYPES ====================

  // MongoDB Validation Error (e.g., missing required fields)
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // MongoDB Duplicate Key Error (e.g., email or title already exists)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyPattern)[0];
    message = `${field} already exists`;
  }

  // MongoDB Cast Error (e.g., invalid ObjectId format)
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  }

  // JWT Errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // ==================== SEND ERROR RESPONSE ====================

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    // Include stack trace only in development mode
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// Export the error handler
module.exports = errorHandler;
