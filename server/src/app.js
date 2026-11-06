
const path = require('node:path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const connectDatabase = require('./config/db');
const Task = require('./models/Task');
const Assignment = require('./models/Assignment');
const authRoutes = require('./routes/auth');
const {
  getCookieOptions,
  getJwtSecret,
  requireAuth,
  requireRole,
} = require('./middleware/auth');

require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
});

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (
  process.env.CLIENT_ORIGIN ||
  'http://localhost:5173,http://127.0.0.1:5173'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// --------------------------------------------------
// MIDDLEWARE
// --------------------------------------------------

app.use(express.json({ limit: '10kb' }));

app.use(cors({
  credentials: true,
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.includes(origin));
  },
}));
app.use(cookieParser());
app.use((req, res, next) => {
  const isReadOnly = ['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  const origin = req.get('origin');
  if (!isReadOnly && origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ message: 'Request origin is not allowed' });
  }
  return next();
});

app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.url}`
  );
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', requireAuth);
app.use('/api/assignments', requireAuth);

// --------------------------------------------------
// TASK ROUTES
// --------------------------------------------------

// GET: Fetch all tasks
app.get('/api/tasks', async (req, res, next) => {
  try {
    const tasks = await Task.find({ owner: req.user._id }).sort({ createdAt: -1 });
    return res.json(tasks.map((task) => task.toJSON()));
  } catch (err) {
    return next(err);
  }
});

// GET: Fetch task by ID
app.get('/api/tasks/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    return res.json(task.toJSON());
  } catch (err) {
    return next(err);
  }
});

// POST: Create task
app.post('/api/tasks', async (req, res, next) => {
  try {
    const { title, completed = false } = req.body || {};

    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    if (typeof completed !== 'boolean') {
      return res.status(400).json({
        message: 'Completed must be a boolean',
      });
    }

    const task = await Task.create({
      title: title.trim(),
      completed,
      owner: req.user._id,
    });

    return res.status(201).json(task.toJSON());
  } catch (err) {
    return next(err);
  }
});

// PUT: Update task
app.put('/api/tasks/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const { title, completed } = req.body || {};
    const updates = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({
          message: 'Title must be a non-empty string',
        });
      }

      updates.title = title.trim();
    }

    if (completed !== undefined) {
      if (typeof completed !== 'boolean') {
        return res.status(400).json({
          message: 'Completed must be a boolean',
        });
      }

      updates.completed = completed;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: 'At least one task field is required',
      });
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    return res.json(task.toJSON());
  } catch (err) {
    return next(err);
  }
});

// DELETE: Delete task
app.delete('/api/tasks/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    return res.json({
      message: 'Task deleted successfully',
      task: task.toJSON(),
    });
  } catch (err) {
    return next(err);
  }
});

// --------------------------------------------------
// ASSIGNMENT ROUTES
// --------------------------------------------------

// GET: Fetch all assignments
app.get('/api/assignments', async (req, res, next) => {
  try {
    const assignments = await Assignment.find()
      .sort({ createdAt: -1 });

    return res.json(assignments);
  } catch (err) {
    return next(err);
  }
});

// POST: Create assignment
app.post('/api/assignments', requireRole('faculty', 'administrator'), async (req, res, next) => {
  try {
    const { subject, title } = req.body || {};

    if (typeof subject !== 'string' || !subject.trim()) {
      return res.status(400).json({
        message: 'Subject is required',
      });
    }

    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        message: 'Title is required',
      });
    }

    const assignment = await Assignment.create({
      subject: subject.trim(),
      title: title.trim(),
    });

    return res.status(201).json(assignment);
  } catch (err) {
    return next(err);
  }
});

// PUT: Update assignment
app.put('/api/assignments/:id', requireRole('faculty', 'administrator'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid assignment ID',
      });
    }

    if (
      !req.body ||
      typeof req.body !== 'object' ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        message: 'Assignment details must be an object',
      });
    }

    const { subject, title, status } = req.body;
    const updates = {};

    if (subject !== undefined) {
      if (typeof subject !== 'string' || !subject.trim()) {
        return res.status(400).json({
          message: 'Subject must be a non-empty string',
        });
      }

      updates.subject = subject.trim();
    }

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({
          message: 'Title must be a non-empty string',
        });
      }

      updates.title = title.trim();
    }

    if (status !== undefined) {
      if (!['Pending', 'Submitted'].includes(status)) {
        return res.status(400).json({
          message: 'Status must be Pending or Submitted',
        });
      }

      updates.status = status;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: 'At least one assignment field is required',
      });
    }

    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!assignment) {
      return res.status(404).json({
        message: 'Assignment not found',
      });
    }

    return res.json(assignment);
  } catch (err) {
    return next(err);
  }
});

// DELETE: Delete assignment
app.delete('/api/assignments/:id', requireRole('faculty', 'administrator'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid assignment ID',
      });
    }

    const assignment = await Assignment.findByIdAndDelete(
      req.params.id
    );

    if (!assignment) {
      return res.status(404).json({
        message: 'Assignment not found',
      });
    }

    return res.json({
      message: 'Assignment deleted successfully',
      assignment,
    });
  } catch (err) {
    return next(err);
  }
});

// PUT: Submit assignment
app.put('/api/assignments/:id/submit', requireRole('student'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid assignment ID',
      });
    }

    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      { status: 'Submitted' },
      { new: true, runValidators: true }
    );

    if (!assignment) {
      return res.status(404).json({
        message: 'Assignment not found',
      });
    }

    return res.json(assignment);
  } catch (err) {
    return next(err);
  }
});

// --------------------------------------------------
// GLOBAL ERROR HANDLER
// --------------------------------------------------

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      message: 'Request body contains invalid JSON',
    });
  }

  if (
    err.name === 'ValidationError' ||
    err.name === 'CastError'
  ) {
    return res.status(400).json({
      message: 'Invalid request data',
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      message: 'Duplicate record',
    });
  }

  console.error('API error:', err.name || 'UnknownError');

  return res.status(500).json({
    message: 'Internal server error',
  });
});

// --------------------------------------------------
// START SERVER AND CONNECT DATABASE
// --------------------------------------------------

async function startServer() {
  try {
    getJwtSecret();
    getCookieOptions();
    console.log('Connecting to MongoDB Atlas...');

    await connectDatabase();

    console.log('MongoDB connection established.');

    app.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT}`
      );
    });

  } catch (error) {
    console.error('\nMongoDB Connection Failed!');
    console.error('Error Name:', error.name);
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);

    if (error.reason?.servers) {
      for (const [server, details] of error.reason.servers) {
        console.error(`Server: ${server}`);
        console.error(
          'Server Error:',
          details.error?.message
        );
      }
    }

    process.exitCode = 1;
  }
}

// --------------------------------------------------
// EXPORTS
// --------------------------------------------------

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  startServer,
};
