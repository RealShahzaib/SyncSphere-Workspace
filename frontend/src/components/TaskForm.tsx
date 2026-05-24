import React, { useState } from 'react';

interface TaskFormProps {
  onTaskCreated: (task: any) => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ onTaskCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Todo' | 'In Progress' | 'Done'>('Todo');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [dueDate, setDueDate] = useState('');
  
  // Validation States (Engineering Feature)
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Client-side validation rule check
    if (!title.trim()) {
      setValidationError('Validation Error: Task Title field is strictly mandatory.');
      return;
    }
    if (!description.trim()) {
      setValidationError('Validation Error: Task Description field is strictly mandatory.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:5000/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          status,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Server rejected the submission.');
      }

      // Success cleanup operations
      onTaskCreated(data);
      setTitle('');
      setDescription('');
      setStatus('Todo');
      setPriority('Medium');
      setDueDate('');
    } catch (err: any) {
      setValidationError(err.message || 'An error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-cyber-card border border-cyber-border rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-accent to-cyber-neonGreen"></div>
      <h2 className="text-xl font-bold tracking-wide mb-6 text-white flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-cyber-accent animate-pulse"></span>
        Deploy New Mission
      </h2>

      {validationError && (
        <div className="mb-4 p-4 rounded-xl bg-red-950/40 border border-cyber-neonRed text-red-400 text-sm font-medium">
          {validationError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2 font-semibold">Task Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setValidationError(null); }}
            placeholder="e.g. Optimize Mongo Aggregations"
            className="w-full bg-cyber-bg border border-cyber-border rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-cyber-accent transition"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2 font-semibold">Description</label>
          <textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); setValidationError(null); }}
            placeholder="Detailed tactical operational metrics..."
            rows={3}
            className="w-full bg-cyber-bg border border-cyber-border rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-cyber-accent transition resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2 font-semibold">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full bg-cyber-bg border border-cyber-border rounded-xl p-3 text-slate-100 focus:outline-none focus:border-cyber-accent transition"
            >
              <option value="Todo">Todo</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2 font-semibold">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full bg-cyber-bg border border-cyber-border rounded-xl p-3 text-slate-100 focus:outline-none focus:border-cyber-accent transition"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2 font-semibold">Due Date (Optional)</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-cyber-bg border border-cyber-border rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-cyber-accent transition"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 bg-gradient-to-r from-cyber-accent to-blue-600 text-slate-900 font-bold uppercase tracking-wider py-3.5 rounded-xl hover:opacity-90 transition transform active:scale-[0.98] disabled:opacity-50"
        >
          {isSubmitting ? 'Syncing Schema...' : 'Initialize Task'}
        </button>
      </form>
    </div>
  );
};