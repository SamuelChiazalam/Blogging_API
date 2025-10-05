// Tests for blog endpoints

const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Blog = require('../models/Blog');
const mongoose = require('mongoose');

// Test data
const testUser = {
  first_name: 'Test',
  last_name: 'User',
  email: 'testblog' + Date.now() + '@test.com', // Make unique with timestamp
  password: 'password123'
};

const testBlog = {
  title: 'Test Blog Post ' + Date.now(), // Make unique
  description: 'This is a test blog description',
  body: 'This is the body of the test blog post. It contains enough words to calculate a reasonable reading time.',
  tags: ['test', 'blog']
};

let authToken;
let userId;
let blogId;

// ==================== SETUP AND TEARDOWN ====================

// Increase timeout for beforeAll hook
beforeAll(async () => {
  // Connect to database if not already connected
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
  
  // Clean up any existing test users first
  await User.deleteMany({ email: { $regex: 'testblog.*@test.com' } });
  
  // Create test user and get token
  const signupResponse = await request(app)
    .post('/api/auth/signup')
    .send(testUser);
  
  authToken = signupResponse.body.data.token;
  userId = signupResponse.body.data.user._id;
}, 30000); // 30 second timeout

afterAll(async () => {
  // Clean up: Delete test data
  await User.deleteMany({ email: { $regex: 'testblog.*@test.com' } });
  await Blog.deleteMany({ author: userId });
  
  // Close database connection
  await mongoose.connection.close();
}, 30000);

// ==================== CREATE BLOG TESTS ====================

describe('POST /api/blogs', () => {
  // Test creating blog without authentication
  test('Should not create blog without authentication', async () => {
    const response = await request(app)
      .post('/api/blogs')
      .send(testBlog)
      .expect(401);
    
    expect(response.body.success).toBe(false);
  });
  
  // Test creating blog with authentication
  test('Should create blog with authentication', async () => {
    const response = await request(app)
      .post('/api/blogs')
      .set('Authorization', `Bearer ${authToken}`)
      .send(testBlog)
      .expect(201);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.blog.title).toBe(testBlog.title);
    expect(response.body.data.blog.state).toBe('draft');
    expect(response.body.data.blog.reading_time).toBeGreaterThan(0);
    
    // Save blog ID for later tests
    blogId = response.body.data.blog._id;
  });
  
  // Test creating blog with missing required fields
  test('Should not create blog without title', async () => {
    const response = await request(app)
      .post('/api/blogs')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        body: 'Test body'
        // Missing title
      })
      .expect(400);
    
    expect(response.body.success).toBe(false);
  });
});

// ==================== GET ALL PUBLISHED BLOGS TESTS ====================

describe('GET /api/blogs', () => {
  // First, publish the test blog
  beforeAll(async () => {
    if (blogId) {
      await request(app)
        .patch(`/api/blogs/${blogId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ state: 'published' });
    }
  });
  
  // Test getting all published blogs
  test('Should get all published blogs without authentication', async () => {
    const response = await request(app)
      .get('/api/blogs')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('blogs');
    expect(response.body.data).toHaveProperty('pagination');
    expect(Array.isArray(response.body.data.blogs)).toBe(true);
  });
  
  // Test pagination
  test('Should paginate blogs correctly', async () => {
    const response = await request(app)
      .get('/api/blogs?page=1&limit=5')
      .expect(200);
    
    expect(response.body.data.pagination.limit).toBe(5);
    expect(response.body.data.blogs.length).toBeLessThanOrEqual(5);
  });
  
  // Test ordering
  test('Should order blogs by read_count', async () => {
    const response = await request(app)
      .get('/api/blogs?orderBy=read_count&order=desc')
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
});

// ==================== GET SINGLE BLOG TESTS ====================

describe('GET /api/blogs/:id', () => {
  // Test getting published blog
  test('Should get a single published blog', async () => {
    const response = await request(app)
      .get(`/api/blogs/${blogId}`)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.blog._id).toBe(blogId);
    expect(response.body.data.blog.author).toHaveProperty('first_name');
  });
  
  // Test getting non-existent blog
  test('Should return 404 for non-existent blog', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .get(`/api/blogs/${fakeId}`)
      .expect(404);
    
    expect(response.body.success).toBe(false);
  });
});

// ==================== GET USER BLOGS TESTS ====================

describe('GET /api/blogs/user/me', () => {
  // Test getting user's blogs without authentication
  test('Should not get user blogs without authentication', async () => {
    const response = await request(app)
      .get('/api/blogs/user/me')
      .expect(401);
    
    expect(response.body.success).toBe(false);
  });
  
  // Test getting user's blogs with authentication
  test('Should get user blogs with authentication', async () => {
    const response = await request(app)
      .get('/api/blogs/user/me')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('blogs');
    expect(response.body.data).toHaveProperty('pagination');
  });
  
  // Test filtering by state
  test('Should filter user blogs by state', async () => {
    const response = await request(app)
      .get('/api/blogs/user/me?state=published')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
});

// ==================== UPDATE BLOG TESTS ====================

describe('PATCH /api/blogs/:id', () => {
  // Test updating blog without authentication
  test('Should not update blog without authentication', async () => {
    const response = await request(app)
      .patch(`/api/blogs/${blogId}`)
      .send({ title: 'Updated Title' })
      .expect(401);
    
    expect(response.body.success).toBe(false);
  });
  
  // Test updating blog with authentication (owner)
  test('Should update blog as owner', async () => {
    const response = await request(app)
      .patch(`/api/blogs/${blogId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ 
        title: 'Updated Test Blog ' + Date.now(),
        state: 'draft'
      })
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.blog.state).toBe('draft');
  });
  
  // Test updating blog state to published
  test('Should update blog state to published', async () => {
    const response = await request(app)
      .patch(`/api/blogs/${blogId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ state: 'published' })
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.blog.state).toBe('published');
  });
});

// ==================== DELETE BLOG TESTS ====================

describe('DELETE /api/blogs/:id', () => {
  // Test deleting blog without authentication
  test('Should not delete blog without authentication', async () => {
    const response = await request(app)
      .delete(`/api/blogs/${blogId}`)
      .expect(401);
    
    expect(response.body.success).toBe(false);
  });
  
  // Test deleting blog with authentication (owner)
  test('Should delete blog as owner', async () => {
    const response = await request(app)
      .delete(`/api/blogs/${blogId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Blog deleted successfully');
  });
  
  // Test deleting already deleted blog
  test('Should return 404 for deleted blog', async () => {
    const response = await request(app)
      .delete(`/api/blogs/${blogId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
    
    expect(response.body.success).toBe(false);
  });
});

// ==================== READING TIME CALCULATION TEST ====================

describe('Reading Time Calculation', () => {
  test('Should calculate reading time correctly', async () => {
    // Create a blog with known word count
    const longBody = 'word '.repeat(400); // 400 words
    
    const response = await request(app)
      .post('/api/blogs')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Reading Time Test ' + Date.now(),
        body: longBody
      })
      .expect(201);
    
    // 400 words / 200 wpm = 2 minutes
    expect(response.body.data.blog.reading_time).toBe(2);
    
    // Clean up
    await Blog.findByIdAndDelete(response.body.data.blog._id);
  });
});