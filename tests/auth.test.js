// Tests for authentication endpoints

const request = require("supertest");
const app = require("../server");
const User = require("../models/User");
const mongoose = require("mongoose");

// Test data
const testUser = {
  first_name: "John",
  last_name: "Doe",
  email: "john@test.com",
  password: "password123",
};

// ==================== SETUP AND TEARDOWN ====================

// Run before all tests
beforeAll(async () => {
  // Connect to test database
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
});

// Run after all tests
afterAll(async () => {
  // Clean up: Delete test user
  await User.deleteMany({ email: testUser.email });

  // Close database connection
  await mongoose.connection.close();
});

// ==================== SIGNUP TESTS ====================

describe("POST /api/auth/signup", () => {
  // Test successful signup
  test("Should register a new user successfully", async () => {
    const response = await request(app)
      .post("/api/auth/signup")
      .send(testUser)
      .expect(201);

    // Check response structure
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("User registered successfully");
    expect(response.body.data).toHaveProperty("user");
    expect(response.body.data).toHaveProperty("token");

    // Check user data
    expect(response.body.data.user.email).toBe(testUser.email);
    expect(response.body.data.user).not.toHaveProperty("password");
  });

  // Test signup with existing email
  test("Should not register user with existing email", async () => {
    const response = await request(app)
      .post("/api/auth/signup")
      .send(testUser)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Email already registered");
  });

  // Test signup with missing fields
  test("Should not register user with missing fields", async () => {
    const response = await request(app)
      .post("/api/auth/signup")
      .send({
        first_name: "Jane",
        email: "jane@test.com",
        // Missing last_name and password
      })
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  // Test signup with invalid email
  test("Should not register user with invalid email", async () => {
    const response = await request(app)
      .post("/api/auth/signup")
      .send({
        ...testUser,
        email: "invalid-email",
      })
      .expect(400);

    expect(response.body.success).toBe(false);
  });
});

// ==================== LOGIN TESTS ====================

describe("POST /api/auth/login", () => {
  // Test successful login
  test("Should login user with correct credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Login successful");
    expect(response.body.data).toHaveProperty("token");
  });

  // Test login with wrong password
  test("Should not login with wrong password", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: "wrongpassword",
      })
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  // Test login with non-existent email
  test("Should not login with non-existent email", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "nonexistent@test.com",
        password: "password123",
      })
      .expect(401);

    expect(response.body.success).toBe(false);
  });
});

// ==================== GET CURRENT USER TESTS ====================

describe("GET /api/auth/me", () => {
  let authToken;

  // Login before running these tests to get token
  beforeAll(async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });

    authToken = response.body.data.token;
  });

  // Test getting current user with valid token
  test("Should get current user with valid token", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe(testUser.email);
  });

  // Test getting current user without token
  test("Should not get current user without token", async () => {
    const response = await request(app).get("/api/auth/me").expect(401);

    expect(response.body.success).toBe(false);
  });

  // Test getting current user with invalid token
  test("Should not get current user with invalid token", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalidtoken123")
      .expect(401);

    expect(response.body.success).toBe(false);
  });
});
