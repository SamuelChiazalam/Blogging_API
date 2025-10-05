// This file defines the User schema and model for MongoDB

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Define the schema (structure) for User documents
const userSchema = new mongoose.Schema({
  // First name of the user
  first_name: {
    type: String,
    required: [true, "First name is required"],
    trim: true, // Remove whitespace from both ends
  },

  // Last name of the user
  last_name: {
    type: String,
    required: [true, "Last name is required"],
    trim: true,
  },

  // Email address - must be unique across all users
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true, // No two users can have the same email
    lowercase: true, // Convert to lowercase before saving
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"], // Email format validation
  },

  // Password - will be hashed before saving
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"],
  },

  // Timestamp when user was created
  createdAt: {
    type: Date,
    default: Date.now, // Automatically set to current date/time
  },
});

// ==================== MIDDLEWARE ====================

// Pre-save hook: Hash password before saving to database
// This runs automatically before a user document is saved
userSchema.pre("save", async function (next) {
  // Only hash password if it has been modified (or is new)
  if (!this.isModified("password")) {
    return next();
  }

  try {
    // Generate salt (random data for hashing)
    const salt = await bcrypt.genSalt(10);

    // Hash the password with the salt
    this.password = await bcrypt.hash(this.password, salt);

    next(); // Continue to save
  } catch (error) {
    next(error); // Pass error to next middleware
  }
});

// ==================== METHODS ====================

// Instance method: Compare provided password with stored hashed password
// Used during login to verify credentials
userSchema.methods.comparePassword = async function (candidatePassword) {
  // Returns true if passwords match, false otherwise
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method: Return user object without sensitive data
// Used when sending user data in responses
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password; // Remove password from response
  return user;
};

// Create and export the User model
// First argument is the collection name (will be 'users' in MongoDB)
// Second argument is the schema
module.exports = mongoose.model("User", userSchema);
