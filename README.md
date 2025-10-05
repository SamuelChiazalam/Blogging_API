📝 Blogging API
A RESTful API for a blogging platform built with Node.js, Express, and MongoDB. Features JWT authentication, pagination, search, and comprehensive blog management.
🚀 Live Demo
API Base URL: https://your-app.onrender.com/api
✨ Features

🔐 JWT Authentication - Secure user authentication with 1-hour token expiration
📝 Blog Management - Create, read, update, and delete blog posts
📊 Draft & Published States - Control blog visibility
🔍 Advanced Search - Search by title, author, and tags
📄 Pagination - Efficient data retrieval with customizable page sizes
🎯 Filtering & Sorting - Order by read count, reading time, or timestamp
👤 User-Specific Blogs - Users can manage their own blogs
⏱️ Reading Time Calculation - Automatic reading time estimation
📈 Read Count Tracking - Track blog views automatically
🧪 Comprehensive Tests - Full test coverage with Jest

🛠️ Tech Stack

Node.js - JavaScript runtime
Express.js - Web framework
MongoDB - NoSQL database
Mongoose - MongoDB ODM
JWT - JSON Web Tokens for authentication
bcryptjs - Password hashing
Jest & Supertest - Testing framework

📋 Prerequisites

Node.js (v14 or higher)
MongoDB Atlas account or local MongoDB
npm or yarn

🚦 Getting Started
1. Clone the repository
bashgit clone https://github.com/YOUR_USERNAME/blogging-api.git
cd blogging-api
2. Install dependencies
bashnpm install
3. Create .env file
envMONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/blogging_api
JWT_SECRET=your_super_secret_jwt_key_make_it_long_and_random
PORT=5000
NODE_ENV=development
4. Start the server
bash# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
5. Run tests
bashnpm test
📁 Project Structure
blogging_api/
├── controllers/
│   ├── authController.js       # Authentication logic
│   └── blogController.js       # Blog CRUD operations
├── middleware/
│   ├── auth.js                 # JWT authentication middleware
│   └── errorHandler.js         # Global error handling
├── models/
│   ├── User.js                 # User schema
│   └── Blog.js                 # Blog schema
├── routes/
│   ├── auth.js                 # Authentication routes
│   └── blogs.js                # Blog routes
├── utils/
│   ├── logger.js               # Logging utility
│   └── calculateReadingTime.js # Reading time calculator
├── tests/
│   ├── auth.test.js            # Authentication tests
│   └── blog.test.js            # Blog tests
├── logs/
│   └── app.log                 # Application logs
├── .env                        # Environment variables
├── .gitignore                 # Git ignore file
├── server.js                   # Application entry point
└── package.json               # Dependencies and scripts
📚 API Documentation
Base URL
Local: http://localhost:5000/api
Production: https://your-app.onrender.com/api
Authentication
All protected endpoints require a JWT token in the Authorization header:
Authorization: Bearer <your_jwt_token>

🔐 Authentication Endpoints
1. Sign Up
Register a new user.
Endpoint: POST /api/auth/signup
Request Body:
json{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "password123"
}
Success Response (201):
json{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
2. Login
Authenticate and get JWT token.
Endpoint: POST /api/auth/login
Request Body:
json{
  "email": "john@example.com",
  "password": "password123"
}
Success Response (200):
json{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
3. Get Current User
Get logged-in user information.
Endpoint: GET /api/auth/me
Headers: Authorization: Bearer <token>
Success Response (200):
json{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}

📝 Blog Endpoints
1. Create Blog
Create a new blog post (starts as draft).
Endpoint: POST /api/blogs
Headers: Authorization: Bearer <token>
Request Body:
json{
  "title": "My First Blog Post",
  "description": "A brief description of my blog",
  "body": "This is the full content of my blog post...",
  "tags": ["technology", "coding", "nodejs"]
}
Success Response (201):
json{
  "success": true,
  "message": "Blog created successfully",
  "data": {
    "blog": {
      "_id": "507f1f77bcf86cd799439012",
      "title": "My First Blog Post",
      "description": "A brief description of my blog",
      "body": "This is the full content...",
      "tags": ["technology", "coding", "nodejs"],
      "author": {
        "_id": "507f1f77bcf86cd799439011",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com"
      },
      "state": "draft",
      "read_count": 0,
      "reading_time": 2,
      "timestamp": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
2. Get All Published Blogs
Get paginated list of published blogs with search and sorting.
Endpoint: GET /api/blogs
Query Parameters:

page (optional, default: 1) - Page number
limit (optional, default: 20) - Items per page
search (optional) - Search in title, tags
orderBy (optional) - Field to sort by: read_count, reading_time, timestamp (default)
order (optional) - Sort order: asc or desc (default)

Example: GET /api/blogs?page=1&limit=10&search=nodejs&orderBy=read_count&order=desc
Success Response (200):
json{
  "success": true,
  "data": {
    "blogs": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "title": "My First Blog Post",
        "description": "A brief description",
        "tags": ["technology", "coding"],
        "author": {
          "first_name": "John",
          "last_name": "Doe",
          "email": "john@example.com"
        },
        "state": "published",
        "read_count": 42,
        "reading_time": 2,
        "timestamp": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalBlogs": 100,
      "limit": 20
    }
  }
}
3. Get Single Blog
Get a specific published blog by ID (increments read_count).
Endpoint: GET /api/blogs/:id
Success Response (200):
json{
  "success": true,
  "data": {
    "blog": {
      "_id": "507f1f77bcf86cd799439012",
      "title": "My First Blog Post",
      "description": "A brief description",
      "body": "Full blog content here...",
      "tags": ["technology", "coding"],
      "author": {
        "_id": "507f1f77bcf86cd799439011",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com"
      },
      "state": "published",
      "read_count": 43,
      "reading_time": 2,
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  }
}
4. Get User's Blogs
Get all blogs created by logged-in user.
Endpoint: GET /api/blogs/user/me
Headers: Authorization: Bearer <token>
Query Parameters:

page (optional, default: 1)
limit (optional, default: 20)
state (optional) - Filter by state: draft or published

Example: GET /api/blogs/user/me?state=draft&page=1&limit=10
Success Response (200):
json{
  "success": true,
  "data": {
    "blogs": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "title": "My Draft Blog",
        "state": "draft",
        "read_count": 0,
        "reading_time": 3,
        "timestamp": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalBlogs": 15,
      "limit": 10
    }
  }
}
5. Update Blog
Update a blog post (only by owner).
Endpoint: PATCH /api/blogs/:id
Headers: Authorization: Bearer <token>
Request Body (all fields optional):
json{
  "title": "Updated Title",
  "description": "Updated description",
  "body": "Updated content...",
  "tags": ["updated", "tags"],
  "state": "published"
}
Success Response (200):
json{
  "success": true,
  "message": "Blog updated successfully",
  "data": {
    "blog": {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Updated Title",
      "state": "published",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  }
}
6. Delete Blog
Delete a blog post (only by owner).
Endpoint: DELETE /api/blogs/:id
Headers: Authorization: Bearer <token>
Success Response (200):
json{
  "success": true,
  "message": "Blog deleted successfully"
}

🎯 Database Schema
User Model
javascript{
  first_name: String (required),
  last_name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  createdAt: Date (default: now)
}
Blog Model
javascript{
  title: String (required, unique),
  description: String,
  author: ObjectId (ref: User, required),
  state: String (enum: ['draft', 'published'], default: 'draft'),
  read_count: Number (default: 0),
  reading_time: Number (calculated),
  tags: [String],
  body: String (required),
  timestamp: Date (default: now),
  updatedAt: Date (default: now)
}

🧪 Testing
Run all tests:
bashnpm test
The test suite includes:

Authentication tests (signup, login, JWT validation)
Blog CRUD operation tests
Authorization tests (owner-only actions)
Pagination and filtering tests
Reading time calculation tests


🔒 Security Features

Password Hashing: bcrypt with salt rounds
JWT Authentication: Tokens expire after 1 hour
Input Validation: Server-side validation for all inputs
Authorization: Users can only modify their own blogs
MongoDB Injection Protection: Mongoose sanitizes queries
Error Handling: Sensitive information not exposed in errors


📊 Reading Time Algorithm
The API automatically calculates reading time based on:

Average reading speed: 200 words per minute
Formula: Math.ceil(wordCount / 200)
Minimum: 1 minute


🚀 Deployment
Deploy to Render

Push code to GitHub
Create new Web Service on Render
Connect your repository
Set environment variables:

MONGODB_URI
JWT_SECRET
NODE_ENV=production


Deploy!


📝 Error Responses
All error responses follow this format:
json{
  "success": false,
  "message": "Error message here"
}
Common HTTP status codes:

400 - Bad Request (validation errors)
401 - Unauthorized (authentication required)
403 - Forbidden (not authorized)
404 - Not Found
500 - Internal Server Error


👨‍💻 Author
Your Name

GitHub: @YOUR_USERNAME
Email: your.email@example.com


📄 License
This project is licensed under the MIT License.

🙏 Acknowledgments

AltSchool Africa for the project requirements
MongoDB Atlas for database hosting
Render for application hosting


⭐ If you found this project helpful, please give it a star!