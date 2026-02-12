const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const TODOS_FILE = path.join(__dirname, 'todos.json');

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Initialize todos file if it doesn't exist
function initTodosFile() {
  if (!fs.existsSync(TODOS_FILE)) {
    fs.writeFileSync(TODOS_FILE, JSON.stringify([]));
  }
}

// Read todos from file
function readTodos() {
  try {
    initTodosFile();
    const data = fs.readFileSync(TODOS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading todos:', error);
    return [];
  }
}

// Write todos to file
function writeTodos(todos) {
  try {
    fs.writeFileSync(TODOS_FILE, JSON.stringify(todos, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing todos:', error);
    return false;
  }
}

// API Routes

// Get all todos
app.get('/api/todos', (req, res) => {
  const todos = readTodos();
  res.json(todos);
});

// Add a new todo
app.post('/api/todos', (req, res) => {
  const { text } = req.body;
  
  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Todo text is required' });
  }
  
  const todos = readTodos();
  const newTodo = {
    id: Date.now(),
    text: text.trim(),
    completed: false,
    createdAt: new Date().toISOString()
  };
  
  todos.push(newTodo);
  
  if (writeTodos(todos)) {
    res.status(201).json(newTodo);
  } else {
    res.status(500).json({ error: 'Failed to save todo' });
  }
});

// Toggle todo completion
app.put('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const todos = readTodos();
  const todoIndex = todos.findIndex(t => t.id === id);
  
  if (todoIndex === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  
  if(todos[todoIndex].completed) {
    todos[todoIndex].completed = false;
  } else {
    todos[todoIndex].completed = true;
  }

  if (writeTodos(todos)) {
    res.status(200).json(todos[todoIndex]);
  } else {
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// Edit todo text
app.patch('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { text } = req.body;
  
  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Todo text is required' });
  }
  
  const todos = readTodos();
  const todoIndex = todos.findIndex(t => t.id === id);
  
  if (todoIndex === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  
  todos[todoIndex].text = text.trim();
  todos[todoIndex].updatedAt = new Date().toISOString();
  
  if (writeTodos(todos)) {
    res.status(200).json(todos[todoIndex]);
  } else {
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// Complete all todos
app.post('/api/todos/complete-all', (req, res) => {
  const todos = readTodos();
  
  if (todos.length === 0) {
    return res.status(200).json({ message: 'No todos to complete', count: 0 });
  }
  
  const updatedTodos = todos.map(todo => ({
    ...todo,
    completed: true
  }));
  
  if (writeTodos(updatedTodos)) {
    res.status(200).json({ message: 'All todos completed', count: updatedTodos.length });
  } else {
    res.status(500).json({ error: 'Failed to complete todos' });
  }
});

// Uncomplete all todos
app.post('/api/todos/uncomplete-all', (req, res) => {
  const todos = readTodos();
  
  if (todos.length === 0) {
    return res.status(200).json({ message: 'No todos to uncomplete', count: 0 });
  }
  
  const updatedTodos = todos.map(todo => ({
    ...todo,
    completed: false
  }));
  
  if (writeTodos(updatedTodos)) {
    res.status(200).json({ message: 'All todos uncompleted', count: updatedTodos.length });
  } else {
    res.status(500).json({ error: 'Failed to uncomplete todos' });
  }
});

// Delete a todo
app.delete('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const todos = readTodos();
  const filteredTodos = todos.filter(t => t.id !== id);
  
  if (todos.length === filteredTodos.length) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  
  if (writeTodos(filteredTodos)) {
    res.json({ message: 'Todo deleted successfully' });
  } else {
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// Initialize todos file on startup
initTodosFile();

// Only start the server if this file is run directly (not imported as a module)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export for testing and deployment
module.exports = app;
