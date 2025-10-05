// This is the main entry point of our blogging API application

// Import required packages
const express = require("express"); // Web framework for Node.js
const mongoose = require("mongoose"); // MongoDB object modeling
const cors = require("cors"); // Enable Cross-Origin Resource Sharing
require("dotenv").config(); // Load environment variables from .env file

// Import routes
const authRoutes = require("./routes/auth");
const blogRoutes = require("./routes/blogs");

// Import middleware
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");

// Create Express application
const app = express();

// Define port from environment variable or default to 5000
const PORT = process.env.PORT || 7000;

// ==================== MIDDLEWARE ====================

// Enable CORS - allows frontend from different domains to access our API
app.use(cors());

// Parse JSON request bodies - allows us to read req.body as JSON
app.use(express.json());

// Parse URL-encoded request bodies - for form data
app.use(express.urlencoded({ extended: true }));

// Log all incoming requests (custom middleware)
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ==================== DATABASE CONNECTION ====================

// Connect to MongoDB using connection string from .env file
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info("Connected to MongoDB successfully");
    console.log("✅ Connected to MongoDB");
  })
  .catch((err) => {
    logger.error("MongoDB connection error", err);
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1); // Exit if database connection fails
  });

// ==================== ROUTES ====================

// Root endpoint - welcome message
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Blogging API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      blogs: "/api/blogs",
    },
  });
});

// Mount authentication routes at /api/auth
// This includes signup, login, etc.
app.use("/api/auth", authRoutes);

// Mount blog routes at /api/blogs
// This includes create, read, update, delete blogs
app.use("/api/blogs", blogRoutes);

// ==================== ERROR HANDLING ====================

// Handle 404 - route not found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler - catches all errors from routes
app.use(errorHandler);

// ==================== START SERVER ====================

// Start listening for requests
app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
});

// Export app for testing purposes
module.exports = app;
