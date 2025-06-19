const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const Report = require('./models/Report');
const ParrentFind = require('./models/ParrentFind');
const { router: authRouter } = require('./routes/auth');

const app = express();

// Middlewares
app.use(cors());
const FRONTEND_URL = 'https://TaskManager.z13.web.core.windows.net';

app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

// Routes
app.use('/api/auth', authRouter);

// MongoDB connection
mongoose.connect('mongodb+srv://junaidameerkhan555:6765jdrcvMSFvInc@clustertest.c9l2f3f.mongodb.net/?retryWrites=true&w=majority&appName=Clustertest', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err));

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './Uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    const mimetype = allowed.test(file.mimetype);
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only JPEG, JPG, PNG images under 2MB allowed'));
  }
});

// ✅ POST /api/report (Create Team)
app.post('/api/report', async (req, res) => {
  try {
    const { name } = req.body;
    console.log('Create team request:', { name });
    if (!name) {
      return res.status(400).json({ error: 'Team name is required' });
    }
    const newReport = new Report({ name, members: [], tasks: [] });
    await newReport.save();
    res.status(201).json({ message: '✅ Team created successfully!' });
  } catch (err) {
    console.error('Error creating team:', err);
    res.status(500).json({ error: `❌ Failed to create team: ${err.message}` });
  }
});

// ✅ PUT /api/report/:id (Update Team)
app.put('/api/report/:id', async (req, res) => {
  try {
    const { name } = req.body;
    console.log('Update team request:', { id: req.params.id, name });
    if (!name) {
      return res.status(400).json({ error: 'Team name is required' });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }
    const team = await Report.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true, runValidators: true }
    );
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.status(200).json({ message: '✅ Team updated successfully!' });
  } catch (err) {
    console.error('Error updating team:', err);
    res.status(500).json({ error: `❌ Failed to update team: ${err.message}` });
  }
});

// ✅ DELETE /api/report/:id (Delete Team)
app.delete('/api/report/:id', async (req, res) => {
  try {
    console.log('Delete team request:', { id: req.params.id });
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }
    const team = await Report.findByIdAndDelete(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.status(200).json({ message: '✅ Team deleted successfully!' });
  } catch (err) {
    console.error('Error deleting team:', err);
    res.status(500).json({ error: `❌ Failed to delete team: ${err.message}` });
  }
});

// ✅ POST /api/report/addMember (Add Member to Team)
app.post('/api/report/addMember', async (req, res) => {
  try {
    const { teamId, name, email } = req.body;
    console.log('Add member request:', { teamId, name, email });
    if (!teamId || !name || !email) {
      return res.status(400).json({ error: 'Team ID, name, and email are required' });
    }
    if (!mongoose.isValidObjectId(teamId)) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }
    const team = await Report.findById(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    team.members.push({ name, email });
    await team.save();
    res.status(201).json({ message: '✅ Member added successfully!' });
  } catch (err) {
    console.error('Error adding member:', err);
    res.status(500).json({ error: `❌ Failed to add member: ${err.message}` });
  }
});

// ✅ PUT /api/report/:teamId/member/:memberId (Update Member)
app.put('/api/report/:teamId/member/:memberId', async (req, res) => {
  try {
    const { name, email } = req.body;
    console.log('Update member request:', { teamId: req.params.teamId, memberId: req.params.memberId, name, email });
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    if (!mongoose.isValidObjectId(req.params.teamId) || !mongoose.isValidObjectId(req.params.memberId)) {
      return res.status(400).json({ error: 'Invalid team or member ID' });
    }
    const team = await Report.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    const member = team.members.id(req.params.memberId);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    member.name = name;
    member.email = email;
    await team.save();
    res.status(200).json({ message: '✅ Member updated successfully!' });
  } catch (err) {
    console.error('Error updating member:', err);
    res.status(500).json({ error: `❌ Failed to update member: ${err.message}` });
  }
});

// ✅ DELETE /api/report/:teamId/member/:memberId (Delete Member)
app.delete('/api/report/:teamId/member/:memberId', async (req, res) => {
  try {
    console.log('Delete member request:', { teamId: req.params.teamId, memberId: req.params.memberId });
    if (!mongoose.isValidObjectId(req.params.teamId) || !mongoose.isValidObjectId(req.params.memberId)) {
      return res.status(400).json({ error: 'Invalid team or member ID' });
    }
    const team = await Report.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    const member = team.members.id(req.params.memberId);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    team.members.pull({ _id: req.params.memberId });
    await team.save();
    res.status(200).json({ message: '✅ Member deleted successfully!' });
  } catch (err) {
    console.error('Error deleting member:', err);
    res.status(500).json({ error: `❌ Failed to delete member: ${err.message}` });
  }
});

// ✅ POST /api/report/addTask (Add Task to Team)
app.post('/api/report/addTask', async (req, res) => {
  try {
    const { teamId, memberId, title, description, status } = req.body;
    console.log('Add task request:', { teamId, memberId, title, description, status });
    if (!teamId || !memberId || !title || !status) {
      return res.status(400).json({ error: 'Team ID, member ID, title, and status are required' });
    }
    if (!mongoose.isValidObjectId(teamId) || !mongoose.isValidObjectId(memberId)) {
      return res.status(400).json({ error: 'Invalid team or member ID' });
    }
    const team = await Report.findById(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    if (!team.members.some((member) => member._id.toString() === memberId)) {
      return res.status(404).json({ error: 'Member not found in team' });
    }
    team.tasks.push({ title, description, memberId, status });
    await team.save();
    res.status(201).json({ message: '✅ Task assigned successfully!' });
  } catch (err) {
    console.error('Error adding task:', err);
    res.status(500).json({ error: `❌ Failed to assign task: ${err.message}` });
  }
});

// ✅ PUT /api/report/:teamId/task/:taskId (Update Task)
app.put('/api/report/:teamId/task/:taskId', async (req, res) => {
  try {
    const { memberId, title, description, status } = req.body;
    console.log('Update task request:', { teamId: req.params.teamId, taskId: req.params.taskId, memberId, title, description, status });
    if (!memberId || !title || !status) {
      return res.status(400).json({ error: 'Member ID, title, and status are required' });
    }
    if (!mongoose.isValidObjectId(req.params.teamId) || !mongoose.isValidObjectId(req.params.taskId) || !mongoose.isValidObjectId(memberId)) {
      return res.status(400).json({ error: 'Invalid team, task, or member ID' });
    }
    const team = await Report.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    if (!team.members.some((member) => member._id.toString() === memberId)) {
      return res.status(404).json({ error: 'Member not found in team' });
    }
    const task = team.tasks.id(req.params.taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    task.memberId = memberId;
    task.title = title;
    task.description = description || '';
    task.status = status;
    await team.save();
    res.status(200).json({ message: '✅ Task updated successfully!' });
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: `❌ Failed to update task: ${err.message}` });
  }
});

// ✅ DELETE /api/report/:teamId/task/:taskId (Delete Task)
app.delete('/api/report/:teamId/task/:id', async (req, res) => {
  try {
    console.log('Delete task request:', { teamId: req.params.teamId, taskId: req.params.id });
    if (!mongoose.isValidObjectId(req.params.teamId) || !mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid team or task ID' });
    }
    const team = await Report.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    const task = team.tasks.id(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    team.tasks.pull({ _id: req.params.id });
    await team.save();
    res.status(200).json({ message: '✅ Task deleted successfully!' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: `❌ Failed to delete task: ${err.message}` });
  }
});

// ✅ GET /api/report (Fetch All Teams)
app.get('/api/report', async (req, res) => {
  try {
    console.log('Fetch all teams request');
    const reports = await Report.find();
    res.json(reports);
  } catch (err) {
    console.error('Failed to fetch teams:', err);
    res.status(500).json({ error: `Failed to fetch teams: ${err.message}` });
  }
});

// ✅ POST /api/parrentfind
app.post('/api/parrentfind', upload.single('childImage'), async (req, res) => {
  try {
    const body = req.body;
    const file = req.file;
    console.log('ParrentFind request:', { body, file: file?.path });
    const newParrentFind = new ParrentFind({
      ...body,
      childImage: file?.path || null
    });
    await newParrentFind.save();
    res.status(201).json({ message: '✅ Parrent Find report submitted successfully!' });
  } catch (err) {
    console.error('Error saving parrentfind:', err);
    res.status(500).json({ error: `❌ Failed to save parrent find report: ${err.message}` });
  }
});

// ✅ GET /api/parrentfind
app.get('/api/parrentfind', async (req, res) => {
  try {
    console.log('Fetch all parrentfind reports request');
    const reports = await ParrentFind.find();
    res.json(reports);
  } catch (err) {
    console.error('Failed to fetch parrentfind reports:', err);
    res.status(500).json({ error: `Failed to fetch parrentfind reports: ${err.message}` });
  }
});

// ✅ Global error handler (for multer and others)
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  if (err instanceof multer.MulterError || err.message.includes('Only JPEG')) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: `Internal server error: ${err.message}` });
});

// Start server
app.listen(3001, () => {
  console.log('🚀 Server running on port 3001');
});
