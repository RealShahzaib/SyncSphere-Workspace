import { Request, Response } from 'express';
import { Task } from '../models/task.model';

export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const limitQuery = req.query.limit;
    let limitValue: number | undefined = undefined;

    if (limitQuery) {
      const parsed = parseInt(limitQuery as string, 10);
      if (!isNaN(parsed) && parsed > 0) limitValue = parsed;
    }

    // Pull tasks from cluster index ordered by creation date
    const tasks = limitValue 
      ? await Task.find().sort({ createdAt: -1 }).limit(limitValue)
      : await Task.find().sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: 'Database Pipeline Fault', message: error.message });
  }
};

export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, status, priority, dueDate, category } = req.body;

    if (!title || title.trim().length < 5) {
      res.status(400).json({ error: 'Validation Error', message: 'Task Title must have 5+ characters.' });
      return;
    }
    if (!description || description.trim().length < 10) {
      res.status(400).json({ error: 'Validation Error', message: 'Description must have 10+ characters.' });
      return;
    }

    const newTask = new Task({
      title: title.trim(),
      description: description.trim(),
      status: status || 'Todo',
      priority: priority || 'Medium',
      dueDate: dueDate || undefined,
      category: category || 'General Workspace' // Default system collection folder fallback
    });

    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (error: any) {
    res.status(500).json({ error: 'Write Failure', message: error.message });
  }
};

export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      res.status(404).json({ error: 'Not Found', message: 'Target record missing.' });
      return;
    }
    res.status(200).json({ message: 'Purged successfully.', id });
  } catch (error: any) {
    res.status(500).json({ error: 'Deletion Failure', message: error.message });
  }
};