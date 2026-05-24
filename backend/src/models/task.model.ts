import { Schema, model, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description: string;
  status: 'Todo' | 'In Progress' | 'Done';
  priority: 'Low' | 'Medium' | 'High';
  category: string; // Group 5 Custom Folders Property Integration
  dueDate?: Date;
  createdAt: Date;
}

const TaskSchema = new Schema<ITask>({
  title: { 
    type: String, 
    required: [true, 'Task title is strictly required.'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long.']
  },
  description: { 
    type: String, 
    required: [true, 'Task description is strictly required.'],
    trim: true 
  },
  status: { 
    type: String, 
    enum: {
      values: ['Todo', 'In Progress', 'Done'],
      message: '{VALUE} is not a valid status option.'
    },
    default: 'Todo'
  },
  priority: { 
    type: String, 
    enum: {
      values: ['Low', 'Medium', 'High'],
      message: '{VALUE} is not a valid priority option.'
    },
    default: 'Medium'
  },
  category: {
    type: String,
    required: [true, 'Task category/folder assignment is required.'],
    trim: true,
    default: 'General Workspace' // Default fallback directory mapping
  },
  dueDate: { 
    type: Date, 
    required: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Clean up object output transforming _id to id
TaskSchema.set('toJSON', {
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const Task = model<ITask>('Task', TaskSchema);