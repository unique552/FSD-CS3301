const assert = require('node:assert/strict');
const { after, test } = require('node:test');

process.env.JWT_SECRET = 'test-secret-with-more-than-thirty-two-random-characters';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.COOKIE_SAME_SITE = 'lax';
process.env.NODE_ENV = 'test';

const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Task = require('../src/models/Task');
const Assignment = require('../src/models/Assignment');

const userId = '507f1f77bcf86cd799439011';
let storedUser;
let capturedTaskOwner;
let assignmentWrites = 0;
const originalMethods = {
  userCreate: User.create,
  userFindById: User.findById,
  userFindOne: User.findOne,
  taskFind: Task.find,
  taskCreate: Task.create,
  assignmentFind: Assignment.find,
  assignmentCreate: Assignment.create,
};

function makeUser(values) {
  return {
    id: userId,
    _id: userId,
    fullName: values.fullName || 'Test Student',
    email: values.email || 'test@example.edu',
    studentId: values.studentId || 'TEST-1',
    department: values.department || 'Computing',
    program: values.program || 'Software Engineering',
    academicYear: Number(values.academicYear || 1),
    phone: values.phone || '+1234567890',
    role: values.role || 'student',
    isActive: true,
    password: values.password,
    toJSON() {
      const { password, ...safeUser } = this;
      return safeUser;
    },
  };
}

User.create = async (values) => {
  storedUser = makeUser(values);
  return storedUser;
};
User.findById = async () => storedUser;
User.findOne = () => ({ select: async () => storedUser });
Task.find = (filter) => {
  assert.equal(String(filter.owner), userId);
  return { sort: async () => [] };
};
Task.create = async (values) => {
  capturedTaskOwner = String(values.owner);
  return { toJSON: () => ({ id: 'task-1', title: values.title }) };
};
Assignment.find = () => ({ sort: async () => [] });
Assignment.create = async () => {
  assignmentWrites += 1;
  return {};
};

const { app } = require('../src/app');
const server = app.listen(0);
const baseUrl = new Promise((resolve) => {
  server.once('listening', () => resolve(`http://127.0.0.1:${server.address().port}`));
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  User.create = originalMethods.userCreate;
  User.findById = originalMethods.userFindById;
  User.findOne = originalMethods.userFindOne;
  Task.find = originalMethods.taskFind;
  Task.create = originalMethods.taskCreate;
  Assignment.find = originalMethods.assignmentFind;
  Assignment.create = originalMethods.assignmentCreate;
});

test('authentication protects APIs, creates student-only sessions, and enforces ownership and roles', async () => {
  const base = await baseUrl;
  const json = (body) => ({
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  assert.equal((await fetch(`${base}/api/tasks`)).status, 401);
  assert.equal((await fetch(`${base}/api/assignments`)).status, 401);

  const registration = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    ...json({
      fullName: 'Test Student',
      email: 'test@example.edu',
      studentId: 'TEST-1',
      password: 'valid-password-123',
      confirmPassword: 'valid-password-123',
      department: 'Computing',
      program: 'Software Engineering',
      academicYear: '1',
      phone: '+1234567890',
      role: 'administrator',
    }),
  });
  assert.equal(registration.status, 201);
  const registrationBody = await registration.json();
  assert.equal(registrationBody.user.role, 'student');
  assert.equal(Object.hasOwn(registrationBody.user, 'password'), false);
  assert.notEqual(storedUser.password, 'valid-password-123');
  assert.equal(await bcrypt.compare('valid-password-123', storedUser.password), true);

  const cookie = registration.headers.get('set-cookie').split(';')[0];
  assert.equal((await fetch(`${base}/api/auth/me`, { headers: { Cookie: cookie } })).status, 200);

  const taskResponse = await fetch(`${base}/api/tasks`, {
    method: 'POST',
    headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Private task' }),
  });
  assert.equal(taskResponse.status, 201);
  assert.equal(capturedTaskOwner, userId);

  const deniedAssignment = await fetch(`${base}/api/assignments`, {
    method: 'POST',
    headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject: 'CS', title: 'Quiz' }),
  });
  assert.equal(deniedAssignment.status, 403);
  assert.equal(assignmentWrites, 0);

  const mismatchedPassword = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    ...json({
      fullName: 'Other Student',
      email: 'other@example.edu',
      studentId: 'TEST-2',
      password: 'valid-password-123',
      confirmPassword: 'different-password',
      department: 'Computing',
      program: 'Software Engineering',
      academicYear: 1,
      phone: '+1234567890',
    }),
  });
  assert.equal(mismatchedPassword.status, 400);

  const deniedOrigin = await fetch(`${base}/api/auth/logout`, {
    method: 'POST',
    headers: { Origin: 'http://untrusted.example' },
  });
  assert.equal(deniedOrigin.status, 403);

  const login = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    ...json({ identifier: 'TEST-1', password: 'valid-password-123', rememberMe: true }),
  });
  assert.equal(login.status, 200);
  assert.match(login.headers.get('set-cookie'), /Max-Age=604800/);
});
