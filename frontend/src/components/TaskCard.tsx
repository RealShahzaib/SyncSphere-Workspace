import React from 'react';
import { Trash2, Calendar, AlertTriangle } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'Todo' | 'In Progress' | 'Done';
  priority: 'Low' | 'Medium' | 'High';
  dueDate?: string;
  createdAt: string;
}

interface TaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onDelete }) => {
  
  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'High': return 'bg-red-500/10 text-cyber-neonRed border-red-500/20';
      case 'Medium': return 'bg-amber-500/10 text-cyber-neonOrange border-amber-500/20';
      default: return 'bg-emerald-500/10 text-cyber-neonGreen border-emerald-500/20';
    }
  };

  const getStatusColor = (s: string) => {
    switch(s) {
      case 'Done': return 'bg-emerald-500 text-slate-950';
      case 'In Progress': return 'bg-cyber-accent text-slate-950';
      default: return 'bg-slate-700 text-slate-100';
    }
  };

  return (
    <div className="bg-cyber-card border border-cyber-border hover:border-slate-600 transition duration-300 rounded-2xl p-5 shadow-lg flex flex-col justify-between group relative overflow-hidden">
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className={`text-xs px-2.5 py-1 rounded-md font-semibold tracking-wider uppercase border ${getPriorityColor(task.priority)}`}>
            {task.priority} Priority
          </span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-tight ${getStatusColor(task.status)}`}>
            {task.status}
          </span>
        </div>

        <h3 className="text-lg font-bold text-white tracking-wide mb-2 line-clamp-1">{task.title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-3 whitespace-pre-wrap">{task.description}</p>
      </div>

      <div className="pt-4 border-t border-cyber-border flex items-center justify-between text-xs text-slate-400">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-cyber-accent" />
            <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
          </div>
          {task.dueDate && (
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <AlertTriangle size={13} className="text-cyber-neonOrange" />
              <span>Target: {new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => onDelete(task.id)}
          className="p-2.5 bg-slate-800 rounded-xl text-slate-400 hover:text-cyber-neonRed hover:bg-red-950/30 transition border border-transparent hover:border-red-500/20"
          title="Delete Matrix Record"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};