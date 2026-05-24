import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// MIDDLEWARE CONFIGURATION
// ==========================================
app.use(cors());
app.use(express.json()); // CRITICAL: Fixes empty bodies (req.body) on PUT/POST requests

// ==========================================
// MONGODB DATABASE CONFIGURATION
// ==========================================
// Replace 'taskflow_db' with your actual database name if different
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskflow_db';

mongoose.connect(MONGO_URI)
  .then(() => console.log('🚀 Connected to MongoDB pipeline successfully.'))
  .catch((err) => console.error('❌ Database connection fault:', err));

// Define Task Schema
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
// ROUTE ENDPOINTS
// ==========================================

// 1. GET ALL TASKS (with limit constraints)
app.get('/tasks', async (req: Request, res: Response) => {
  try {
    const limitQuery = parseInt(req.query.limit as string) || 10;
    const tasks = await Task.find().sort({ createdAt: -1 }).limit(limitQuery);
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching schemas:', err);
    res.status(500).json({ error: 'Failed to extract database entries.' });
  }
});

// 2. CREATE A NEW TASK
app.post('/tasks', async (req: Request, res: Response) => {
  try {
    const { title, description, status, priority, dueDate, category } = req.body;
    
    const newTask = new Task({
      title,
      description,
      status,
      priority,
      dueDate,
      category
    });

    await newTask.save();
    res.status(201).json(newTask);
  } catch (err: any) {
    console.error('Error creating schema entry:', err);
    res.status(400).json({ error: err.message || 'Payload rejected by backend guards.' });
  }
});

// 3. UPDATE AN EXISTING TASK (The missing piece solving your error!)
app.put('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, dueDate, category } = req.body;

    // Finds document by _id, pushes update payload, validates changes, returns new document
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { title, description, status, priority, dueDate, category },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ error: 'Task entry matching targeted ID was not found.' });
    }

    res.json(updatedTask);
  } catch (err: any) {
    console.error('Backend Error on PUT handler:', err);
    res.status(400).json({ error: err.message || 'Failed to modify task parameters.' });
  }
});

// 4. PURGE/DELETE A TASK
app.delete('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return res.status(404).json({ error: 'Task could not be mapped for deletion.' });
    }

    res.json({ message: 'Document purged from database successfully.', deletedTask });
  } catch (err) {
    console.error('Error on DELETE routing block:', err);
    res.status(500).json({ error: 'Failed to drop record index from engine.' });
  }
});

// ==========================================
// START PIPELINE SERVER
// ==========================================
app.listen(PORT, () => {
  console.log(`🌐 TaskFlow API engine online at http://localhost:${PORT}`);
});