// This file contains logging functionality for the application

const fs = require("fs");
const path = require("path");

// ==================== SETUP ====================

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "..", "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Path to log file
const logFile = path.join(logsDir, "app.log");

// ==================== HELPER FUNCTIONS ====================

/**
 * Format log message with timestamp and level
 *
 * @param {String} level - Log level (INFO, WARN, ERROR)
 * @param {String} message - Log message
 * @param {Object} data - Additional data to log
 * @returns {String} - Formatted log message
 */
const formatLog = (level, message, data = {}) => {
  // Get current timestamp in ISO format
  const timestamp = new Date().toISOString();

  // Convert data object to JSON string if not empty
  const logData = Object.keys(data).length > 0 ? JSON.stringify(data) : "";

  // Return formatted log message
  return `[${timestamp}] [${level}] ${message} ${logData}\n`;
};

/**
 * Write log message to file
 *
 * @param {String} level - Log level
 * @param {String} message - Log message
 * @param {Object} data - Additional data
 */
const writeLog = (level, message, data) => {
  // Format the log message
  const logMessage = formatLog(level, message, data);

  // Write to log file (append mode)
  fs.appendFile(logFile, logMessage, (err) => {
    if (err) {
      console.error("Error writing to log file:", err);
    }
  });

  // Also log to console for development
  if (process.env.NODE_ENV === "development") {
    console.log(logMessage.trim());
  }
};

// ==================== LOGGER OBJECT ====================

/**
 * Logger object with methods for different log levels
 */
const logger = {
  /**
   * Log informational messages
   * Use for: Normal application flow, successful operations
   *
   * @param {String} message - Log message
   * @param {Object} data - Additional data to log
   */
  info: (message, data = {}) => {
    writeLog("INFO", message, data);
  },

  /**
   * Log warning messages
   * Use for: Potentially harmful situations, deprecated features
   *
   * @param {String} message - Log message
   * @param {Object} data - Additional data to log
   */
  warn: (message, data = {}) => {
    writeLog("WARN", message, data);
  },

  /**
   * Log error messages
   * Use for: Error conditions, exceptions
   *
   * @param {String} message - Log message
   * @param {Object|Error} error - Error object or additional data
   */
  error: (message, error = {}) => {
    // If error is an Error object, extract message and stack
    const errorData =
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
          }
        : error;

    writeLog("ERROR", message, errorData);
  },
};

// Export the logger object
module.exports = logger;
