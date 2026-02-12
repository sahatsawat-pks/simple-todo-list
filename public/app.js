// API endpoints
const API_BASE = '/api/todos';

// DOM elements
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const totalCount = document.getElementById('totalCount');
const completedCount = document.getElementById('completedCount');
const completeAllBtn = document.getElementById('completeAllBtn');
const uncompleteAllBtn = document.getElementById('uncompleteAllBtn');

// State
let todos = [];

// Fetch all todos
async function fetchTodos() {
    try {
        const response = await fetch(API_BASE);
        todos = await response.json();
        renderTodos();
    } catch (error) {
        console.error('Error fetching todos:', error);
        alert('Failed to load todos');
    }
}

// Add a new todo
async function addTodo() {
    const text = todoInput.value.trim();
    
    if (!text) {
        alert('Please enter a todo');
        return;
    }
    
    try {
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });
        
        if (response.ok) {
            const newTodo = await response.json();
            todos.push(newTodo);
            todoInput.value = '';
            renderTodos();
        } else {
            alert('Failed to add todo');
        }
    } catch (error) {
        console.error('Error adding todo:', error);
        alert('Failed to add todo');
    }
}

// Toggle todo completion
async function toggleTodo(id) {
    try {
        const response = await fetch(`${API_BASE}/${id}`, {
            method: 'PUT',
        });
        console.log(response)
        if (response.ok) {
            const updatedTodo = await response.json();
            const index = todos.findIndex(t => t.id === id);
            if (index !== -1) {
                todos[index] = updatedTodo;
                renderTodos();
            }
        } else {
            alert('Failed to update todo');
        }
    } catch (error) {
        console.error('Error toggling todo:', error);
        alert('Failed to update todo');
    }
}

// Delete a todo
async function deleteTodo(id) {
    try {
        const response = await fetch(`${API_BASE}/${id}`, {
            method: 'DELETE',
        });
        
        if (response.ok) {
            todos = todos.filter(t => t.id !== id);
            renderTodos();
        } else {
            alert('Failed to delete todo');
        }
    } catch (error) {
        console.error('Error deleting todo:', error);
        alert('Failed to delete todo');
    }
}

// Edit a todo
async function editTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    const newText = prompt('Edit todo:', todo.text);
    
    if (newText === null) {
        // User cancelled
        return;
    }
    
    if (!newText.trim()) {
        alert('Todo text cannot be empty');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: newText }),
        });
        
        if (response.ok) {
            const updatedTodo = await response.json();
            const index = todos.findIndex(t => t.id === id);
            if (index !== -1) {
                todos[index] = updatedTodo;
                renderTodos();
            }
        } else {
            alert('Failed to edit todo');
        }
    } catch (error) {
        console.error('Error editing todo:', error);
        alert('Failed to edit todo');
    }
}

// Render todos to the DOM
function renderTodos() {
    if (todos.length === 0) {
        todoList.innerHTML = '<div class="empty-state">No todos yet. Add one above!</div>';
    } else {
        todoList.innerHTML = todos.map(todo => `
            <div class="todo-item ${todo.completed ? 'completed' : ''}">
                <input 
                    type="checkbox" 
                    class="todo-checkbox" 
                    ${todo.completed ? 'checked' : ''} 
                    onchange="toggleTodo(${todo.id})"
                />
                <span class="todo-text">${escapeHtml(todo.text)}</span>
                <div class="todo-actions">
                    <button class="edit-btn" onclick="editTodo(${todo.id})">Edit</button>
                    <button class="delete-btn" onclick="deleteTodo(${todo.id})">Delete</button>
                </div>
            </div>
        `).join('');
    }
    
    updateStats();
}

// Update statistics
function updateStats() {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    totalCount.textContent = total;
    completedCount.textContent = completed;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Complete all todos
async function completeAll() {
    if (todos.length === 0) {
        alert('No todos to complete');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/complete-all`, {
            method: 'POST',
        });
        
        if (response.ok) {
            await fetchTodos();
        } else {
            alert('Failed to complete all todos');
        }
    } catch (error) {
        console.error('Error completing all todos:', error);
        alert('Failed to complete all todos');
    }
}

// Uncomplete all todos
async function uncompleteAll() {
    if (todos.length === 0) {
        alert('No todos to uncomplete');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/uncomplete-all`, {
            method: 'POST',
        });
        
        if (response.ok) {
            await fetchTodos();
        } else {
            alert('Failed to uncomplete all todos');
        }
    } catch (error) {
        console.error('Error uncompleting all todos:', error);
        alert('Failed to uncomplete all todos');
    }
}

// Event listeners
addBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTodo();
    }
});
completeAllBtn.addEventListener('click', completeAll);
uncompleteAllBtn.addEventListener('click', uncompleteAll);

// Initialize
fetchTodos();
