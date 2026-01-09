const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const PORT = 5000;

// Enable CORS for local frontend
app.use(cors());
app.use(bodyParser.json());

// Simple JSON file storage (simulate database)
const dbFile = './db.json';

// Load or initialize DB
let db = { users: [], tasks: {}, activity: {}, chats: {} };
if (fs.existsSync(dbFile)) {
  db = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
}

// Helper to save DB
function saveDB() {
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
}

// --- Auth Routes ---

// Signup
app.post('/api/signup', (req, res) => {
  const { name, email, pass } = req.body;
  if (!name || !email || !pass) return res.status(400).json({ error: 'Missing fields' });
  if (db.users.find(u => u.email === email)) return res.status(400).json({ error: 'User already exists' });
  const newUser = { name, email, pass };
  db.users.push(newUser);
  saveDB();
  return res.json({ message: 'Account created', user: newUser });
});

// Login
app.post('/api/login', (req, res) => {
  const { email, pass } = req.body;
  const user = db.users.find(u => u.email === email && u.pass === pass);
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  return res.json({ message: 'Logged in', user });
});

// --- Tasks / Dashboard Routes ---

// Get user tasks
app.get('/api/tasks/:email', (req, res) => {
  const email = req.params.email;
  const tasks = db.tasks[email] || [];
  res.json(tasks);
});

// Add task
app.post('/api/tasks/:email', (req, res) => {
  const email = req.params.email;
  const { title, status } = req.body;
  if (!title) return res.status(400).json({ error: 'Missing task title' });
  db.tasks[email] = db.tasks[email] || [];
  db.tasks[email].push({ title, status: status || 'pending' });
  saveDB();
  res.json({ message: 'Task added', tasks: db.tasks[email] });
});

// Update task
app.put('/api/tasks/:email/:index', (req, res) => {
  const email = req.params.email;
  const index = parseInt(req.params.index);
  const { status } = req.body;
  if (!db.tasks[email] || !db.tasks[email][index]) return res.status(400).json({ error: 'Task not found' });
  db.tasks[email][index].status = status;
  saveDB();
  res.json({ message: 'Task updated', tasks: db.tasks[email] });
});

// Remove task
app.delete('/api/tasks/:email/:index', (req, res) => {
  const email = req.params.email;
  const index = parseInt(req.params.index);
  if (!db.tasks[email] || !db.tasks[email][index]) return res.status(400).json({ error: 'Task not found' });
  db.tasks[email].splice(index, 1);
  saveDB();
  res.json({ message: 'Task removed', tasks: db.tasks[email] });
});

// --- Activity Feed ---

app.get('/api/activity/:email', (req, res) => {
  const email = req.params.email;
  const feed = db.activity[email] || [];
  res.json(feed);
});

app.post('/api/activity/:email', (req, res) => {
  const email = req.params.email;
  const { text } = req.body;
  db.activity[email] = db.activity[email] || [];
  db.activity[email].push(text);
  saveDB();
  res.json({ message: 'Activity added', activity: db.activity[email] });
});

// --- Chat ---

app.get('/api/chats/:email', (req, res) => {
  const email = req.params.email;
  const chats = db.chats[email] || {};
  res.json(chats);
});

app.post('/api/chats/:email', (req, res) => {
  const email = req.params.email;
  const { withUser, who, text, when } = req.body;
  db.chats[email] = db.chats[email] || {};
  db.chats[email][withUser] = db.chats[email][withUser] || [];
  db.chats[email][withUser].push({ who, text, when });
  saveDB();
  res.json({ message: 'Message sent', chats: db.chats[email] });
});

// --- Notifications (mocked) ---
app.get('/api/notifications/:email', (req, res) => {
  const notifications = [
    { text: 'Alex sent you a message', time: '2m' },
    { text: 'Sarah commented on your task', time: '15m' },
    { text: 'New project idea added', time: '1h' }
  ];
  res.json(notifications);
});

// --- Server Start ---
app.listen(PORT, () => console.log(`Backend running at http://localhost:${PORT}`));
