import React, { useEffect, useState } from 'react';
import { 
  Layers, Sliders, Trash2, XCircle, PlusCircle, Calendar, 
  AlertCircle, Folder, FolderPlus, Inbox, X, Sun, Moon, Users,
  Grid, Trello, List, CheckCircle2, Circle, HelpCircle, Edit2, Activity, Clock
} from 'lucide-react';

type ViewMode = 'grid' | 'kanban' | 'list' | 'calendar';

interface ActivityLog {
  id: string;
  message: string;
  timestamp: string;
  type: 'create' | 'update' | 'delete' | 'system';
}

export default function App() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [limit, setLimit] = useState<string>('10');
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Theme State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('taskflow_theme');
    return savedTheme ? savedTheme === 'dark' : false;
  });

  // Folders State
  const [folders, setFolders] = useState<string[]>(() => {
    const saved = localStorage.getItem('taskflow_folders');
    return saved ? JSON.parse(saved) : ['General Workspace', 'Development', 'Design Assets'];
  });
  const [activeFolder, setActiveFolder] = useState<string>('All Folders');
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [showFolderInput, setShowFolderInput] = useState<boolean>(false);

  // Core Form Fields (Creation)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Todo');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('General Workspace');

  // Edit Mode States
  const [editingTask, setEditingTask] = useState<any | null>(null);

  // Activity Feed Logging State
  const [activities, setActivities] = useState<ActivityLog[]>(() => {
    const savedLogs = localStorage.getItem('syncsphere_logs');
    return savedLogs ? JSON.parse(savedLogs) : [
      { id: '1', message: 'SyncSphere Workspace initialized successfully.', timestamp: new Date().toLocaleTimeString(), type: 'system' }
    ];
  });

  // Interactive UI Modal/Toast States
  const [validationAlert, setValidationAlert] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string; title: string }>({
    open: false,
    id: '',
    title: ''
  });

  // Persist Theme choices
  useEffect(() => {
    localStorage.setItem('taskflow_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Persist Folders choice
  useEffect(() => {
    localStorage.setItem('taskflow_folders', JSON.stringify(folders));
  }, [folders]);

  // Persist Activity Logs
  useEffect(() => {
    localStorage.setItem('syncsphere_logs', JSON.stringify(activities));
  }, [activities]);

  const logActivity = (message: string, type: 'create' | 'update' | 'delete' | 'system') => {
    const newLog: ActivityLog = {
      id: Math.random().toString(),
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type
    };
    setActivities(prev => [newLog, ...prev.slice(0, 19)]); // Keep last 20 operations
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/tasks?limit=${limit}`);
      const data = await response.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Local sync connection dropped.");
      setValidationAlert("Network Fault: Could not connect to your backend API server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [limit]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationAlert(null);

    if (!title.trim() || title.length < 5) {
      setValidationAlert("Validation Fault: Task Title must contain at least 5 characters.");
      return;
    }
    if (!description.trim() || description.length < 10) {
      setValidationAlert("Validation Fault: Operational Details must contain at least 10 characters.");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: title.trim(), 
          description: description.trim(), 
          status, 
          priority, 
          dueDate: dueDate || undefined, 
          category: selectedFolder 
        }),
      });
      
      if (!response.ok) throw new Error("Payload rejected by backend guards.");
      
      logActivity(`Created task card "${title.trim()}" inside ${selectedFolder}.`, 'create');
      setTitle('');
      setDescription('');
      setDueDate('');
      fetchTasks();
    } catch (err) {
      setValidationAlert("Database entry rejection: Please check server status logs.");
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editingTask) return;

  // MongoDB uses _id by default. Ensure we are parsing it cleanly.
  const targetId = editingTask._id || editingTask.id;
  
  if (!targetId) {
    setValidationAlert("Validation Exception: Critical target identifier missing.");
    return;
  }

  try {
    const response = await fetch(`http://localhost:5000/tasks/${targetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editingTask.title,
        description: editingTask.description,
        status: editingTask.status,
        priority: editingTask.priority,
        dueDate: editingTask.dueDate,
        category: editingTask.category || 'General Workspace'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Update transmission rejected.");
    }

    logActivity(`Modified parameters for "${editingTask.title}" -> Status: [${editingTask.status}].`, 'update');
    setEditingTask(null);
    setValidationAlert(null); // Clear any lingering exception UI states
    fetchTasks();             // Refresh UI pipeline with fresh database document streams
  } catch (err: any) {
    console.error("Frontend routing catch block triggered:", err);
    setValidationAlert(`Failed to commit updates: ${err.message || 'Check backend console logs.'}`);
  }
};

  const triggerDeleteConfirmation = (task: any) => {
    const targetId = task.id || task._id;
    if (!targetId) {
      setValidationAlert("Error: Task ID could not be cleanly targeted.");
      return;
    }
    setDeleteModal({ open: true, id: targetId, title: task.title });
  };

  const handleConfirmedDelete = async () => {
    const targetId = deleteModal.id;
    if (!targetId) return;

    try {
      const response = await fetch(`http://localhost:5000/tasks/${targetId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error("Failed execution");
      
      logActivity(`Purged index entry record "${deleteModal.title}" from MongoDB.`, 'delete');
      setDeleteModal({ open: false, id: '', title: '' });
      fetchTasks();
    } catch (err) {
      setValidationAlert("Failed to erase record from MongoDB engine index.");
    }
  };

  const handleAddFolder = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newFolderName.trim();
    if (cleanName && !folders.includes(cleanName)) {
      setFolders([...folders, cleanName]);
      setSelectedFolder(cleanName);
      setNewFolderName('');
      setShowFolderInput(false);
      logActivity(`Provisioned brand new folder container segment "${cleanName}".`, 'system');
    }
  };

  const handleRemoveFolder = (folderName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedFolders = folders.filter(f => f !== folderName);
    setFolders(updatedFolders);
    logActivity(`Decommissioned cluster workspace tracking segment "${folderName}".`, 'delete');
    
    if (activeFolder === folderName) setActiveFolder('All Folders');
    if (selectedFolder === folderName) setSelectedFolder(updatedFolders[0] || 'General Workspace');
  };

  const filteredTasks = activeFolder === 'All Folders'
    ? tasks
    : tasks.filter(t => t.category === activeFolder);

  const getPriorityBadge = (priority: string) => {
    const styles = priority === 'High' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                   priority === 'Medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                   'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    return <span className={`text-[8px] px-2.5 py-0.5 rounded-lg font-black tracking-widest uppercase border-2 ${styles}`}>{priority}</span>;
  };

  return (
    <div className={`min-h-screen font-sans antialiased selection:bg-emerald-500/10 transition-colors duration-300 ${
      darkMode ? 'bg-[#0B1329] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* System Warning Toast Banner */}
      {validationAlert && (
        <div className={`fixed top-6 right-6 z-50 max-w-md w-full border-l-4 border-rose-500 shadow-xl p-4 rounded-r-xl flex items-start gap-3 border ${
          darkMode ? 'bg-[#1C2541] border-slate-700' : 'bg-white border-slate-200'
        } animate-slide-up`}>
          <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wider">System Exception</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{validationAlert}</p>
          </div>
          <button onClick={() => setValidationAlert(null)} className="text-slate-400 hover:text-rose-500 transition-colors">
            <XCircle size={16} />
          </button>
        </div>
      )}

      {/* Styled Top Branding Navbar Header */}
      <header className={`border-b-2 bg-opacity-90 sticky top-0 backdrop-blur-md z-30 shadow-sm transition-colors ${
        darkMode ? 'bg-[#111A31] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl shadow-md ${darkMode ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-white'}`}>
              <Layers size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-wider">SyncSphere</h1>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                <Users size={11} className="text-emerald-500" />
                <span>Engineered By:</span>
                <span className={darkMode ? 'text-slate-200' : 'text-slate-700'}>Shahzaib Shah</span>
                <span className="text-emerald-500">&amp;</span>
                <span className={darkMode ? 'text-slate-200' : 'text-slate-700'}>Syed Ahmed Raza</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-xl border-2 transition-all shadow-sm ${
                darkMode ? 'bg-[#1C2541] border-slate-700 text-amber-400 hover:border-slate-500' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
              }`}
            >
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <div className={`flex items-center gap-2.5 border-2 px-3.5 py-2 rounded-xl ${
              darkMode ? 'bg-[#1C2541] border-slate-700' : 'bg-slate-100 border-slate-200'
            }`}>
              <Sliders size={13} className="text-slate-400" />
              <select
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className={`border rounded-lg text-xs font-bold py-0.5 px-2 focus:outline-none focus:border-emerald-500 cursor-pointer ${
                  darkMode ? 'bg-[#0B1329] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="5">5 Rows</option>
                <option value="10">10 Rows</option>
                <option value="20">20 Rows</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Dynamic Folders Bar Section */}
        <div className={`mb-6 flex flex-wrap items-center gap-2 border-b-2 pb-5 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <button
            onClick={() => setActiveFolder('All Folders')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all uppercase flex items-center gap-2 border-2 ${
              activeFolder === 'All Folders'
                ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-md'
                : darkMode ? 'bg-[#1C2541] text-slate-300 border-slate-700 hover:border-slate-500' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
            }`}
          >
            <Inbox size={13} />
            All Storage
          </button>

          {folders.map(f => (
            <div
              key={f}
              onClick={() => setActiveFolder(f)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all uppercase flex items-center gap-2.5 border-2 cursor-pointer group ${
                activeFolder === f
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-950 dark:border-slate-100 shadow-md'
                  : darkMode ? 'bg-[#1C2541] text-slate-300 border-slate-700 hover:border-slate-500' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              <Folder size={13} className={activeFolder === f ? "text-emerald-400 dark:text-emerald-600" : "text-slate-400"} />
              <span>{f}</span>
              
              <button
                onClick={(e) => handleRemoveFolder(f, e)}
                className="p-0.5 rounded hover:bg-rose-500 hover:text-white transition-colors ml-1 text-slate-400"
              >
                <X size={11} />
              </button>
            </div>
          ))}

          <button 
            onClick={() => setShowFolderInput(!showFolderInput)}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border-2 shadow-sm ${
              darkMode ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <FolderPlus size={13} />
            New Directory
          </button>

          {showFolderInput && (
            <form onSubmit={handleAddFolder} className="flex items-center gap-2 animate-fade-in ml-2">
              <input
                type="text"
                required
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder identity..."
                className={`border-2 rounded-xl text-xs px-3 py-2 focus:outline-none focus:border-emerald-500 ${
                  darkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-2 rounded-xl font-bold uppercase tracking-wider transition-colors shadow-sm">
                Add
              </button>
            </form>
          )}
        </div>

        {/* Layout Mode Navigation Bar */}
        <div className="mb-8 flex flex-wrap items-center justify-start gap-1">
          {(['grid', 'kanban', 'list', 'calendar'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide uppercase flex items-center gap-2 border-2 transition-all ${
                viewMode === mode
                  ? 'bg-slate-900 border-slate-900 text-white dark:bg-slate-100 dark:border-slate-100 dark:text-slate-950 shadow-sm'
                  : darkMode ? 'bg-[#111A31] border-slate-800 text-slate-400 hover:border-slate-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
              }`}
            >
              {mode === 'grid' && <Grid size={13} />}
              {mode === 'kanban' && <Trello size={13} />}
              {mode === 'list' && <List size={13} />}
              {mode === 'calendar' && <Calendar size={13} />}
              <span className="capitalize">{mode} View</span>
            </button>
          ))}
        </div>

        {/* Dashboard 3-Column Content Map Block */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Column 1: Record Creation Segment Box */}
          <div className="lg:col-span-1 space-y-6">
            <div className={`border-2 rounded-2xl p-6 shadow-md relative overflow-hidden transition-colors ${
              darkMode ? 'bg-[#111A31] border-slate-800' : 'bg-white border-slate-300'
            }`}>
              <div className={`absolute top-0 left-0 w-full h-[4px] ${darkMode ? 'bg-emerald-500' : 'bg-slate-900'}`}></div>
              <h2 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                <PlusCircle size={15} className="text-emerald-500" />
                Initialize Entry
              </h2>

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1.5">Task Label</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Clean production logs"
                    className={`w-full border-2 rounded-xl px-4 py-3 text-xs focus:outline-none transition-all ${
                      darkMode ? 'bg-[#1C2541] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1.5">Execution Details</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide description directives..."
                    rows={3}
                    className={`w-full border-2 rounded-xl px-4 py-3 text-xs focus:outline-none transition-all resize-none ${
                      darkMode ? 'bg-[#1C2541] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1.5">Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className={`w-full border-2 rounded-xl p-3 text-xs ${
                      darkMode ? 'bg-[#1C2541] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}>
                      <option value="Todo">Todo</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1.5">Priority</label>
                    <select value={priority} onChange={(e) => setPriority(e.target.value)} className={`w-full border-2 rounded-xl p-3 text-xs ${
                      darkMode ? 'bg-[#1C2541] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1.5">Target Workspace</label>
                  <select value={selectedFolder} onChange={(e) => setSelectedFolder(e.target.value)} className={`w-full border-2 rounded-xl p-3 text-xs ${
                    darkMode ? 'bg-[#1C2541] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}>
                    {folders.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1.5">Target Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={`w-full border-2 rounded-xl px-4 py-3 text-xs ${
                      darkMode ? 'bg-[#1C2541] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <button type="submit" className={`w-full mt-2 font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-md text-xs ${
                  darkMode ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950' : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}>
                  Save Document State
                </button>
              </form>
            </div>
          </div>

          {/* Column 2 & 3: Interactive Workboards Pipeline View Router */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-28 space-y-3">
                <div className={`w-6 h-6 border-2 border-t-transparent rounded-full animate-spin ${darkMode ? 'border-emerald-400' : 'border-slate-900'}`}></div>
                <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold animate-pulse">Querying server layers...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className={`border-2 border-dashed rounded-2xl text-center py-24 shadow-sm ${
                darkMode ? 'bg-[#111A31] border-slate-800' : 'bg-white border-slate-300'
              }`}>
                <p className="text-slate-400 text-xs font-bold">Active Workspace Segment Empty</p>
              </div>
            ) : (
              <>
                {/* GRID VIEW */}
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                    {filteredTasks.map((task) => (
                      <div key={task.id || task._id} className={`border-2 rounded-2xl p-5 shadow-sm flex flex-col justify-between relative group ${
                        darkMode ? 'bg-[#111A31] border-slate-800 hover:border-slate-600' : 'bg-white border-slate-300 hover:border-slate-500'
                      }`}>
                        <div>
                          <div className="flex items-center justify-between mb-3.5">
                            {getPriorityBadge(task.priority)}
                            <span className={`text-[9px] border-2 px-2 py-0.5 rounded-md font-bold uppercase ${
                              darkMode ? 'bg-[#1C2541] border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
                            }`}>{task.status}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400 text-[9px] uppercase font-bold tracking-wider mb-2">
                            <Folder size={11} className="text-emerald-500" />
                            <span>{task.category || 'General Workspace'}</span>
                          </div>
                          <h3 className="text-sm font-bold mb-1.5 tracking-wide line-clamp-1">{task.title}</h3>
                          <p className="text-slate-400 text-xs leading-relaxed mb-4 line-clamp-2">{task.description}</p>
                        </div>
                        <div className={`pt-3.5 border-t-2 flex items-center justify-between text-[9px] text-slate-400 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                          <div className="flex flex-col gap-0.5">
                            <span>Logged: {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'N/A'}</span>
                            {task.dueDate && (
                              <span className={`font-bold flex items-center gap-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                <Calendar size={10} className="text-emerald-500" />
                                Target: {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => setEditingTask(task)}
                              className={`p-2 rounded-xl border-2 transition-all text-slate-400 hover:text-emerald-400 hover:border-emerald-500 ${darkMode ? 'bg-[#1C2541] border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                            >
                              <Edit2 size={11} />
                            </button>
                            <button
                              onClick={() => triggerDeleteConfirmation(task)}
                              className={`p-2 rounded-xl border-2 transition-all text-slate-400 hover:text-rose-400 hover:border-rose-500 ${darkMode ? 'bg-[#1C2541] border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* KANBAN BOARD */}
                {viewMode === 'kanban' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in items-start">
                    {['Todo', 'In Progress', 'Done'].map(columnStatus => {
                      const statusTasks = filteredTasks.filter(t => t.status === columnStatus);
                      return (
                        <div key={columnStatus} className={`border-2 rounded-2xl p-4 flex flex-col ${darkMode ? 'bg-[#111A31]/50 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                          <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-dashed border-slate-300 dark:border-slate-700">
                            <span className="text-[10px] uppercase font-black text-slate-400 flex items-center gap-2">
                              {columnStatus === 'Todo' && <Circle size={12} className="text-amber-500" />}
                              {columnStatus === 'In Progress' && <Sliders size={12} className="text-blue-500" />}
                              {columnStatus === 'Done' && <CheckCircle2 size={12} className="text-emerald-500" />}
                              {columnStatus}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${darkMode ? 'bg-[#1C2541]' : 'bg-white'} border border-slate-300 dark:border-slate-700`}>{statusTasks.length}</span>
                          </div>
                          <div className="space-y-3 min-h-[250px]">
                            {statusTasks.map(task => (
                              <div key={task.id || task._id} className={`border-2 rounded-xl p-4 shadow-sm ${darkMode ? 'bg-[#111A31] border-slate-700' : 'bg-white border-slate-300'}`}>
                                <div className="mb-2">{getPriorityBadge(task.priority)}</div>
                                <h4 className="text-xs font-bold mb-1 line-clamp-1">{task.title}</h4>
                                <p className="text-[11px] text-slate-400 mb-3 line-clamp-2 leading-relaxed">{task.description}</p>
                                <div className="flex items-center justify-between text-[9px] text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-800">
                                  <button onClick={() => setEditingTask(task)} className="text-slate-400 hover:text-emerald-500"><Edit2 size={10} /></button>
                                  <button onClick={() => triggerDeleteConfirmation(task)} className="text-slate-400 hover:text-rose-500"><Trash2 size={10} /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* COMPACT LIST VIEW */}
                {viewMode === 'list' && (
                  <div className={`border-2 rounded-2xl overflow-hidden shadow-sm animate-fade-in ${darkMode ? 'border-slate-800 bg-[#111A31]' : 'border-slate-300 bg-white'}`}>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className={`border-b-2 uppercase font-black text-[9px] tracking-widest text-slate-400 ${darkMode ? 'bg-[#161F38] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                          <th className="p-3.5">Label Ident</th>
                          <th className="p-3.5">Priority</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {filteredTasks.map(task => (
                          <tr key={task.id || task._id} className={darkMode ? 'hover:bg-[#161F38]' : 'hover:bg-slate-50'}>
                            <td className="p-3.5 font-bold tracking-wide truncate max-w-[150px]">{task.title}</td>
                            <td className="p-3.5">{getPriorityBadge(task.priority)}</td>
                            <td className="p-3.5">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${darkMode ? 'bg-[#1C2541] border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>{task.status}</span>
                            </td>
                            <td className="p-3.5 text-right space-x-1.5">
                              <button onClick={() => setEditingTask(task)} className="text-slate-400 hover:text-emerald-500"><Edit2 size={12} /></button>
                              <button onClick={() => triggerDeleteConfirmation(task)} className="text-slate-400 hover:text-rose-500"><Trash2 size={12} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* CALENDAR METRIC VIEW */}
                {viewMode === 'calendar' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                    {(() => {
                      const datedTasks = filteredTasks.filter(t => t.dueDate);
                      const nonDatedTasks = filteredTasks.filter(t => !t.dueDate);
                      const groups: { [key: string]: any[] } = {};
                      
                      datedTasks.forEach(t => {
                        const dateStr = new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                        if (!groups[dateStr]) groups[dateStr] = [];
                        groups[dateStr].push(t);
                      });

                      return (
                        <>
                          {Object.keys(groups).map(dateKey => (
                            <div key={dateKey} className={`border-2 rounded-2xl p-4 flex flex-col ${darkMode ? 'bg-[#111A31] border-slate-800' : 'bg-white border-slate-300'}`}>
                              <div className="text-[10px] uppercase font-black text-emerald-500 tracking-wider mb-3 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
                                <Calendar size={11} /> {dateKey}
                              </div>
                              <div className="space-y-2">
                                {groups[dateKey].map(task => (
                                  <div key={task.id || task._id} className={`p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between ${darkMode ? 'bg-[#1C2541]' : 'bg-slate-50'}`}>
                                    <h5 className="text-xs font-bold line-clamp-1">{task.title}</h5>
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
                                      <button onClick={() => setEditingTask(task)} className="text-slate-400 hover:text-emerald-500"><Edit2 size={10} /></button>
                                      <button onClick={() => triggerDeleteConfirmation(task)} className="text-slate-400 hover:text-rose-500"><Trash2 size={10} /></button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                          {nonDatedTasks.length > 0 && (
                            <div className={`border-2 rounded-2xl p-4 flex flex-col ${darkMode ? 'bg-[#111A31] border-slate-800' : 'bg-white border-slate-300'}`}>
                              <div className="text-[10px] uppercase font-black text-amber-500 tracking-wider mb-3 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
                                <HelpCircle size={11} /> Unscheduled
                              </div>
                              <div className="space-y-2">
                                {nonDatedTasks.map(task => (
                                  <div key={task.id || task._id} className={`p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between ${darkMode ? 'bg-[#1C2541]' : 'bg-slate-50'}`}>
                                    <h5 className="text-xs font-bold line-clamp-1">{task.title}</h5>
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
                                      <button onClick={() => setEditingTask(task)} className="text-slate-400 hover:text-emerald-500"><Edit2 size={10} /></button>
                                      <button onClick={() => triggerDeleteConfirmation(task)} className="text-slate-400 hover:text-rose-500"><Trash2 size={10} /></button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Column 4: Premium Workspace Audit Activity Ledger Log */}
          <div className="lg:col-span-1">
            <div className={`border-2 rounded-2xl p-5 shadow-sm sticky top-28 max-h-[75vh] flex flex-col justify-between overflow-hidden ${
              darkMode ? 'bg-[#111A31] border-slate-800' : 'bg-white border-slate-300'
            }`}>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-4 pb-3 border-b-2 border-slate-200 dark:border-slate-800">
                  <Activity size={14} className="text-emerald-500 animate-pulse" />
                  Activity Stream Log
                </h3>
                <div className="space-y-3 overflow-y-auto max-h-[55vh] pr-1 scrollbar-thin">
                  {activities.map((log) => (
                    <div key={log.id} className="text-[11px] leading-relaxed border-l-2 pl-3 pb-1 border-slate-300 dark:border-slate-700">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[9px] uppercase font-bold">
                        <Clock size={10} />
                        <span>{log.timestamp}</span>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          log.type === 'create' ? 'bg-emerald-500' :
                          log.type === 'update' ? 'bg-blue-500' :
                          log.type === 'delete' ? 'bg-rose-500' : 'bg-slate-400'
                        }`} />
                      </div>
                      <p className={`mt-0.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{log.message}</p>
                    </div>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => setActivities([{ id: '1', message: 'Log index context wiped clean.', timestamp: new Date().toLocaleTimeString(), type: 'system' }])}
                className="text-[9px] uppercase font-black text-slate-400 hover:text-rose-500 text-center pt-3 border-t border-slate-200 dark:border-slate-800 transition-colors"
              >
                Clear Stream Audit Index
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* CORE FORM PARAMETERS EDIT COMPONENT MODAL BANNER */}
      {editingTask && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className={`border-2 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-slide-up ${
            darkMode ? 'bg-[#111A31] border-slate-700' : 'bg-white border-slate-300'
          }`}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <Edit2 size={13} className="text-emerald-500" /> Commit Schema Changes
              </h3>
              <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-rose-500"><X size={16} /></button>
            </div>
            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Task Title</label>
                <input
                  type="text" required
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className={`w-full border-2 rounded-xl px-3 py-2 text-xs focus:outline-none ${darkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Description</label>
                <textarea
                  required rows={2}
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className={`w-full border-2 rounded-xl px-3 py-2 text-xs focus:outline-none resize-none ${darkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Status</label>
                  <select value={editingTask.status} onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })} className={`w-full border-2 rounded-xl p-2 text-xs ${darkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-300'}`}>
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Priority</label>
                  <select value={editingTask.priority} onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })} className={`w-full border-2 rounded-xl p-2 text-xs ${darkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-300'}`}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingTask(null)} className={`w-1/2 font-bold py-2.5 rounded-xl text-xs uppercase ${darkMode ? 'bg-[#1C2541] border-slate-600' : 'bg-slate-100'}`}>Cancel</button>
                <button type="submit" className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase">Commit Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal Prompt Window */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`border-2 rounded-2xl max-w-sm w-full p-6 text-center ${darkMode ? 'bg-[#111A31] border-slate-700' : 'bg-white border-slate-300'}`}>
            <div className="mx-auto w-11 h-11 bg-rose-500/10 text-rose-500 border-2 border-rose-500/20 rounded-full flex items-center justify-center mb-4"><Trash2 size={20} /></div>
            <h3 className="text-sm font-black uppercase tracking-wider mb-2">Confirm Data Purge</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">Are you sure you want to delete <span className="font-bold text-rose-400">"{deleteModal.title}"</span>?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal({ open: false, id: '', title: '' })} className={`w-1/2 border-2 font-bold py-2.5 rounded-xl text-xs uppercase ${darkMode ? 'bg-[#1C2541] border-slate-600 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>Cancel</button>
              <button onClick={handleConfirmedDelete} className="w-1/2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}