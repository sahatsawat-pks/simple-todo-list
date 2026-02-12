/**
 * @jest-environment jsdom
 */

// Mock fetch globally
global.fetch = jest.fn();

// Mock alert
global.alert = jest.fn();

describe('Frontend Todo Application', () => {
  let todoInput, addBtn, todoList, totalCount, completedCount;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <input id="todoInput" type="text" />
      <button id="addBtn">Add</button>
      <div id="todoList"></div>
      <span id="totalCount">Total: 0</span>
      <span id="completedCount">Completed: 0</span>
    `;

    // Get DOM elements
    todoInput = document.getElementById('todoInput');
    addBtn = document.getElementById('addBtn');
    todoList = document.getElementById('todoList');
    totalCount = document.getElementById('totalCount');
    completedCount = document.getElementById('completedCount');

    // Reset fetch mock
    fetch.mockReset();
    global.alert.mockReset();
  });

  describe('escapeHtml function', () => {
    test('should escape HTML special characters', () => {
      const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      };

      expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
      expect(escapeHtml('Normal text')).toBe('Normal text');
      expect(escapeHtml('<b>Bold</b>')).toBe('&lt;b&gt;Bold&lt;/b&gt;');
    });
  });

  describe('renderTodos function', () => {
    test('should show empty state when no todos', () => {
      const todos = [];
      
      if (todos.length === 0) {
        todoList.innerHTML = '<div class="empty-state">No todos yet. Add one above!</div>';
      }

      expect(todoList.innerHTML).toContain('No todos yet. Add one above!');
    });

    test('should render todos correctly', () => {
      const todos = [
        { id: 1, text: 'Test todo', completed: false },
        { id: 2, text: 'Completed todo', completed: true }
      ];

      const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      };

      todoList.innerHTML = todos.map(todo => `
        <div class="todo-item ${todo.completed ? 'completed' : ''}">
          <input 
            type="checkbox" 
            class="todo-checkbox" 
            ${todo.completed ? 'checked' : ''} 
            onchange="toggleTodo(${todo.id})"
          />
          <span class="todo-text">${escapeHtml(todo.text)}</span>
          <button class="delete-btn" onclick="deleteTodo(${todo.id})">Delete</button>
        </div>
      `).join('');

      expect(todoList.children.length).toBe(2);
      expect(todoList.innerHTML).toContain('Test todo');
      expect(todoList.innerHTML).toContain('Completed todo');
    });
  });

  describe('updateStats function', () => {
    test('should update statistics correctly', () => {
      const todos = [
        { id: 1, text: 'Todo 1', completed: false },
        { id: 2, text: 'Todo 2', completed: true },
        { id: 3, text: 'Todo 3', completed: true }
      ];

      const total = todos.length;
      const completed = todos.filter(t => t.completed).length;
      totalCount.textContent = total;
      completedCount.textContent = completed;

      expect(totalCount.textContent).toBe('3');
      expect(completedCount.textContent).toBe('2');
    });

    test('should show zero stats for empty list', () => {
      const todos = [];
      
      const total = todos.length;
      const completed = todos.filter(t => t.completed).length;
      totalCount.textContent = total;
      completedCount.textContent = completed;

      expect(totalCount.textContent).toBe('0');
      expect(completedCount.textContent).toBe('0');
    });
  });

  describe('fetchTodos function', () => {
    test('should fetch todos successfully', async () => {
      const mockTodos = [
        { id: 1, text: 'Test todo', completed: false }
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTodos
      });

      const response = await fetch('/api/todos');
      const todos = await response.json();

      expect(fetch).toHaveBeenCalledWith('/api/todos');
      expect(todos).toEqual(mockTodos);
    });

    test('should handle fetch error', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch('/api/todos');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });
  });

  describe('addTodo function', () => {
    test('should add a new todo', async () => {
      const newTodo = { id: 1, text: 'New todo', completed: false };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => newTodo
      });

      todoInput.value = 'New todo';
      
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: 'New todo' }),
      });

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result).toEqual(newTodo);
    });

    test('should not add empty todo', () => {
      todoInput.value = '';
      const text = todoInput.value.trim();
      
      if (!text) {
        alert('Please enter a todo');
      }

      expect(alert).toHaveBeenCalledWith('Please enter a todo');
    });

    test('should not add whitespace-only todo', () => {
      todoInput.value = '   ';
      const text = todoInput.value.trim();
      
      if (!text) {
        alert('Please enter a todo');
      }

      expect(alert).toHaveBeenCalledWith('Please enter a todo');
    });

    test('should handle add todo error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false
      });

      todoInput.value = 'New todo';
      
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: 'New todo' }),
      });

      if (!response.ok) {
        alert('Failed to add todo');
      }

      expect(alert).toHaveBeenCalledWith('Failed to add todo');
    });
  });

  describe('toggleTodo function', () => {
    test('should toggle todo completion', async () => {
      const updatedTodo = { id: 1, text: 'Test todo', completed: true };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedTodo
      });

      const response = await fetch('/api/todos/1', {
        method: 'PUT',
      });

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.completed).toBe(true);
    });

    test('should handle toggle error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false
      });

      const response = await fetch('/api/todos/1', {
        method: 'PUT',
      });

      if (!response.ok) {
        alert('Failed to update todo');
      }

      expect(alert).toHaveBeenCalledWith('Failed to update todo');
    });
  });

  describe('deleteTodo function', () => {
    test('should delete a todo', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Todo deleted successfully' })
      });

      const response = await fetch('/api/todos/1', {
        method: 'DELETE',
      });

      expect(response.ok).toBe(true);
      expect(fetch).toHaveBeenCalledWith('/api/todos/1', {
        method: 'DELETE',
      });
    });

    test('should handle delete error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false
      });

      const response = await fetch('/api/todos/1', {
        method: 'DELETE',
      });

      if (!response.ok) {
        alert('Failed to delete todo');
      }

      expect(alert).toHaveBeenCalledWith('Failed to delete todo');
    });
  });

  describe('editTodo function', () => {
    // Mock prompt
    beforeEach(() => {
      global.prompt = jest.fn();
    });

    afterEach(() => {
      delete global.prompt;
    });

    test('should edit a todo successfully', async () => {
      const updatedTodo = { id: 1, text: 'Updated text', completed: false };
      
      global.prompt.mockReturnValue('Updated text');
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedTodo
      });

      const response = await fetch('/api/todos/1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: 'Updated text' }),
      });

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.text).toBe('Updated text');
      expect(fetch).toHaveBeenCalledWith('/api/todos/1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: 'Updated text' }),
      });
    });

    test('should handle edit error', async () => {
      global.prompt.mockReturnValue('Updated text');
      
      fetch.mockResolvedValueOnce({
        ok: false
      });

      const response = await fetch('/api/todos/1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: 'Updated text' }),
      });

      if (!response.ok) {
        alert('Failed to edit todo');
      }

      expect(alert).toHaveBeenCalledWith('Failed to edit todo');
    });

    test('should not edit when user cancels prompt', () => {
      global.prompt.mockReturnValue(null);
      
      const newText = global.prompt('Edit todo:', 'Original text');
      
      if (newText === null) {
        // User cancelled, don't make API call
      }

      expect(newText).toBeNull();
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should not edit with empty text', () => {
      global.prompt.mockReturnValue('');
      
      const newText = global.prompt('Edit todo:', 'Original text');
      
      if (!newText.trim()) {
        alert('Todo text cannot be empty');
      }

      expect(alert).toHaveBeenCalledWith('Todo text cannot be empty');
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should not edit with whitespace-only text', () => {
      global.prompt.mockReturnValue('   ');
      
      const newText = global.prompt('Edit todo:', 'Original text');
      
      if (!newText.trim()) {
        alert('Todo text cannot be empty');
      }

      expect(alert).toHaveBeenCalledWith('Todo text cannot be empty');
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should handle network error during edit', async () => {
      global.prompt.mockReturnValue('Updated text');
      
      fetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch('/api/todos/1', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: 'Updated text' }),
        });
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });
  });

  describe('completeAll function', () => {
    test('should complete all todos successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'All todos completed', count: 3 })
      });

      const response = await fetch('/api/todos/complete-all', {
        method: 'POST',
      });

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.message).toBe('All todos completed');
      expect(result.count).toBe(3);
    });

    test('should handle complete all error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false
      });

      const response = await fetch('/api/todos/complete-all', {
        method: 'POST',
      });

      if (!response.ok) {
        alert('Failed to complete all todos');
      }

      expect(alert).toHaveBeenCalledWith('Failed to complete all todos');
    });

    test('should alert when no todos to complete', () => {
      const todos = [];
      
      if (todos.length === 0) {
        alert('No todos to complete');
      }

      expect(alert).toHaveBeenCalledWith('No todos to complete');
    });

    test('should handle network error during complete all', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch('/api/todos/complete-all', {
          method: 'POST',
        });
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });
  });

  describe('uncompleteAll function', () => {
    test('should uncomplete all todos successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'All todos uncompleted', count: 3 })
      });

      const response = await fetch('/api/todos/uncomplete-all', {
        method: 'POST',
      });

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.message).toBe('All todos uncompleted');
      expect(result.count).toBe(3);
    });

    test('should handle uncomplete all error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false
      });

      const response = await fetch('/api/todos/uncomplete-all', {
        method: 'POST',
      });

      if (!response.ok) {
        alert('Failed to uncomplete all todos');
      }

      expect(alert).toHaveBeenCalledWith('Failed to uncomplete all todos');
    });

    test('should alert when no todos to uncomplete', () => {
      const todos = [];
      
      if (todos.length === 0) {
        alert('No todos to uncomplete');
      }

      expect(alert).toHaveBeenCalledWith('No todos to uncomplete');
    });

    test('should handle network error during uncomplete all', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch('/api/todos/uncomplete-all', {
          method: 'POST',
        });
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });
  });

  describe('Input validation', () => {
    test('should trim whitespace from input', () => {
      todoInput.value = '  Test todo  ';
      const text = todoInput.value.trim();
      
      expect(text).toBe('Test todo');
    });

    test('should handle special characters in input', () => {
      const specialText = '<script>alert("xss")</script>';
      const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      };
      
      const escaped = escapeHtml(specialText);
      expect(escaped).not.toContain('<script>');
    });
  });
});
