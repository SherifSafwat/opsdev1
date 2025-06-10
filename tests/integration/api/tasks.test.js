javascriptconst request = require('supertest');
const { app } = require('../../../src/app');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

describe('Tasks API Integration Tests', () => {
  let authToken;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.TEST_MONGODB_URI);
    
    // Create auth token for testing
    authToken = jwt.sign({ id: 'testuser' }, process.env.JWT_SECRET);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await mongoose.connection.db.dropDatabase();
  });

  describe('GET /api/tasks', () => {
    it('should return empty array for new user', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        priority: 'high'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body.title).toBe(taskData.title);
      expect(response.body.description).toBe(taskData.description);
    });
  });
});
