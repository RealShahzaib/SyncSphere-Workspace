import React, { useEffect, useState } from 'react';
import { 
  Layers, Sliders, Trash2, XCircle, PlusCircle, Calendar, LogOut, Lock, Mail,
  AlertCircle, Folder, FolderPlus, Inbox, X, Sun, Moon, Users, LayoutDashboard,
  Grid, Trello, List, CheckCircle2, Circle, HelpCircle, Edit2, Activity, Clock,
  ChevronRight, ArrowUpRight, Check, Search, Filter, ShieldCheck, Database
} from 'lucide-react';

type ViewMode = 'grid' | 'kanban' | 'list' | 'calendar';
type ActiveTab = 'dashboard' | 'create';

interface ActivityLog {
  id: string;
  message: string;
  timestamp: string;
  type: 'create' | 'update' | 'delete' | 'system' | 'auth';
}

export default function App() {
  // Authentication Core State
  const [user, setUser] = useState<any>(() => {
    const savedUser = localStorage.getItem('syncsphere_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Core App Layout Navigation States
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // Data State Arrays
  const [tasks, setTasks] = useState<any[]>([]);
  const [limit, setLimit] = useState<string>('15');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Dynamic Theme Controller
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('taskflow_theme');
    return savedTheme ? savedTheme === 'dark' : true; 
  });

  // Dynamic Multi-Workspace folders
  const [folders, setFolders] = useState<string[]>(() => {
    const saved = localStorage.getItem('taskflow_folders');
    return saved ? JSON.parse(saved) : ['General Workspace', 'Development', 'Design Assets', 'Marketing QA'];
  });
  const [activeFolder, setActiveFolder] = useState<string>('All Folders');
  const [newFolderInput, setNewFolderInput] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);

  // Form States (New Task Creation)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Todo');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('General Workspace');

  // Interactive UI Overlays and Modals Modifiers
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [validationAlert, setValidationAlert] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string; title: string }>({ open: false, id: '', title: '' });

  // Activity Log Streaming Tracker
  const [activities, setActivities] = useState<ActivityLog[]>(() => {
    const savedLogs = localStorage.getItem('syncsphere_logs');
    return savedLogs ? JSON.parse(savedLogs) : [
      { id: 'init-1', message: 'Workspace dashboard and services successfully initialized.', timestamp: '12:00 AM', type: 'system' }
    ];
  });

  // Global Sync Synchronization Subsystems
  useEffect(() => { localStorage.setItem('taskflow_theme', darkMode ? 'dark' : 'light'); }, [darkMode]);
  useEffect(() => { localStorage.setItem('taskflow_folders', JSON.stringify(folders)); }, [folders]);
  useEffect(() => { localStorage.setItem('syncsphere_logs', JSON.stringify(activities)); }, [activities]);

  // Flash Feedback Controller Trigger
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const logActivity = (message: string, type: 'create' | 'update' | 'delete' | 'system' | 'auth') => {
    const newLog: ActivityLog = {
      id: Math.random().toString(36).substring(2, 9),
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type
    };
    setActivities(prev => [newLog, ...prev.slice(0, 25)]);
  };

  // Auth Submit Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationAlert(null);
    setAuthLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setUser(data.user);
        localStorage.setItem('syncsphere_user', JSON.stringify(data.user));
        logActivity(`User ${data.user.name} logged in successfully.`, 'auth');
        triggerToast(`Welcome back, ${data.user.name.split(' ')[0]}!`);
      } else {
        setValidationAlert(data.error || 'Invalid login details. Please try again.');
        logActivity(`Failed login attempt for account: ${loginEmail}`, 'system');
      }
    } catch {
      setValidationAlert('Authentication server offline. Check your backend connection.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    logActivity(`User ${user?.name || ''} logged out of the session.`, 'auth');
    setUser(null);
    localStorage.removeItem('syncsphere_user');
  };

  // Data Fetching Tunnel Pipeline
  const fetchTasks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/tasks?limit=${limit}`);
      const data = await response.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch {
      setValidationAlert("Network error: Could not load your tasks from the database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, [limit, user]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationAlert(null);
    if (title.trim().length < 5) {
      setValidationAlert("Validation Warning: Task Title must be at least 5 characters long.");
      return;
    }
    if (description.trim().length < 10) {
      setValidationAlert("Validation Warning: Description must be at least 10 characters long.");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          description, 
          status, 
          priority, 
          dueDate: dueDate || undefined, 
          category: selectedFolder 
        }),
      });
      if (!response.ok) throw new Error();
      
      logActivity(`Created task "${title}" in folder: ${selectedFolder}.`, 'create');
      triggerToast("New task created successfully.");
      
      setTitle(''); setDescription(''); setDueDate(''); setStatus('Todo'); setPriority('Medium');
      setActiveTab('dashboard');
      fetchTasks();
    } catch {
      setValidationAlert("Database Error: Failed to save your new task.");
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    const targetId = editingTask._id || editingTask.id;
    try {
      const response = await fetch(`http://localhost:5000/tasks/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTask)
      });
      if (!response.ok) throw new Error();
      
      logActivity(`Updated task details for "${editingTask.title}".`, 'update');
      triggerToast("Task changes saved successfully.");
      setEditingTask(null);
      fetchTasks();
    } catch {
      setValidationAlert("Update Error: Changes could not be saved.");
    }
  };

  const handleConfirmedDelete = async () => {
    if (!deleteModal.id) return;
    try {
      const response = await fetch(`http://localhost:5000/tasks/${deleteModal.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error();
      
      logActivity(`Deleted task entry: "${deleteModal.title}"`, 'delete');
      triggerToast("Task removed successfully.");
      setDeleteModal({ open: false, id: '', title: '' });
      fetchTasks();
    } catch {
      setValidationAlert("Delete Error: Could not delete this task item.");
    }
  };

  const handleAddFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderInput.trim() && !folders.includes(newFolderInput.trim())) {
      const folderName = newFolderInput.trim();
      setFolders([...folders, folderName]);
      logActivity(`Created new workspace folder: ${folderName}`, 'system');
      setNewFolderInput('');
      setShowFolderModal(false);
      setSelectedFolder(folderName);
    }
  };

  // Filtration Engine Processing
  const filteredTasks = tasks.filter(task => {
    const matchesFolder = activeFolder === 'All Folders' || task.category === activeFolder;
    const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesStatus && matchesSearch;
  });

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'Done': return 'text-emerald-500';
      case 'In Progress': return 'text-cyan-500';
      default: return 'text-slate-400';
    }
  };

  // =========================================================================
  // VIEW INTERFACE 1: USER FRIENDLY CLEAN LOGIN SCREEN
  // =========================================================================
  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-sans antialiased relative overflow-hidden transition-colors duration-500 ${darkMode ? 'bg-[#060B26] text-white' : 'bg-slate-50 text-slate-900'}`}>
        
        {/* Decorative Grid Patterns */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20 dark:opacity-40">
          <div className="absolute -top-[30%] -left-[20%] w-[700px] h-[700px] bg-emerald-500/20 rounded-full filter blur-[120px] animate-pulse"></div>
          <div className="absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] bg-cyan-500/20 rounded-full filter blur-[140px]"></div>
          <div className="w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>

        <div className="absolute top-6 right-6 z-10">
          <button onClick={() => setDarkMode(!darkMode)} className={`p-3 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 shadow-md flex items-center gap-2 font-bold text-xs uppercase tracking-wider ${darkMode ? 'bg-[#121B3A] border-slate-700 text-amber-400' : 'bg-white border-slate-200 text-slate-700'}`}>
            {darkMode ? <><Sun size={14} /> Light Mode</> : <><Moon size={14} /> Dark Mode</>}
          </button>
        </div>

        <div className={`w-full max-w-lg mx-4 border-2 rounded-2xl p-10 relative z-10 transition-all duration-500 transform hover:translate-y-[-2px] ${darkMode ? 'bg-[#0E1738]/80 border-slate-800/80 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl' : 'bg-white border-slate-300/90 shadow-2xl'}`}>
          <div className="absolute top-0 left-0 w-full h-[5px] bg-gradient-to-r from-emerald-400 to-cyan-500"></div>
          
          <div className="text-center mb-10">
            <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-950 mb-4 shadow-lg shadow-emerald-500/20 transform hover:rotate-6 transition-transform duration-300">
              <Layers size={28} />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-wider bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-500 bg-clip-text text-transparent">
              SyncSphere Login
            </h2>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest flex items-center justify-center gap-1">
              <ShieldCheck size={12} className="text-emerald-500" /> Administrative Access Portal
            </p>
          </div>

          {validationAlert && (
            <div className="mb-6 p-4 bg-rose-500/10 border-2 border-rose-500/20 rounded-xl text-xs text-rose-500 dark:text-rose-400 flex items-start gap-3">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-black uppercase tracking-wider block mb-0.5">Login Problem</span>
                <span>{validationAlert}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-black mb-2">Email Address</label>
              <div className="relative group">
                <Mail size={16} className="absolute left-4 top-4 text-slate-400 transition-colors group-focus-within:text-emerald-400" />
                <input 
                  type="email" 
                  required 
                  value={loginEmail} 
                  onChange={(e) => setLoginEmail(e.target.value)} 
                  placeholder="shahzaib@syncsphere.com" 
                  className={`w-full border-2 rounded-xl pl-12 pr-4 py-3.5 text-xs focus:outline-none font-medium transition-all duration-300 ${darkMode ? 'bg-[#151F45] border-slate-700/80 text-white focus:border-emerald-500/80 shadow-inner' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500 focus:bg-white'}`} 
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-black mb-2">Account Password</label>
              <div className="relative group">
                <Lock size={16} className="absolute left-4 top-4 text-slate-400 transition-colors group-focus-within:text-emerald-400" />
                <input 
                  type="password" 
                  required 
                  value={loginPassword} 
                  onChange={(e) => setLoginPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className={`w-full border-2 rounded-xl pl-12 pr-4 py-3.5 text-xs focus:outline-none font-medium transition-all duration-300 ${darkMode ? 'bg-[#151F45] border-slate-700/80 text-white focus:border-emerald-500/80 shadow-inner' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500 focus:bg-white'}`} 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={authLoading}
              className="w-full font-black uppercase tracking-widest py-4 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 hover:from-emerald-500 hover:to-cyan-600 text-slate-950 transition-all duration-300 text-xs shadow-lg shadow-emerald-500/10 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {authLoading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>Sign In Securely <ArrowUpRight size={14} /></>
              )}
            </button>
          </form>

          <div className={`mt-8 pt-6 border-t-2 border-dashed text-center text-[10px] font-black uppercase tracking-widest ${darkMode ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
            Default Password Token: <span className="text-emerald-500 font-mono ml-1">admin123</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW INTERFACE 2: SYNCSPHERE DASHBOARD WORKSPACE
  // =========================================================================
  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-500 ${darkMode ? 'bg-[#060B26] text-slate-100' : 'bg-[#F4F6FA] text-slate-900'}`}>
      
      {/* Action Toast Overlays */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-black uppercase tracking-wider animate-slideInRight border border-white/10">
          <CheckCircle2 size={16} /> <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Responsive Application Navbar */}
      <header className={`border-b-2 sticky top-0 backdrop-blur-md z-40 transition-all duration-500 ${darkMode ? 'bg-[#0E1738]/90 border-slate-800/90 shadow-[0_4px_20px_rgba(0,0,0,0.3)]' : 'bg-white/95 border-slate-200 shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          
          <div className="flex items-center gap-4 group">
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-950 shadow-md shadow-emerald-500/10 transition-transform group-hover:rotate-6 duration-300">
              <Layers size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black uppercase tracking-wider bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">SyncSphere</h1>
                <span className="text-[8px] px-2 py-0.5 rounded-full font-black border tracking-widest bg-emerald-500/10 border-emerald-500/20 text-emerald-500">LIVE</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-[9px] uppercase tracking-wider text-slate-400 font-black">
                <Users size={12} className="text-cyan-500" />
                <span>Current User:</span> 
                <span className={`font-mono ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{user.name} ({user.role})</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Nav Switch Links */}
            <nav className={`flex p-1 rounded-xl border-2 transition-colors duration-300 ${darkMode ? 'bg-[#121B3A] border-slate-800' : 'bg-slate-200/70 border-slate-300/60'}`}>
              <button 
                onClick={() => setActiveTab('dashboard')} 
                className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all duration-300 ${activeTab === 'dashboard' ? 'bg-slate-950 text-white dark:bg-gradient-to-r dark:from-emerald-400 dark:to-cyan-400 dark:text-slate-950 shadow-lg' : 'text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
              >
                <LayoutDashboard size={14} /> View Board
              </button>
              <button 
                onClick={() => setActiveTab('create')} 
                className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all duration-300 ${activeTab === 'create' ? 'bg-slate-950 text-white dark:bg-gradient-to-r dark:from-emerald-400 dark:to-cyan-400 dark:text-slate-950 shadow-lg' : 'text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
              >
                <PlusCircle size={14} /> Create Task
              </button>
            </nav>

            <div className={`w-[2px] h-8 ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>

            <button onClick={() => setDarkMode(!darkMode)} className={`p-3 rounded-xl border-2 transition-all duration-300 ${darkMode ? 'bg-[#121B3A] border-slate-700 text-amber-400 hover:bg-[#19244E]' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'}`}>
              {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            
            <button onClick={handleLogout} className="p-3 rounded-xl border-2 border-rose-500/20 bg-rose-500/10 text-rose-500 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-all duration-300 shadow-sm">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Workstation Screen Viewport Panel Area */}
          <div className="lg:col-span-3 space-y-6">
            {activeTab === 'dashboard' ? (
              <div className="space-y-6">
                
                {/* Filtration Card Wrapper block Component */}
                <div className={`border-2 rounded-2xl p-6 transition-all duration-500 ${darkMode ? 'bg-[#0E1738] border-slate-800/80 shadow-md' : 'bg-white border-slate-300/80 shadow-sm'}`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    
                    {/* Search Field Bar Control layout */}
                    <div className="relative flex-1 group">
                      <Search size={14} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-emerald-400" />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search tasks by name or text details..." 
                        className={`w-full border-2 rounded-xl pl-11 pr-4 py-2.5 text-xs focus:outline-none transition-all duration-300 ${darkMode ? 'bg-[#151F45] border-slate-700/80 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500 focus:bg-white'}`}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Filter Task Item Status Dropdown Option selection */}
                      <div className="flex items-center gap-2">
                        <Filter size={12} className="text-slate-400" />
                        <select 
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className={`border-2 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider focus:outline-none transition-colors ${darkMode ? 'bg-[#151F45] border-slate-700 text-slate-200 focus:border-emerald-500' : 'bg-white border-slate-300 text-slate-800'}`}
                        >
                          <option value="All">All Statuses</option>
                          <option value="Todo">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Done">Completed</option>
                        </select>
                      </div>

                      {/* Task Grid Mode Display Panel Toggle Option buttons selectors */}
                      <div className={`flex p-1 rounded-xl border ${darkMode ? 'bg-[#151F45] border-slate-700' : 'bg-slate-100 border-slate-300/70'}`}>
                        {([
                          { mode: 'grid', label: 'Grid View', icon: <Grid size={13} /> },
                          { mode: 'kanban', label: 'Kanban Board', icon: <Trello size={13} /> },
                          { mode: 'list', label: 'Task List', icon: <List size={13} /> },
                          { mode: 'calendar', label: 'Calendar', icon: <Calendar size={13} /> }
                        ]).map(({ mode, label, icon }) => (
                          <button 
                            key={mode} 
                            onClick={() => setViewMode(mode as ViewMode)} 
                            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-1.5 transition-all duration-300 ${viewMode === mode ? 'bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                          >
                            {icon} <span className="hidden sm:inline text-[9px]">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Workspace Folders Lists components arrays */}
                  <div className={`mt-6 pt-5 border-t-2 flex flex-wrap items-center gap-2 ${darkMode ? 'border-slate-800/80' : 'border-slate-200/60'}`}>
                    <button 
                      onClick={() => setActiveFolder('All Folders')} 
                      className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase border-2 flex items-center gap-1.5 transition-all duration-300 ${activeFolder === 'All Folders' ? 'bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950 border-transparent shadow-md' : 'bg-transparent text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-200'}`}
                    >
                      <Inbox size={12} /> All Folders
                    </button>
                    
                    {folders.map(folderName => (
                      <button 
                        key={folderName} 
                        onClick={() => setActiveFolder(folderName)} 
                        className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase border-2 flex items-center gap-1.5 transition-all duration-300 ${activeFolder === folderName ? 'bg-slate-950 text-white border-slate-950 dark:bg-slate-100 dark:text-slate-950 dark:border-slate-100 shadow-md' : 'text-slate-400 border-transparent hover:bg-slate-200/50 dark:hover:bg-slate-800/40'}`}
                      >
                        <Folder size={12} className="text-cyan-500" /> {folderName}
                      </button>
                    ))}

                    <button 
                      onClick={() => setShowFolderModal(true)}
                      className={`px-3 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase border-2 border-dashed border-slate-400 dark:border-slate-700 text-slate-400 hover:text-emerald-500 hover:border-emerald-500/40 transition-colors ml-auto flex items-center gap-1`}
                    >
                      <FolderPlus size={12} /> New Folder
                    </button>
                  </div>
                </div>

                {/* Database Connection loading handler conditional render blocks UI */}
                {loading ? (
                  <div className="text-center py-24 border-2 border-dashed rounded-2xl dark:border-slate-800 border-slate-300 flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs uppercase font-black tracking-widest text-slate-400 animate-pulse">Loading tasks from database...</p>
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="text-center py-24 border-2 border-dashed rounded-2xl dark:border-slate-800 border-slate-300 flex flex-col items-center justify-center text-slate-400">
                    <Database size={24} className="mb-2 text-slate-500" />
                    <p className="text-xs uppercase font-black tracking-widest">No Tasks Found</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-1">There are no tasks matching your selected filters.</p>
                  </div>
                ) : (
                  <div className="transition-all duration-500">
                    
                    {/* VIEW ARCHITECTURE 1: STANDARD TASK CARD GRID SECTION */}
                    {viewMode === 'grid' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {filteredTasks.map((task) => (
                          <div 
                            key={task._id || task.id} 
                            className={`border-2 rounded-2xl p-6 flex flex-col justify-between shadow-sm relative group transition-all duration-300 hover:shadow-lg hover:translate-y-[-2px] ${darkMode ? 'bg-[#0E1738] border-slate-800/80 hover:border-slate-700' : 'bg-white border-slate-300/80 hover:border-slate-400'}`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                {getPriorityBadge(task.priority)}
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-1.5 h-1.5 rounded-full bg-current ${getStatusColor(task.status === 'Todo' ? 'Todo' : task.status === 'Done' ? 'Done' : 'In Progress')}`}></span>
                                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                    {task.status === 'Todo' ? 'To Do' : task.status === 'Done' ? 'Completed' : 'In Progress'}
                                  </span>
                                </div>
                              </div>
                              <h3 className={`text-sm font-black mb-1.5 group-hover:text-emerald-500 transition-colors truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{task.title}</h3>
                              <p className="text-slate-400 text-xs mb-6 line-clamp-3 leading-relaxed">{task.description}</p>
                            </div>
                            
                            <div className={`pt-4 border-t-2 flex justify-between items-center ${darkMode ? 'border-slate-800/80' : 'border-slate-100'}`}>
                              <div className="flex items-center gap-1.5 text-slate-400">
                                <Folder size={11} className="text-cyan-500" />
                                <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">{task.category}</span>
                              </div>
                              <div className="flex gap-2 text-slate-400">
                                <button onClick={() => setEditingTask(task)} className="p-2 rounded-lg bg-slate-100 dark:bg-[#151F45] hover:text-emerald-400 transition-colors"><Edit2 size={12} /></button>
                                <button onClick={() => setDeleteModal({ open: true, id: task._id || task.id, title: task.title })} className="p-2 rounded-lg bg-slate-100 dark:bg-[#151F45] hover:text-rose-400 transition-colors"><Trash2 size={12} /></button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* VIEW ARCHITECTURE 2: KANBAN COLUMN STATS PROGRESS BOARDS */}
                    {viewMode === 'kanban' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                        {['Todo', 'In Progress', 'Done'].map(colName => {
                          const colTasks = filteredTasks.filter(t => t.status === colName);
                          return (
                            <div key={colName} className={`border-2 rounded-2xl p-5 transition-colors ${darkMode ? 'bg-[#0E1738]/40 border-slate-800/60' : 'bg-slate-200/40 border-slate-300/50'}`}>
                              <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-dashed border-slate-700/50">
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full bg-current ${getStatusColor(colName)}`}></span> {colName === 'Todo' ? 'To Do' : colName === 'Done' ? 'Completed' : 'In Progress'}
                                </h4>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-400 font-bold">{colTasks.length}</span>
                              </div>
                              <div className="space-y-4">
                                {colTasks.map(task => (
                                  <div key={task._id || task.id} className={`border-2 rounded-xl p-4 shadow-sm group transition-all duration-200 hover:border-slate-500 ${darkMode ? 'bg-[#0E1738] border-slate-800' : 'bg-white border-slate-300'}`}>
                                    <h5 className={`text-xs font-black tracking-wide mb-1.5 line-clamp-1 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{task.title}</h5>
                                    <p className="text-slate-400 text-[11px] line-clamp-2 mb-3 leading-normal">{task.description}</p>
                                    <div className="flex justify-between items-center pt-2 border-t dark:border-slate-800 border-slate-100">
                                      {getPriorityBadge(task.priority)}
                                      <button onClick={() => setEditingTask(task)} className="text-slate-400 hover:text-emerald-400 p-1"><Edit2 size={11} /></button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* VIEW ARCHITECTURE 3: LEDGER LIST DATA TABLE ROWS */}
                    {viewMode === 'list' && (
                      <div className={`border-2 rounded-2xl overflow-hidden shadow-sm transition-colors ${darkMode ? 'border-slate-800 bg-[#0E1738]' : 'border-slate-300 bg-white'}`}>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs min-w-[600px]">
                            <thead className={`font-black uppercase tracking-widest text-slate-400 border-b-2 ${darkMode ? 'bg-[#121B3A] border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                              <tr>
                                <th className="p-4.5 pl-6">Task Title & Details</th>
                                <th className="p-4.5">Workspace Folder</th>
                                <th className="p-4.5">Priority</th>
                                <th className="p-4.5">Task Status</th>
                                <th className="p-4.5 text-right pr-6">Actions</th>
                              </tr>
                            </thead>
                            <tbody className={`divide-y-2 ${darkMode ? 'divide-slate-800/80' : 'divide-slate-200/60'}`}>
                              {filteredTasks.map(task => (
                                <tr key={task._id || task.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/20' : 'hover:bg-slate-50'}`}>
                                  <td className="p-4 pl-6">
                                    <div className={`font-black text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>{task.title}</div>
                                    <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">{task.description}</div>
                                  </td>
                                  <td className="p-4 uppercase text-[10px] tracking-wider font-black text-slate-400">
                                    <span className="bg-slate-100 dark:bg-[#151F45] px-2.5 py-1 rounded-lg border dark:border-slate-700">{task.category}</span>
                                  </td>
                                  <td className="p-4">{getPriorityBadge(task.priority)}</td>
                                  <td className="p-4">
                                    <span className={`text-[10px] uppercase font-black tracking-widest flex items-center gap-1.5 ${getStatusColor(task.status)}`}>
                                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span> {task.status === 'Todo' ? 'To Do' : task.status === 'Done' ? 'Completed' : 'In Progress'}
                                    </span>
                                  </td>
                                  <td className="p-4 text-right pr-6 space-x-2 text-slate-400">
                                    <button onClick={() => setEditingTask(task)} className="p-2 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 hover:text-emerald-400 transition-colors"><Edit2 size={12} /></button>
                                    <button onClick={() => setDeleteModal({ open: true, id: task._id || task.id, title: task.title })} className="p-2 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 hover:text-rose-400 transition-colors"><Trash2 size={12} /></button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* VIEW ARCHITECTURE 4: DEADLINE HORIZONS TIMELINE VIEWPORTS */}
                    {viewMode === 'calendar' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        {Array.from(new Set(filteredTasks.map(t => t.dueDate ? new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Due Date'))).map(dateGroup => (
                          <div key={dateGroup} className={`border-2 rounded-2xl p-5 shadow-sm transition-colors ${darkMode ? 'bg-[#0E1738] border-slate-800' : 'bg-white border-slate-300'}`}>
                            <div className="text-[10px] font-black text-cyan-500 dark:text-cyan-400 uppercase tracking-widest mb-4 border-b-2 pb-2 flex items-center gap-1.5">
                              <Calendar size={12} /> {dateGroup}
                            </div>
                            <div className="space-y-3">
                              {filteredTasks.filter(t => (t.dueDate ? new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Due Date') === dateGroup).map(task => (
                                <div key={task._id || task.id} className={`p-3 rounded-xl border flex justify-between items-center transition-all ${darkMode ? 'bg-[#151F45] border-slate-700 text-slate-200 hover:border-slate-600' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-400'}`}>
                                  <div className="truncate pr-2">
                                    <div className={`font-bold text-xs truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{task.title}</div>
                                    <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mt-0.5">{task.status === 'Todo' ? 'To Do' : task.status === 'Done' ? 'Completed' : 'In Progress'}</div>
                                  </div>
                                  <button onClick={() => setEditingTask(task)} className="text-slate-400 hover:text-emerald-400 p-1.5"><Edit2 size={11} /></button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // =========================================================================
              // TAB SECTION 2: SIMPLIFIED EASY CREATE TASK WORKSPACE FORM OVERLAYS
              // =========================================================================
              <div className={`border-2 rounded-2xl p-8 shadow-md relative transition-all duration-500 ${darkMode ? 'bg-[#0E1738] border-slate-800/90' : 'bg-white border-slate-300/90'}`}>
                <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-emerald-400 to-cyan-500"></div>
                
                <h2 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2.5 text-emerald-500 dark:text-emerald-400">
                  <PlusCircle size={16} /> Create New Workspace Task
                </h2>

                {validationAlert && (
                  <div className="mb-6 p-4 bg-rose-500/10 border-2 border-rose-500/20 rounded-xl text-xs text-rose-500 dark:text-rose-400 flex items-center gap-2">
                    <AlertCircle size={14} /> <span className="font-bold">{validationAlert}</span>
                  </div>
                )}

                <form onSubmit={handleCreateTask} className="space-y-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-black mb-2">Task Title (Minimum 5 characters)</label>
                    <input 
                      type="text" 
                      required 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      className={`w-full border-2 rounded-xl px-4 py-3 text-xs focus:outline-none font-medium transition-all ${darkMode ? 'bg-[#151F45] border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500 focus:bg-white'}`} 
                      placeholder="e.g., Build home UI layout components..." 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-black mb-2">Task Description or Notes (Minimum 10 characters)</label>
                    <textarea 
                      required 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)} 
                      rows={5} 
                      className={`w-full border-2 rounded-xl px-4 py-3 text-xs focus:outline-none font-medium resize-none transition-all ${darkMode ? 'bg-[#151F45] border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500 focus:bg-white'}`} 
                      placeholder="Enter specific checklist markers, references, or instructions..." 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-black mb-2">Task Status</label>
                      <select 
                        value={status} 
                        onChange={(e) => setStatus(e.target.value)} 
                        className={`w-full border-2 rounded-xl p-3 text-xs font-bold uppercase tracking-wider focus:outline-none transition-colors ${darkMode ? 'bg-[#151F45] border-slate-700 text-white focus:border-emerald-500' : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'}`}
                      >
                        <option value="Todo">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Completed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-black mb-2">Priority Urgency</label>
                      <select 
                        value={priority} 
                        onChange={(e) => setPriority(e.target.value)} 
                        className={`w-full border-2 rounded-xl p-3 text-xs font-bold uppercase tracking-wider focus:outline-none transition-colors ${darkMode ? 'bg-[#151F45] border-slate-700 text-white focus:border-emerald-500' : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'}`}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-black mb-2">Assign to Workspace Folder</label>
                      <select 
                        value={selectedFolder} 
                        onChange={(e) => setSelectedFolder(e.target.value)} 
                        className={`w-full border-2 rounded-xl p-3 text-xs font-bold uppercase tracking-wider focus:outline-none transition-colors ${darkMode ? 'bg-[#151F45] border-slate-700 text-white focus:border-emerald-500' : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'}`}
                      >
                        {folders.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-black mb-2">Target Due Date Deadline</label>
                    <div className="relative">
                      <input 
                        type="date" 
                        value={dueDate} 
                        onChange={(e) => setDueDate(e.target.value)} 
                        className={`w-full border-2 rounded-xl px-4 py-3.5 text-xs focus:outline-none font-bold transition-all ${darkMode ? 'bg-[#151F45] border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500 focus:bg-white'}`} 
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full font-black uppercase tracking-widest py-4 rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-500 hover:opacity-95 text-slate-950 text-xs shadow-lg shadow-emerald-500/10 active:scale-[0.995] transition-transform"
                  >
                    Add Task to Workspace
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Right Column Layout Sidebar Widgets: Summary statistics counters cards */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Quick Totals Tracker Component Widget metrics */}
            <div className={`border-2 rounded-2xl p-5 shadow-sm transition-all duration-500 ${darkMode ? 'bg-[#0E1738] border-slate-800' : 'bg-white border-slate-300'}`}>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                <Sliders size={12} className="text-cyan-400" /> Workspace Analytics
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 border-2 rounded-xl text-center ${darkMode ? 'bg-[#121B3A] border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-lg font-black tracking-tight font-mono text-emerald-500">{tasks.length}</div>
                  <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-0.5">Total Tasks</div>
                </div>
                <div className={`p-3 border-2 rounded-xl text-center ${darkMode ? 'bg-[#121B3A] border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-lg font-black tracking-tight font-mono text-rose-500">{tasks.filter(t => t.priority === 'High').length}</div>
                  <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-0.5">High Priority</div>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-[8px] uppercase tracking-widest text-slate-400 font-black mb-1.5">Max Display Row Limit</label>
                <select 
                  value={limit} 
                  onChange={(e) => setLimit(e.target.value)} 
                  className={`w-full border-2 rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase focus:outline-none ${darkMode ? 'bg-[#151F45] border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'}`}
                >
                  <option value="5">5 items</option>
                  <option value="15">15 items</option>
                  <option value="30">30 items</option>
                  <option value="100">100 items</option>
                </select>
              </div>
            </div>

            {/* Continuous Live Recent Updates User Activity Stream logs feed panel */}
            <div className={`border-2 rounded-2xl p-5 max-h-[60vh] flex flex-col overflow-hidden shadow-sm transition-all duration-500 ${darkMode ? 'bg-[#0E1738] border-slate-800' : 'bg-white border-slate-300'}`}>
              <div className="mb-4">
                <h3 className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 pb-3 border-b-2 ${darkMode ? 'text-slate-400 border-slate-800/80' : 'text-slate-500 border-slate-200/80'}`}>
                  <Activity size={14} className="text-emerald-500 animate-pulse" /> Recent Activity Log
                </h3>
              </div>
              <div className="space-y-3.5 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                {activities.map((log) => (
                  <div key={log.id} className="text-[11px] border-l-2 pl-3 border-slate-400 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors py-0.5">
                    <div className="text-[8px] text-slate-400 font-black uppercase flex items-center gap-1.5">
                      <Clock size={10} className="text-cyan-500" />
                      <span>{log.timestamp}</span>
                      <span className="opacity-40 font-mono">[{log.type}]</span>
                    </div>
                    <p className={`mt-0.5 font-semibold text-xs leading-normal ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{log.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* =========================================================================
         POPUP DIALOG LAYOUT OVERLAY WINDOW 1: EDIT TASK DETAILS MODAL CONTROLS
         ========================================================================= */}
      {editingTask && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className={`border-2 rounded-2xl max-w-md w-full p-8 relative shadow-2xl transition-all duration-300 ${darkMode ? 'bg-[#0E1738] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
            <button onClick={() => setEditingTask(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={16} /></button>
            <h3 className="text-xs font-black uppercase mb-6 text-emerald-500 dark:text-emerald-400 tracking-widest flex items-center gap-1"><Edit2 size={12}/> Edit Task Modifications</h3>
            
            <form onSubmit={handleUpdateTask} className="space-y-5">
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-slate-400 font-black mb-1.5">Task Subject Title Name</label>
                <input 
                  type="text" 
                  value={editingTask.title} 
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} 
                  className={`w-full border-2 rounded-xl p-3 text-xs focus:outline-none font-semibold ${darkMode ? 'border-slate-700 bg-[#151F45] text-white' : 'border-slate-300 bg-slate-50 text-slate-900'}`} 
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-slate-400 font-black mb-1.5">Task Notes Description</label>
                <textarea 
                  value={editingTask.description} 
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })} 
                  rows={4} 
                  className={`w-full border-2 rounded-xl p-3 text-xs focus:outline-none resize-none font-semibold ${darkMode ? 'border-slate-700 bg-[#151F45] text-white' : 'border-slate-300 bg-slate-50 text-slate-900'}`} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-slate-400 font-black mb-1.5">Status Flow State</label>
                  <select 
                    value={editingTask.status} 
                    onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })} 
                    className={`w-full border-2 rounded-xl p-3 text-xs font-black uppercase tracking-wider focus:outline-none ${darkMode ? 'bg-[#151F45] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                  >
                    <option value="Todo">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-slate-400 font-black mb-1.5">Urgency Severity</label>
                  <select 
                    value={editingTask.priority} 
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })} 
                    className={`w-full border-2 rounded-xl p-3 text-xs font-black uppercase tracking-wider focus:outline-none ${darkMode ? 'bg-[#151F45] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setEditingTask(null)} 
                  className={`w-1/2 text-xs uppercase font-black tracking-widest py-3.5 border-2 rounded-xl transition-colors ${darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-500 hover:bg-slate-100'}`}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-1/2 text-xs uppercase py-3.5 bg-gradient-to-r from-emerald-400 to-cyan-500 hover:opacity-90 text-slate-950 rounded-xl font-black tracking-widest shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
         POPUP DIALOG LAYOUT OVERLAY WINDOW 2: CREATE NEW WORKSPACE FOLDER MODAL
         ========================================================================= */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className={`border-2 rounded-2xl max-w-sm w-full p-6 relative shadow-2xl ${darkMode ? 'bg-[#0E1738] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
            <button onClick={() => setShowFolderModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={14} /></button>
            <h3 className="text-xs font-black uppercase tracking-widest mb-4 text-cyan-400 flex items-center gap-1.5"><FolderPlus size={14} /> Create Workspace Folder</h3>
            <form onSubmit={handleAddFolder} className="space-y-4">
              <div>
                <label className="block text-[8px] uppercase tracking-widest text-slate-400 font-black mb-1.5">New Folder Title Name</label>
                <input 
                  type="text" 
                  required
                  value={newFolderInput} 
                  onChange={(e) => setNewFolderInput(e.target.value)} 
                  placeholder="e.g., Production Milestones, Design Tasks"
                  className={`w-full border-2 rounded-xl p-3 text-xs focus:outline-none font-bold ${darkMode ? 'border-slate-700 bg-[#151F45] text-white' : 'border-slate-300 bg-slate-50 text-slate-900'}`} 
                />
              </div>
              <button type="submit" className="w-full text-xs font-black uppercase tracking-widest py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 shadow-md">
                Create Folder Directory
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
         POPUP DIALOG LAYOUT OVERLAY WINDOW 3: CONFIRM TASK DELETION REMOVALS MODAL
         ========================================================================= */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className={`border-2 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl transition-all ${darkMode ? 'bg-[#0E1738] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
            <div className="mx-auto w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mb-4 border border-rose-500/20"><AlertCircle size={22} /></div>
            <h3 className="text-xs font-black uppercase mb-1 text-rose-500 tracking-widest">Delete Workspace Task</h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 mb-6 font-semibold">Are you sure you want to permanently delete the selected task item: <span className="block mt-1 dark:text-slate-200 text-slate-800 italic">"{deleteModal.title}"</span>?</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setDeleteModal({ open: false, id: '', title: '' })} 
                className={`w-1/2 text-xs font-black uppercase tracking-widest p-3 border-2 rounded-xl transition-colors ${darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-500 hover:bg-slate-100'}`}
              >
                No, Keep It
              </button>
              <button 
                onClick={handleConfirmedDelete} 
                className="w-1/2 text-xs font-black uppercase tracking-widest p-3 bg-gradient-to-r from-rose-500 to-red-600 hover:opacity-90 text-white rounded-xl shadow-md"
              >
                Yes, Delete Task
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Helper wrapper to build and assign urgency color style badges nodes elements sets
function getPriorityBadge(priority: string) {
  let styles = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400';
  if (priority === 'High') styles = 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400';
  if (priority === 'Medium') styles = 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400';
  
  return (
    <span className={`text-[8px] px-2.5 py-0.5 rounded-lg font-black tracking-widest uppercase border ${styles}`}>
      {priority}
    </span>
  );
}
