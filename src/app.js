javascriptconst express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskapi', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0'
  });
});

// API routes
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server };
src/controllers/taskController.js
javascriptconst Task = require('../models/Task');

const taskController = {
  async getAllTasks(req, res) {
    try {
      const tasks = await Task.find({ userId: req.user.id });
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async createTask(req, res) {
    try {
      const task = new Task({
        ...req.body,
        userId: req.user.id
      });
      await task.save();
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async updateTask(req, res) {
    try {
      const task = await Task.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.id },
        req.body,
        { new: true }
      );
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(task);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async deleteTask(req, res) {
    try {
      const task = await Task.findOneAndDelete({
        _id: req.params.id,
        userId: req.user.id
      });
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = taskController;
