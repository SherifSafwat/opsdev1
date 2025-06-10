javascriptconst taskController = require('../../../src/controllers/taskController');
const Task = require('../../../src/models/Task');

jest.mock('../../../src/models/Task');

describe('Task Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { id: 'user123' },
      body: {},
      params: {}
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
  });

  describe('getAllTasks', () => {
    it('should return all tasks for user', async () => {
      const mockTasks = [
        { _id: '1', title: 'Task 1', userId: 'user123' },
        { _id: '2', title: 'Task 2', userId: 'user123' }
      ];
      Task.find.mockResolvedValue(mockTasks);

      await taskController.getAllTasks(req, res);

      expect(Task.find).toHaveBeenCalledWith({ userId: 'user123' });
      expect(res.json).toHaveBeenCalledWith(mockTasks);
    });

    it('should handle errors', async () => {
      Task.find.mockRejectedValue(new Error('Database error'));

      await taskController.getAllTasks(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });
});
