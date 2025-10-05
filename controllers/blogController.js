// This file contains all blog-related controller functions

const Blog = require('../models/Blog');
const calculateReadingTime = require('../utils/calculateReadingTime');
const logger = require('../utils/logger');

// ==================== CREATE BLOG ====================

/**
 * Create a new blog post
 * POST /api/blogs
 * Requires authentication
 * 
 * Required body:
 * - title
 * - body
 * 
 * Optional body:
 * - description
 * - tags (array of strings)
 */
exports.createBlog = async (req, res, next) => {
  try {
    // Get data from request body
    const { title, description, tags, body } = req.body;
    
    // Validate required fields
    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Title and body are required'
      });
    }
    
    // Calculate reading time based on blog body
    const reading_time = calculateReadingTime(body);
    
    // Create new blog
    const blog = new Blog({
      title,
      description,
      tags: tags || [],
      body,
      author: req.user._id, // Get author from authenticated user
      reading_time,
      state: 'draft' // New blogs start as draft
    });
    
    // Save blog to database
    await blog.save();
    
    // Populate author information
    await blog.populate('author', 'first_name last_name email');
    
    // Log successful creation
    logger.info('Blog created', { 
      blogId: blog._id, 
      authorId: req.user._id,
      title: blog.title 
    });
    
    // Send success response
    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: {
        blog
      }
    });
    
  } catch (error) {
    logger.error('Create blog error', error);
    next(error);
  }
};

// ==================== GET ALL PUBLISHED BLOGS ====================

/**
 * Get list of all published blogs
 * GET /api/blogs
 * No authentication required
 * 
 * Query parameters:
 * - page (default: 1)
 * - limit (default: 20)
 * - search (search in title, author, tags)
 * - orderBy (read_count, reading_time, timestamp - default: timestamp)
 * - order (asc, desc - default: desc)
 */
exports.getAllPublishedBlogs = async (req, res, next) => {
  try {
    // Get query parameters with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const orderBy = req.query.orderBy || 'timestamp';
    const order = req.query.order === 'asc' ? 1 : -1;
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Build query - only published blogs
    let query = { state: 'published' };
    
    // Add search if provided
    // Search in title, tags, and author name
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } }, // Case-insensitive search
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort object
    let sort = {};
    sort[orderBy] = order;
    
    // Execute query with pagination and sorting
    const blogs = await Blog.find(query)
      .populate('author', 'first_name last_name email') // Include author info
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination info
    const totalBlogs = await Blog.countDocuments(query);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalBlogs / limit);
    
    // Log request
    logger.info('Get all published blogs', { page, limit, search });
    
    // Send success response
    res.status(200).json({
      success: true,
      data: {
        blogs,
        pagination: {
          currentPage: page,
          totalPages,
          totalBlogs,
          limit
        }
      }
    });
    
  } catch (error) {
    logger.error('Get all published blogs error', error);
    next(error);
  }
};

// ==================== GET SINGLE BLOG ====================

/**
 * Get a single published blog by ID
 * GET /api/blogs/:id
 * No authentication required
 * 
 * Increments read_count by 1
 */
exports.getBlogById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find blog by ID
    // Only return if state is 'published'
    const blog = await Blog.findOne({ _id: id, state: 'published' })
      .populate('author', 'first_name last_name email');
    
    // Check if blog exists
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Increment read count
    await blog.incrementReadCount();
    
    // Log blog view
    logger.info('Blog viewed', { blogId: blog._id, title: blog.title });
    
    // Send success response
    res.status(200).json({
      success: true,
      data: {
        blog
      }
    });
    
  } catch (error) {
    logger.error('Get blog by ID error', error);
    next(error);
  }
};

// ==================== GET USER'S BLOGS ====================

/**
 * Get all blogs created by the logged-in user
 * GET /api/blogs/user/me
 * Requires authentication
 * 
 * Query parameters:
 * - page (default: 1)
 * - limit (default: 20)
 * - state (draft, published - optional filter)
 */
exports.getUserBlogs = async (req, res, next) => {
  try {
    // Get query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const state = req.query.state; // Optional filter by state
    
    // Calculate skip
    const skip = (page - 1) * limit;
    
    // Build query - blogs by this user
    let query = { author: req.user._id };
    
    // Add state filter if provided
    if (state && ['draft', 'published'].includes(state)) {
      query.state = state;
    }
    
    // Execute query
    const blogs = await Blog.find(query)
      .sort({ timestamp: -1 }) // Most recent first
      .skip(skip)
      .limit(limit);
    
    // Get total count
    const totalBlogs = await Blog.countDocuments(query);
    const totalPages = Math.ceil(totalBlogs / limit);
    
    // Log request
    logger.info('Get user blogs', { 
      userId: req.user._id, 
      page, 
      state 
    });
    
    // Send success response
    res.status(200).json({
      success: true,
      data: {
        blogs,
        pagination: {
          currentPage: page,
          totalPages,
          totalBlogs,
          limit
        }
      }
    });
    
  } catch (error) {
    logger.error('Get user blogs error', error);
    next(error);
  }
};

// ==================== UPDATE BLOG ====================

/**
 * Update a blog (title, body, description, tags, or state)
 * PATCH /api/blogs/:id
 * Requires authentication
 * Only the blog owner can update
 */
exports.updateBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, tags, body, state } = req.body;
    
    // Find blog
    const blog = await Blog.findById(id);
    
    // Check if blog exists
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Check if user is the owner of the blog
    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this blog'
      });
    }
    
    // Update fields if provided
    if (title) blog.title = title;
    if (description !== undefined) blog.description = description;
    if (tags) blog.tags = tags;
    if (body) {
      blog.body = body;
      // Recalculate reading time if body changes
      blog.reading_time = calculateReadingTime(body);
    }
    
    // Update state if provided and valid
    if (state && ['draft', 'published'].includes(state)) {
      blog.state = state;
    }
    
    // Save updated blog
    await blog.save();
    
    // Populate author info
    await blog.populate('author', 'first_name last_name email');
    
    // Log update
    logger.info('Blog updated', { 
      blogId: blog._id, 
      userId: req.user._id 
    });
    
    // Send success response
    res.status(200).json({
      success: true,
      message: 'Blog updated successfully',
      data: {
        blog
      }
    });
    
  } catch (error) {
    logger.error('Update blog error', error);
    next(error);
  }
};

// ==================== DELETE BLOG ====================

/**
 * Delete a blog
 * DELETE /api/blogs/:id
 * Requires authentication
 * Only the blog owner can delete
 */
exports.deleteBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find blog
    const blog = await Blog.findById(id);
    
    // Check if blog exists
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Check if user is the owner
    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this blog'
      });
    }
    
    // Delete the blog
    await Blog.findByIdAndDelete(id);
    
    // Log deletion
    logger.info('Blog deleted', { 
      blogId: id, 
      userId: req.user._id 
    });
    
    // Send success response
    res.status(200).json({
      success: true,
      message: 'Blog deleted successfully'
    });
    
  } catch (error) {
    logger.error('Delete blog error', error);
    next(error);
  }
};