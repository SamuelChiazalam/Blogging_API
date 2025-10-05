// This file defines the Blog schema and model for MongoDB

const mongoose = require("mongoose");

// Define the schema (structure) for Blog documents
const blogSchema = new mongoose.Schema({
  // Title of the blog post
  title: {
    type: String,
    required: [true, "Title is required"],
    unique: true, // Each blog must have a unique title
    trim: true,
  },

  // Short description or summary of the blog
  description: {
    type: String,
    trim: true,
  },

  // Reference to the User who created this blog
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Links to User model
    required: true,
  },

  // State of the blog: 'draft' or 'published'
  state: {
    type: String,
    enum: ["draft", "published"], // Only these two values are allowed
    default: "draft", // New blogs start as drafts
  },

  // Number of times this blog has been read
  read_count: {
    type: Number,
    default: 0, // Starts at 0
  },

  // Estimated time to read the blog (in minutes)
  reading_time: {
    type: Number,
    default: 0,
  },

  // Tags for categorizing the blog (array of strings)
  tags: {
    type: [String], // Array of strings
    default: [],
  },

  // Main content of the blog post
  body: {
    type: String,
    required: [true, "Blog body is required"],
  },

  // When the blog was created
  timestamp: {
    type: Date,
    default: Date.now,
  },

  // When the blog was last updated
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// ==================== INDEXES ====================

// Create indexes for better query performance
// Index on author for faster queries like "get all blogs by this author"
blogSchema.index({ author: 1 });

// Index on state for faster filtering by draft/published
blogSchema.index({ state: 1 });

// Text index for searching by title, tags, and description
blogSchema.index({ title: "text", tags: "text", description: "text" });

// ==================== MIDDLEWARE ====================

// Pre-save hook: Update the updatedAt field before saving
blogSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// ==================== METHODS ====================

// Instance method: Increment read count when blog is viewed
blogSchema.methods.incrementReadCount = function () {
  this.read_count += 1;
  return this.save();
};

// ==================== QUERY HELPERS ====================

// Query helper: Find only published blogs
// Usage: Blog.find().published()
blogSchema.query.published = function () {
  return this.where({ state: "published" });
};

// Query helper: Find only draft blogs
// Usage: Blog.find().drafts()
blogSchema.query.drafts = function () {
  return this.where({ state: "draft" });
};

// Create and export the Blog model
module.exports = mongoose.model("Blog", blogSchema);
