const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

let tasks = [
  { id: 1, title: 'Review JavaScript notes', completed: false },
  { id: 2, title: 'Submit assignment', completed: true },
];

app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/api/tasks', (req, res) => {
  res.json(tasks);
});

app.get('/api/tasks/:id', (req, res) => {
  const taskId = Number(req.params.id);
  const task = tasks.find((item) => item.id === taskId);

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  return res.json(task);
});

app.post('/api/tasks', (req, res) => {
  const { title, completed = false } = req.body || {};

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ message: 'Title is required' });
  }

  const newTask = {
    id: Date.now(),
    title: title.trim(),
    completed,
  };

  tasks.push(newTask);
  return res.status(201).json(newTask);
});

app.put('/api/tasks/:id', (req, res) => {
  const taskId = Number(req.params.id);
  const task = tasks.find((item) => item.id === taskId);

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const { title, completed } = req.body || {};

  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'Title must be a non-empty string' });
    }
    task.title = title.trim();
  }

  if (completed !== undefined) {
    task.completed = Boolean(completed);
  }

  return res.json(task);
});

app.delete('/api/tasks/:id', (req, res) => {
  const taskId = Number(req.params.id);
  const taskIndex = tasks.findIndex((item) => item.id === taskId);

  if (taskIndex === -1) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const [deletedTask] = tasks.splice(taskIndex, 1);
  return res.json({ message: 'Task deleted successfully', task: deletedTask });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
