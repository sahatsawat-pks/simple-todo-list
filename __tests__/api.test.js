const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../index');

// Mock file path for testing
const TEST_TODOS_FILE = path.join(__dirname, '../todos.test.json');

describe('Todo API Endpoints', () => {
  beforeEach((done) => {
    // Reset the todos file before each test
    if (fs.existsSync(TEST_TODOS_FILE)) {
      fs.unlinkSync(TEST_TODOS_FILE);
    }
    // Clear the default todos.json file as well
    const defaultTodosFile = path.join(__dirname, '../todos.json');
    if (fs.existsSync(defaultTodosFile)) {
      fs.writeFileSync(defaultTodosFile, JSON.stringify([]));
    }
    // Small delay to ensure file operations complete
    setTimeout(done, 20);
  });

  afterAll(() => {
    // Clean up test files
    if (fs.existsSync(TEST_TODOS_FILE)) {
      fs.unlinkSync(TEST_TODOS_FILE);
    }
  });

  describe('GET /api/todos', () => {
    test('should return an empty array initially', async () => {
      const response = await request(app).get('/api/todos');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('should return all todos', async () => {
      // Add a todo first
      await request(app)
        .post('/api/todos')
        .send({ text: 'Test todo' });

      const response = await request(app).get('/api/todos');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('text', 'Test todo');
    });
  });

  describe('POST /api/todos', () => {
    test('should create a new todo', async () => {
      const newTodo = { text: 'Buy groceries' };
      
      const response = await request(app)
        .post('/api/todos')
        .send(newTodo);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('text', 'Buy groceries');
      expect(response.body).toHaveProperty('completed', false);
      expect(response.body).toHaveProperty('createdAt');
    });

    test('should trim whitespace from todo text', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ text: '  Spaced out todo  ' });
      
      expect(response.status).toBe(201);
      expect(response.body.text).toBe('Spaced out todo');
    });

    test('should return 400 if text is missing', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Todo text is required');
    });

    test('should return 400 if text is empty', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ text: '' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Todo text is required');
    });

    test('should return 400 if text is only whitespace', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ text: '   ' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Todo text is required');
    });

    test('should generate unique IDs for todos', async () => {
      const response1 = await request(app)
        .post('/api/todos')
        .send({ text: 'First todo' });
      
      const response2 = await request(app)
        .post('/api/todos')
        .send({ text: 'Second todo' });
      
      expect(response1.body.id).not.toBe(response2.body.id);
    });
  });

  describe('PUT /api/todos/:id', () => {
    test('should toggle todo completion status', async () => {
      // Create a todo first
      const createResponse = await request(app)
        .post('/api/todos')
        .send({ text: 'Test todo' });
      
      const todoId = createResponse.body.id;
      
      // Toggle completion
      const response = await request(app)
        .put(`/api/todos/${todoId}`);
      
      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(true);
    });

    test('should toggle back to incomplete', async () => {
      // Create a todo
      const createResponse = await request(app)
        .post('/api/todos')
        .send({ text: 'Test todo' });
      
      const todoId = createResponse.body.id;
      
      // Toggle to complete
      await request(app).put(`/api/todos/${todoId}`);
      
      // Toggle back to incomplete
      const response = await request(app).put(`/api/todos/${todoId}`);
      
      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(false);
    });

    test('should return 404 if todo not found', async () => {
      const response = await request(app)
        .put('/api/todos/999999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Todo not found');
    });
  });

  describe('PATCH /api/todos/:id', () => {
    test('should edit todo text', async () => {
      // Create a todo first
      const createResponse = await request(app)
        .post('/api/todos')
        .send({ text: 'Original text' });
      
      const todoId = createResponse.body.id;
      
      // Edit the todo
      const response = await request(app)
        .patch(`/api/todos/${todoId}`)
        .send({ text: 'Updated text' });
      
      expect(response.status).toBe(200);
      expect(response.body.text).toBe('Updated text');
      expect(response.body.id).toBe(todoId);
      expect(response.body).toHaveProperty('updatedAt');
    });

    test('should trim whitespace from edited text', async () => {
      // Create a todo
      const createResponse = await request(app)
        .post('/api/todos')
        .send({ text: 'Original text' });
      
      const todoId = createResponse.body.id;
      
      // Edit with whitespace
      const response = await request(app)
        .patch(`/api/todos/${todoId}`)
        .send({ text: '  Updated text  ' });
      
      expect(response.status).toBe(200);
      expect(response.body.text).toBe('Updated text');
    });

    test('should return 400 if text is missing', async () => {
      // Create a todo
      const createResponse = await request(app)
        .post('/api/todos')
        .send({ text: 'Original text' });
      
      const todoId = createResponse.body.id;
      
      // Try to edit without text
      const response = await request(app)
        .patch(`/api/todos/${todoId}`)
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Todo text is required');
    });

    test('should return 400 if text is empty', async () => {
      // Create a todo
      const createResponse = await request(app)
        .post('/api/todos')
        .send({ text: 'Original text' });
      
      const todoId = createResponse.body.id;
      
      // Try to edit with empty text
      const response = await request(app)
        .patch(`/api/todos/${todoId}`)
        .send({ text: '' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Todo text is required');
    });

    test('should return 400 if text is only whitespace', async () => {
      // Create a todo
      const createResponse = await request(app)
        .post('/api/todos')
        .send({ text: 'Original text' });
      
      const todoId = createResponse.body.id;
      
      // Try to edit with whitespace only
      const response = await request(app)
        .patch(`/api/todos/${todoId}`)
        .send({ text: '   ' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Todo text is required');
    });

    test('should return 404 if todo not found', async () => {
      const response = await request(app)
        .patch('/api/todos/999999')
        .send({ text: 'Updated text' });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Todo not found');
    });

    test('should preserve completion status when editing', async () => {
      // Create and complete a todo
      const createResponse = await request(app)
        .post('/api/todos')
        .send({ text: 'Original text' });
      
      const todoId = createResponse.body.id;
      
      // Toggle to complete
      await request(app).put(`/api/todos/${todoId}`);
      
      // Edit the todo text
      const editResponse = await request(app)
        .patch(`/api/todos/${todoId}`)
        .send({ text: 'Updated text' });
      
      expect(editResponse.status).toBe(200);
      expect(editResponse.body.text).toBe('Updated text');
      expect(editResponse.body.completed).toBe(true);
    });

    test('should verify edited todo persists', async () => {
      // Create a todo
      const createResponse = await request(app)
        .post('/api/todos')
        .send({ text: 'Original text' });
      
      const todoId = createResponse.body.id;
      
      // Edit the todo
      await request(app)
        .patch(`/api/todos/${todoId}`)
        .send({ text: 'Updated text' });
      
      // Verify it persisted
      const getResponse = await request(app).get('/api/todos');
      const editedTodo = getResponse.body.find(t => t.id === todoId);
      
      expect(editedTodo).toBeDefined();
      expect(editedTodo.text).toBe('Updated text');
    });
  });

  describe('POST /api/todos/complete-all', () => {
    test('should complete all todos', async () => {
      // Create multiple todos
      await request(app).post('/api/todos').send({ text: 'Todo 1' });
      await request(app).post('/api/todos').send({ text: 'Todo 2' });
      await request(app).post('/api/todos').send({ text: 'Todo 3' });
      
      // Complete all
      const response = await request(app).post('/api/todos/complete-all');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'All todos completed');
      expect(response.body.count).toBe(3);
      
      // Verify all are completed
      const getResponse = await request(app).get('/api/todos');
      expect(getResponse.body.every(t => t.completed === true)).toBe(true);
    });

    test('should handle complete all with no todos', async () => {
      const response = await request(app).post('/api/todos/complete-all');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'No todos to complete');
      expect(response.body.count).toBe(0);
    });

    test('should complete already completed todos', async () => {
      // Create and complete a todo
      const createResponse = await request(app)
        .post('/api/todos')
        .send({ text: 'Already completed' });
      
      await request(app).put(`/api/todos/${createResponse.body.id}`);
      
      // Create another uncompleted todo
      await request(app).post('/api/todos').send({ text: 'Not completed' });
      
      // Complete all
      const response = await request(app).post('/api/todos/complete-all');
      
      expect(response.status).toBe(200);
      expect(response.body.count).toBe(2);
      
      // Verify all are completed
      const getResponse = await request(app).get('/api/todos');
      expect(getResponse.body.every(t => t.completed === true)).toBe(true);
    });
  });

  describe('POST /api/todos/uncomplete-all', () => {
    test('should uncomplete all todos', async () => {
      // Create and complete multiple todos
      const todo1 = await request(app).post('/api/todos').send({ text: 'Todo 1' });
      const todo2 = await request(app).post('/api/todos').send({ text: 'Todo 2' });
      const todo3 = await request(app).post('/api/todos').send({ text: 'Todo 3' });
      
      await request(app).put(`/api/todos/${todo1.body.id}`);
      await request(app).put(`/api/todos/${todo2.body.id}`);
      await request(app).put(`/api/todos/${todo3.body.id}`);
      
      // Uncomplete all
      const response = await request(app).post('/api/todos/uncomplete-all');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'All todos uncompleted');
      expect(response.body.count).toBe(3);
      
      // Verify all are uncompleted
      const getResponse = await request(app).get('/api/todos');
      expect(getResponse.body.every(t => t.completed === false)).toBe(true);
    });

    test('should handle uncomplete all with no todos', async () => {
      const response = await request(app).post('/api/todos/uncomplete-all');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'No todos to uncomplete');
      expect(response.body.count).toBe(0);
    });

    test('should uncomplete already uncompleted todos', async () => {
      // Create uncompleted and completed todos
      const todo1 = await request(app).post('/api/todos').send({ text: 'Uncompleted' });
      const todo2 = await request(app).post('/api/todos').send({ text: 'Completed' });
      
      await request(app).put(`/api/todos/${todo2.body.id}`);
      
      // Uncomplete all
      const response = await request(app).post('/api/todos/uncomplete-all');
      
      expect(response.status).toBe(200);
      expect(response.body.count).toBe(2);
      
      // Verify all are uncompleted
      const getResponse = await request(app).get('/api/todos');
      expect(getResponse.body.every(t => t.completed === false)).toBe(true);
    });
  });

  describe('DELETE /api/todos/:id', () => {
    test('should delete a todo', async () => {
      // Create a todo
      const createResponse = await request(app)
        .post('/api/todos')
        .send({ text: 'Todo to delete' });
      
      const todoId = createResponse.body.id;
      
      // Delete the todo
      const deleteResponse = await request(app)
        .delete(`/api/todos/${todoId}`);
      
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body).toHaveProperty('message', 'Todo deleted successfully');
      
      // Verify it's deleted
      const getResponse = await request(app).get('/api/todos');
      expect(getResponse.body).toHaveLength(0);
    });

    test('should return 404 if todo not found', async () => {
      const response = await request(app)
        .delete('/api/todos/999999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Todo not found');
    });

    test('should only delete the specified todo', async () => {
      // Create multiple todos
      const todo1 = await request(app)
        .post('/api/todos')
        .send({ text: 'First todo' });
      
      const todo2 = await request(app)
        .post('/api/todos')
        .send({ text: 'Second todo' });
      
      // Delete first todo
      await request(app).delete(`/api/todos/${todo1.body.id}`);
      
      // Verify only second todo remains
      const response = await request(app).get('/api/todos');
      expect(response.body).toHaveLength(1);
      expect(response.body[0].text).toBe('Second todo');
    });
  });

  describe('Integration tests', () => {
    test('should handle complete CRUD workflow', async () => {
      // Create a todo
      const createResponse = await request(app)
        .post('/api/todos')
        .send({ text: 'Complete workflow test' });
      
      const todoId = createResponse.body.id;
      expect(createResponse.status).toBe(201);
      
      // Read todos
      const getResponse = await request(app).get('/api/todos');
      expect(getResponse.body).toHaveLength(1);
      
      // Update (toggle) todo
      const updateResponse = await request(app).put(`/api/todos/${todoId}`);
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.completed).toBe(true);
      
      // Delete todo
      const deleteResponse = await request(app).delete(`/api/todos/${todoId}`);
      expect(deleteResponse.status).toBe(200);
      
      // Verify deletion
      const finalResponse = await request(app).get('/api/todos');
      expect(finalResponse.body).toHaveLength(0);
    });

    test('should persist todos across requests', async () => {
      // Create multiple todos
      await request(app).post('/api/todos').send({ text: 'Todo 1' });
      await request(app).post('/api/todos').send({ text: 'Todo 2' });
      await request(app).post('/api/todos').send({ text: 'Todo 3' });
      
      // Get todos
      const response = await request(app).get('/api/todos');
      
      expect(response.body).toHaveLength(3);
      expect(response.body[0].text).toBe('Todo 1');
      expect(response.body[1].text).toBe('Todo 2');
      expect(response.body[2].text).toBe('Todo 3');
    });
  });
});
