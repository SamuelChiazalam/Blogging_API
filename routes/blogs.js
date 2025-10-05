// This file defines all blog-related routes

const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blogController");
const { authenticate, optionalAuth } = require("../middleware/auth");

// ==================== PUBLIC ROUTES ====================
// These routes don't require authentication

/**
 * @route   GET /api/blogs
 * @desc    Get all published blogs with pagination, search, and ordering
 * @access  Public
 * @query   page, limit, search, orderBy, order
 */
router.get("/", blogController.getAllPublishedBlogs);

// ==================== PROTECTED ROUTES ====================
// These routes require authentication (JWT token)

/**
 * @route   POST /api/blogs
 * @desc    Create a new blog (starts as draft)
 * @access  Private (requires authentication)
 */
router.post("/", authenticate, blogController.createBlog);

/**
 * @route   GET /api/blogs/user/me
 * @desc    Get all blogs by logged-in user (with pagination and state filter)
 * @access  Private (requires authentication)
 * @query   page, limit, state
 *
 * IMPORTANT: This route must come BEFORE /:id route
 * Otherwise Express will treat "user" as an ID parameter
 */
router.get("/user/me", authenticate, blogController.getUserBlogs);

/**
 * @route   GET /api/blogs/:id
 * @desc    Get a single published blog by ID (increments read_count)
 * @access  Public
 */
router.get("/:id", blogController.getBlogById);

/**
 * @route   PATCH /api/blogs/:id
 * @desc    Update a blog (only by owner)
 * @access  Private (requires authentication)
 */
router.patch("/:id", authenticate, blogController.updateBlog);

/**
 * @route   DELETE /api/blogs/:id
 * @desc    Delete a blog (only by owner)
 * @access  Private (requires authentication)
 */
router.delete("/:id", authenticate, blogController.deleteBlog);

// Export the router
module.exports = router;
