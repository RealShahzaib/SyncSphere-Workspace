import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// SMART FALLBACK: Tries your .env cloud string first. If it can't reach it, it connects locally.
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskflow_db';

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 4000 // Stops it from hanging forever if your Wi-Fi blocks it
})
  .then(() => console.log('🚀 Successfully tunneled into Live MongoDB Instance.'))
  .catch((err) => {
    console.log('⚠️ Network restriction detected. Gracefully dropping back to local storage cluster...');
    // Fallback handshake execution
    mongoose.connect('mongodb://127.0.0.1:27017/taskflow_db')
      .then(() => console.log('✅ Connected safely to Local Fallback Database Engine.'))
      .catch((localErr) => console.error('❌ Complete Database Fault:', localErr));
  });

// Task Schema
interface ITask {
  title: string;
  description: string;
  status: string;
  priority: string;
  category?: string;
  dueDate?: Date;
  createdAt: Date;
}

const taskSchema = new mongoose.Schema<ITask>({
  title: { type: String, required: true, minlength: 5 },
  description: { type: String, required: true, minlength: 10 },
  status: { type: String, required: true, enum: ['Todo', 'In Progress', 'Done'], default: 'Todo' },
  priority: { type: String, required: true, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  category: { type: String, default: 'General Workspace' },
  dueDate: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model<ITask>('Task', taskSchema);

// ==========================================
// AUTHENTICATION PORTAL GATE ENDPOINT
// ==========================================
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if ((email === 'shahzaib@syncsphere.com' || email === 'ahmed@syncsphere.com') && password === 'admin123') {
    return res.json({
      success: true,
      user: {
        name: email === 'shahzaib@syncsphere.com' ? 'Shahzaib Shah' : 'Syed Ahmed Raza',
        email: email,
        role: 'Lead Architect'
      }
    });
  }

  return res.status(401).json({ success: false, error: 'Invalid security credentials.' });
});

// ==========================================
// RESTful CRUD ROUTE ENGINES
// ==========================================
app.get('/tasks', async (req: Request, res: Response) => {
  try {
    const limitQuery = parseInt(req.query.limit as string) || 10;
    const tasks = await Task.find().sort({ createdAt: -1 }).limit(limitQuery);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to extract database entries.' });
  }
});

app.post('/tasks', async (req: Request, res: Response) => {
  try {
    const { title, description, status, priority, dueDate, category } = req.body;
    const newTask = new Task({ title, description, status, priority, dueDate, category });
    await newTask.save();
    res.status(201).json(newTask);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Payload rejected.' });
  }
});

app.put('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, dueDate, category } = req.body;
    const updatedTask = await Task.findByIdAndUpdate(id, { title, description, status, priority, dueDate, category }, { new: true, runValidators: true });
    if (!updatedTask) return res.status(404).json({ error: 'Task not found.' });
    res.json(updatedTask);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Update failed.' });
  }
});

app.delete('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedTask = await Task.findByIdAndDelete(id);
    if (!deletedTask) return res.status(404).json({ error: 'Task not found.' });
    res.json({ message: 'Purged successfully.', deletedTask });
  } catch (err) {
    res.status(500).json({ error: 'Deletion failed.' });
  }
});

app.listen(PORT, () => console.log(`🌐 TaskFlow API online at http://localhost:${PORT}`));