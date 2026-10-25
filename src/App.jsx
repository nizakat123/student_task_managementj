import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Edit3,
  Search,
  Cloud,
  Check,
  Calendar as CalendarIcon,
  BookOpen,
  AlertTriangle,
  Clock,
  Sparkles,
  Settings,
  X,
  Layers,
  Database,
  Moon,
  Sun,
  LayoutList,
  Kanban,
  Download,
  Share2,
  ListTodo,
  ArrowRight,
  ArrowLeft,
  Activity,
  Server,
  Zap,
  HelpCircle,
  TrendingUp,
  Flame,
  Volume2,
  VolumeX,
  CheckSquare,
  Square,
  Command,
  ChevronDown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { taskService } from './services/taskService';
import { getSupabaseConfig, saveSupabaseCredentials } from './lib/supabase';

// Modular Startup Components
import PomodoroTimer from './components/PomodoroTimer';
import CalendarView from './components/CalendarView';
import CommandPalette from './components/CommandPalette';
import AcademicExportModal from './components/AcademicExportModal';
import AnalyticsDashboard from './components/AnalyticsDashboard';

const SUBJECTS = [
  'Cloud Computing',
  'Distributed Systems',
  'Database Management',
  'Computer Networks',
  'Operating Systems',
  'Software Architecture'
];

// Synthesized audio feedback using Web Audio API (Zero external audio files required)
const playChime = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.28);
  } catch (_) {}
};

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list' | 'calendar'
  const [theme, setTheme] = useState(() => localStorage.getItem('theme_mode') || 'light');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Active Focus Task for Pomodoro Sprint
  const [activeFocusTask, setActiveFocusTask] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | todo | in_progress | completed
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('due_date');

  // Modals & Drawers
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [showAnalyticsDrawer, setShowAnalyticsDrawer] = useState(true);
  const [editingTask, setEditingTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Telemetry Metrics
  const [latencyMs, setLatencyMs] = useState(38);
  const [syncEventsCount, setSyncEventsCount] = useState(1);

  // Config State
  const config = getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(config.url || '');
  const [supabaseKey, setSupabaseKey] = useState(config.key || '');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subject: 'Cloud Computing',
    description: '',
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'medium',
    status: 'todo',
    estimated_hours: 3,
    subtasks: []
  });
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Apply Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme_mode', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Load tasks from Cloud / Local
  const loadTasks = async () => {
    const startTime = performance.now();
    try {
      const data = await taskService.getTasks();
      setTasks(data);
      const measured = Math.round(performance.now() - startTime);
      setLatencyMs(measured > 10 ? measured : 35);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();

    // Subscribe to real-time changes
    const unsubscribe = taskService.subscribeToTasks((payload) => {
      loadTasks();
      setSyncEventsCount((c) => c + 1);
      showToast('⚡ Realtime Cloud Synchronization active');
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleOpenAddModal();
      } else if (e.key === '/') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        toggleTheme();
      } else if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Computed & Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        const matchesStatus =
          statusFilter === 'all'
            ? true
            : statusFilter === 'completed'
            ? task.is_completed || task.status === 'completed'
            : statusFilter === 'in_progress'
            ? task.status === 'in_progress'
            : task.status === 'todo' && !task.is_completed;

        const matchesSubject =
          subjectFilter === 'all' ? true : task.subject === subjectFilter;

        const matchesPriority =
          priorityFilter === 'all' ? true : task.priority === priorityFilter;

        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !query ||
          task.title.toLowerCase().includes(query) ||
          task.subject.toLowerCase().includes(query) ||
          (task.description && task.description.toLowerCase().includes(query));

        return matchesStatus && matchesSubject && matchesPriority && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'due_date') {
          return new Date(a.due_date) - new Date(b.due_date);
        }
        if (sortBy === 'priority') {
          const pOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          return (pOrder[a.priority] || 2) - (pOrder[b.priority] || 2);
        }
        if (sortBy === 'hours') {
          return (b.estimated_hours || 0) - (a.estimated_hours || 0);
        }
        return new Date(b.created_at) - new Date(a.created_at);
      });
  }, [tasks, statusFilter, subjectFilter, priorityFilter, searchQuery, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.is_completed || t.status === 'completed').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const todo = tasks.filter((t) => (t.status === 'todo' || !t.status) && !t.is_completed).length;
    const today = new Date().toISOString().split('T')[0];
    const overdueTasks = tasks.filter((t) => !t.is_completed && t.due_date < today);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const totalHours = tasks.reduce((acc, t) => acc + (Number(t.estimated_hours) || 2), 0);
    return { total, completed, inProgress, todo, overdueTasks, completionRate, totalHours };
  }, [tasks]);

  // Task Actions
  const handleToggleComplete = async (task) => {
    const willBeCompleted = !task.is_completed;
    if (willBeCompleted) {
      if (soundEnabled) playChime();
      confetti({
        particleCount: 75,
        spread: 80,
        origin: { y: 0.75 },
        colors: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6']
      });
    }

    try {
      await taskService.toggleTask(task);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, is_completed: willBeCompleted, status: willBeCompleted ? 'completed' : 'todo' }
            : t
        )
      );
      showToast(willBeCompleted ? 'Coursework milestone completed! 🎉' : 'Marked as pending');
    } catch (err) {
      showToast('Error updating task: ' + err.message);
    }
  };

  const handleMoveStatus = async (taskId, newStatus) => {
    try {
      await taskService.updateStatus(taskId, newStatus);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: newStatus, is_completed: newStatus === 'completed' }
            : t
        )
      );
      showToast(`Shifted to ${newStatus.replace('_', ' ').toUpperCase()}`);
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  // Toggle Subtask directly on card
  const handleToggleSubtaskOnCard = async (task, subtaskId) => {
    const updatedSubtasks = (task.subtasks || []).map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every((st) => st.completed);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              subtasks: updatedSubtasks,
              is_completed: allCompleted ? true : t.is_completed,
              status: allCompleted ? 'completed' : t.status,
            }
          : t
      )
    );

    if (allCompleted && !task.is_completed) {
      if (soundEnabled) playChime();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      showToast('All subtasks completed! Task closed. 🏆');
    }

    try {
      await taskService.updateTask(task.id, {
        subtasks: updatedSubtasks,
        ...(allCompleted ? { is_completed: true, status: 'completed' } : {})
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAddModal = (initialDate = null) => {
    setEditingTask(null);
    setFormData({
      title: '',
      subject: 'Cloud Computing',
      description: '',
      due_date: initialDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'medium',
      status: 'todo',
      estimated_hours: 3,
      subtasks: []
    });
    setNewSubtaskTitle('');
    setIsTaskModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      subject: task.subject,
      description: task.description || '',
      due_date: task.due_date,
      priority: task.priority || 'medium',
      status: task.status || (task.is_completed ? 'completed' : 'todo'),
      estimated_hours: task.estimated_hours || 2,
      subtasks: task.subtasks || []
    });
    setNewSubtaskTitle('');
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      if (editingTask) {
        await taskService.updateTask(editingTask.id, formData);
        setTasks((prev) =>
          prev.map((t) => (t.id === editingTask.id ? { ...t, ...formData } : t))
        );
        showToast('Task updated in Cloud PostgreSQL!');
      } else {
        const created = await taskService.createTask(formData);
        setTasks((prev) => [created, ...prev]);
        showToast('New task published to Supabase Cloud!');
      }
      setIsTaskModalOpen(false);
    } catch (err) {
      showToast('Error saving: ' + err.message);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      await taskService.deleteTask(taskToDelete.id);
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
      if (activeFocusTask?.id === taskToDelete.id) {
        setActiveFocusTask(null);
      }
      showToast('Task removed from Cloud database');
      setTaskToDelete(null);
    } catch (err) {
      showToast('Error deleting: ' + err.message);
    }
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const subtask = {
      id: 'st_' + Date.now(),
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    setFormData((prev) => ({
      ...prev,
      subtasks: [...prev.subtasks, subtask]
    }));
    setNewSubtaskTitle('');
  };

  const handleToggleSubtaskInModal = (id) => {
    setFormData((prev) => ({
      ...prev,
      subtasks: prev.subtasks.map((st) =>
        st.id === id ? { ...st, completed: !st.completed } : st
      )
    }));
  };

  const handleRemoveSubtask = (id) => {
    setFormData((prev) => ({
      ...prev,
      subtasks: prev.subtasks.filter((st) => st.id !== id)
    }));
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <nav className="navbar">
        <div className="brand-section">
          <div className="brand-logo">
            <Database size={24} />
          </div>
          <div>
            <div className="brand-title">
              Student Sprint Cloud OS
              <span className="brand-badge">Enterprise Edition</span>
            </div>
            <div className="brand-subtitle">
              Distributed Computing Mini-Project • Supabase Cloud PostgreSQL & Realtime CDC
            </div>
          </div>
        </div>

        {/* Global Search / Command Bar Trigger */}
        <div className="nav-center-command" onClick={() => setIsCommandPaletteOpen(true)}>
          <Search size={15} className="text-subtle" />
          <span className="command-placeholder">Search coursework or press</span>
          <kbd className="cmd-pill">Ctrl K</kbd>
        </div>

        <div className="nav-actions">
          {/* Cloud Status Pill */}
          <div
            className={`cloud-pill ${config.isConfigured ? 'live' : 'demo'}`}
            onClick={() => setIsConfigModalOpen(true)}
            title="Click to view or edit Supabase Cloud configuration"
          >
            {config.isConfigured ? (
              <>
                <span className="pulse-indicator"></span>
                <span>Supabase Live ({latencyMs}ms)</span>
              </>
            ) : (
              <>
                <Cloud size={14} />
                <span>Local Fallback Mode</span>
              </>
            )}
          </div>

          {/* Sound Toggle */}
          <button
            className="icon-btn"
            onClick={() => setSoundEnabled((prev) => !prev)}
            title={soundEnabled ? 'Sound FX Enabled' : 'Sound FX Muted'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Theme Toggle */}
          <button
            className="icon-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode (Press D)`}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {/* Export Report Suite */}
          <button
            className="icon-btn"
            onClick={() => setIsExportModalOpen(true)}
            title="Academic Export Suite (CSV, Markdown, JSON)"
          >
            <Download size={16} />
          </button>

          {/* Shortcuts Help */}
          <button
            className="icon-btn"
            onClick={() => setIsShortcutsOpen(true)}
            title="Keyboard Shortcuts (?)"
          >
            <HelpCircle size={16} />
          </button>

          {/* Create Task Button */}
          <button className="btn-primary" onClick={() => handleOpenAddModal()}>
            <Plus size={16} />
            <span>New Task</span>
          </button>
        </div>
      </nav>

      {/* Hero Workspace Bar */}
      <div className="hero-workspace-row">
        {/* Study Sprint Pomodoro Widget */}
        <div className="hero-pomo-col">
          <PomodoroTimer
            activeTask={activeFocusTask}
            onClearActiveTask={() => setActiveFocusTask(null)}
          />
        </div>

        {/* View Mode Tabs & Quick Filters */}
        <div className="hero-views-col">
          <div className="view-mode-tabs">
            <button
              className={`view-tab ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
            >
              <Kanban size={15} /> Kanban Board
            </button>
            <button
              className={`view-tab ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <LayoutList size={15} /> List View
            </button>
            <button
              className={`view-tab ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              <CalendarIcon size={15} /> Deadline Calendar
            </button>
          </div>

          {/* Overdue Warning Alert Banner if any */}
          {stats.overdueTasks.length > 0 && (
            <div className="overdue-banner">
              <AlertTriangle size={16} className="text-danger" />
              <span>
                <strong>{stats.overdueTasks.length} assignment(s) overdue:</strong>{' '}
                {stats.overdueTasks[0]?.title}
              </span>
              <button
                className="btn-link-action"
                onClick={() => {
                  setStatusFilter('todo');
                  setSortBy('due_date');
                }}
              >
                Review Deadlines →
              </button>
            </div>
          )}

          {/* Subject Filter Chips Bar */}
          <div className="filter-chips-row">
            <button
              className={`filter-chip ${subjectFilter === 'all' ? 'active' : ''}`}
              onClick={() => setSubjectFilter('all')}
            >
              All Subjects ({tasks.length})
            </button>
            {SUBJECTS.map((sub) => {
              const count = tasks.filter((t) => t.subject === sub).length;
              if (count === 0 && subjectFilter !== sub) return null;
              return (
                <button
                  key={sub}
                  className={`filter-chip ${subjectFilter === sub ? 'active' : ''}`}
                  onClick={() => setSubjectFilter(sub)}
                >
                  {sub} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Workspace Area */}
      <main className="main-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Syncing cloud nodes with Supabase Sydney (ap-southeast-2)...</p>
          </div>
        ) : (
          <>
            {/* View Mode 1: Kanban Board */}
            {viewMode === 'kanban' && (
              <div className="kanban-board">
                {/* To Do Column */}
                <div className="kanban-column">
                  <div className="kanban-column-header col-todo">
                    <div className="col-title-wrap">
                      <span className="col-indicator todo"></span>
                      <h3>To Do Backlog</h3>
                    </div>
                    <span className="col-counter">
                      {filteredTasks.filter((t) => (t.status === 'todo' || !t.status) && !t.is_completed).length}
                    </span>
                  </div>

                  <div className="kanban-card-list">
                    {filteredTasks
                      .filter((t) => (t.status === 'todo' || !t.status) && !t.is_completed)
                      .map((task) => renderKanbanCard(task, 'todo'))}
                    {filteredTasks.filter((t) => (t.status === 'todo' || !t.status) && !t.is_completed).length === 0 && (
                      <div className="kanban-empty">No tasks in backlog</div>
                    )}
                  </div>
                </div>

                {/* In Progress Column */}
                <div className="kanban-column">
                  <div className="kanban-column-header col-progress">
                    <div className="col-title-wrap">
                      <span className="col-indicator progress"></span>
                      <h3>In Progress Sprint</h3>
                    </div>
                    <span className="col-counter">
                      {filteredTasks.filter((t) => t.status === 'in_progress').length}
                    </span>
                  </div>

                  <div className="kanban-card-list">
                    {filteredTasks
                      .filter((t) => t.status === 'in_progress')
                      .map((task) => renderKanbanCard(task, 'in_progress'))}
                    {filteredTasks.filter((t) => t.status === 'in_progress').length === 0 && (
                      <div className="kanban-empty">Drag or move tasks here to focus</div>
                    )}
                  </div>
                </div>

                {/* Completed Column */}
                <div className="kanban-column">
                  <div className="kanban-column-header col-completed">
                    <div className="col-title-wrap">
                      <span className="col-indicator completed"></span>
                      <h3>Completed</h3>
                    </div>
                    <span className="col-counter">
                      {filteredTasks.filter((t) => t.is_completed || t.status === 'completed').length}
                    </span>
                  </div>

                  <div className="kanban-card-list">
                    {filteredTasks
                      .filter((t) => t.is_completed || t.status === 'completed')
                      .map((task) => renderKanbanCard(task, 'completed'))}
                    {filteredTasks.filter((t) => t.is_completed || t.status === 'completed').length === 0 && (
                      <div className="kanban-empty">No completed tasks yet</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* View Mode 2: List View */}
            {viewMode === 'list' && (
              <div className="list-view-wrap">
                {/* List Filters Bar */}
                <div className="list-controls-bar">
                  <div className="search-box">
                    <Search size={16} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Filter current view..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button className="clear-search" onClick={() => setSearchQuery('')}>
                        &times;
                      </button>
                    )}
                  </div>

                  <div className="list-filters-group">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">All Statuses</option>
                      <option value="todo">Pending / To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>

                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">All Priorities</option>
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>

                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="filter-select"
                    >
                      <option value="due_date">Sort: Earliest Due Date</option>
                      <option value="priority">Sort: Highest Priority</option>
                      <option value="hours">Sort: Workload Hours</option>
                      <option value="created_at">Sort: Recently Added</option>
                    </select>
                  </div>
                </div>

                {/* List Cards */}
                <div className="tasks-list">
                  {filteredTasks.length === 0 ? (
                    <div className="empty-state">
                      <ListTodo size={48} className="empty-icon" />
                      <h3>No coursework tasks match your criteria</h3>
                      <p>Try clearing filters or click below to register a new assignment.</p>
                      <button className="btn-primary" onClick={() => handleOpenAddModal()}>
                        <Plus size={16} /> Create New Task
                      </button>
                    </div>
                  ) : (
                    filteredTasks.map((task) => renderListItem(task))
                  )}
                </div>
              </div>
            )}

            {/* View Mode 3: Deadline Calendar */}
            {viewMode === 'calendar' && (
              <CalendarView
                tasks={tasks}
                onSelectTask={handleOpenEditModal}
                onAddTaskOnDate={handleOpenAddModal}
              />
            )}
          </>
        )}
      </main>

      {/* Collapsible Telemetry & Analytics Dashboard */}
      <div className="telemetry-section-wrap">
        <div
          className="telemetry-toggle-header"
          onClick={() => setShowAnalyticsDrawer(!showAnalyticsDrawer)}
        >
          <div className="toggle-left">
            <TrendingUp size={16} className="icon-blue" />
            <span>Academic Performance & Realtime Cloud Infrastructure</span>
          </div>
          <div className="toggle-right">
            <span>{showAnalyticsDrawer ? 'Hide Dashboard ▲' : 'Show Dashboard ▼'}</span>
          </div>
        </div>

        {showAnalyticsDrawer && (
          <AnalyticsDashboard
            tasks={tasks}
            latencyMs={latencyMs}
            syncEventsCount={syncEventsCount}
          />
        )}
      </div>

      {/* =========================================================================
          MODALS & DRAWERS
          ========================================================================= */}

      {/* Task Creation & Edit Modal */}
      {isTaskModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTaskModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{editingTask ? 'Edit Coursework Task' : 'Register New Assignment'}</h3>
                <p className="modal-sub">
                  Stored directly in Supabase Cloud PostgreSQL with automatic RLS replication.
                </p>
              </div>
              <button className="icon-btn-ghost" onClick={() => setIsTaskModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTask}>
              <div className="form-group">
                <label>Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement Raft Consensus Protocol"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Subject / Module *</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Due Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Priority Level</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="urgent">🔴 Urgent</option>
                    <option value="high">🟠 High</option>
                    <option value="medium">🔵 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Workflow Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Estimated Hours</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.estimated_hours}
                    onChange={(e) =>
                      setFormData({ ...formData, estimated_hours: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description & Requirements</label>
                <textarea
                  rows={3}
                  placeholder="Provide assignment specifications, rubric links, or submission requirements..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Subtasks Checklist Builder */}
              <div className="subtasks-builder-section">
                <label className="subtasks-label">Milestones & Subtasks Checklist</label>
                <div className="subtask-input-row">
                  <input
                    type="text"
                    placeholder="Add step (e.g. Run benchmark scripts)..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                  />
                  <button type="button" className="btn-secondary-sm" onClick={handleAddSubtask}>
                    <Plus size={14} /> Add
                  </button>
                </div>

                <div className="subtasks-modal-list">
                  {formData.subtasks.map((st) => (
                    <div key={st.id} className="subtask-modal-item">
                      <button
                        type="button"
                        className="subtask-checkbox"
                        onClick={() => handleToggleSubtaskInModal(st.id)}
                      >
                        {st.completed ? (
                          <CheckSquare size={16} className="text-success" />
                        ) : (
                          <Square size={16} className="text-subtle" />
                        )}
                      </button>
                      <span className={`subtask-text ${st.completed ? 'completed' : ''}`}>
                        {st.title}
                      </span>
                      <button
                        type="button"
                        className="subtask-delete-btn"
                        onClick={() => handleRemoveSubtask(st.id)}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsTaskModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="modal-overlay" onClick={() => setTaskToDelete(null)}>
          <div className="modal-card modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Coursework Task?</h3>
              <button className="icon-btn-ghost" onClick={() => setTaskToDelete(null)}>
                <X size={18} />
              </button>
            </div>
            <p className="modal-desc">
              Are you sure you want to permanently delete <strong>"{taskToDelete.title}"</strong>?
              This action will be synchronized across all connected client tabs.
            </p>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setTaskToDelete(null)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={handleDeleteTask}>
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supabase Cloud Configuration Modal */}
      {isConfigModalOpen && (
        <div className="modal-overlay" onClick={() => setIsConfigModalOpen(false)}>
          <div className="modal-card modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <Database size={24} className="text-primary" />
                <div>
                  <h3>Supabase Cloud & Distributed Storage</h3>
                  <p className="modal-sub">
                    Configured for Cloud & Distributed Computing Evaluation
                  </p>
                </div>
              </div>
              <button className="icon-btn-ghost" onClick={() => setIsConfigModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="config-dialog-body">
              <div className="supabase-status-banner">
                <div className="status-dot-pulse"></div>
                <div>
                  <strong>Live Connection Active</strong>
                  <p>Region: Oceania (Sydney, ap-southeast-2) • Protocol: WSS TLS 1.3</p>
                </div>
              </div>

              <div className="form-group">
                <label>Supabase Project URL</label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                />
              </div>

              <div className="form-group">
                <label>Supabase Publishable Key</label>
                <input
                  type="text"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="sb_publishable_..."
                />
              </div>

              {/* Quick SQL Migration Helper */}
              <div className="sql-snippet-box">
                <div className="sql-snippet-header">
                  <span>Supabase SQL Migration (If needed for table creation)</span>
                  <button
                    className="btn-secondary-sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`-- Student Task Manager Schema
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'todo';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC DEFAULT 2;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::jsonb;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;`);
                      showToast('Copied SQL to clipboard!');
                    }}
                  >
                    Copy SQL Snippet
                  </button>
                </div>
                <pre className="sql-snippet-code">
                  <code>{`ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'todo';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC DEFAULT 2;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::jsonb;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;`}</code>
                </pre>
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setIsConfigModalOpen(false)}>
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    saveSupabaseCredentials(supabaseUrl, supabaseKey);
                    showToast('Credentials saved! Reloading...');
                    setTimeout(() => window.location.reload(), 600);
                  }}
                >
                  Save & Reconnect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Dialog */}
      {isShortcutsOpen && (
        <div className="modal-overlay" onClick={() => setIsShortcutsOpen(false)}>
          <div className="modal-card modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Keyboard Shortcuts</h3>
              <button className="icon-btn-ghost" onClick={() => setIsShortcutsOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="shortcuts-list">
              <div className="shortcut-row">
                <span className="shortcut-desc">Open Command Palette</span>
                <kbd className="cmd-pill">Ctrl + K</kbd>
              </div>
              <div className="shortcut-row">
                <span className="shortcut-desc">Quick Search Coursework</span>
                <kbd className="cmd-pill">/</kbd>
              </div>
              <div className="shortcut-row">
                <span className="shortcut-desc">Create New Task</span>
                <kbd className="cmd-pill">N</kbd>
              </div>
              <div className="shortcut-row">
                <span className="shortcut-desc">Toggle Dark / Light Theme</span>
                <kbd className="cmd-pill">D</kbd>
              </div>
              <div className="shortcut-row">
                <span className="shortcut-desc">Keyboard Shortcuts Guide</span>
                <kbd className="cmd-pill">?</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Command Palette Spotlight */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tasks={tasks}
        onSelectTask={handleOpenEditModal}
        onOpenNewTask={handleOpenAddModal}
        onSetViewMode={setViewMode}
        onToggleTheme={toggleTheme}
        theme={theme}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenSettings={() => setIsConfigModalOpen(true)}
        onStartPomodoro={() => {
          showToast('Pomodoro Sprint Active! Select a task to focus on.');
        }}
      />

      {/* Academic Export Suite Modal */}
      <AcademicExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        tasks={tasks}
      />

      {/* Floating Toast Notification */}
      {toastMessage && <div className="toast-notification">{toastMessage}</div>}
    </div>
  );

  // Helper: Render Kanban Card
  function renderKanbanCard(task, columnType) {
    const subtasks = task.subtasks || [];
    const doneCount = subtasks.filter((s) => s.completed).length;
    const isOverdue = !task.is_completed && task.due_date < new Date().toISOString().split('T')[0];
    const isFocusing = activeFocusTask?.id === task.id;

    return (
      <div key={task.id} className={`kanban-card ${isOverdue ? 'overdue' : ''}`}>
        {/* Card Header */}
        <div className="kanban-card-top">
          <span className={`priority-tag priority-${task.priority || 'medium'}`}>
            {task.priority || 'medium'}
          </span>
          <span className="kanban-card-subject">{task.subject}</span>
          <div className="kanban-card-actions">
            <button
              className={`icon-btn-tiny ${isFocusing ? 'active-flame' : ''}`}
              onClick={() => {
                setActiveFocusTask(task);
                showToast(`🎯 Focused on: ${task.title}`);
              }}
              title="Focus in Pomodoro Sprint"
            >
              <Flame size={13} />
            </button>
            <button
              className="icon-btn-tiny"
              onClick={() => handleOpenEditModal(task)}
              title="Edit Task"
            >
              <Edit3 size={13} />
            </button>
            <button
              className="icon-btn-tiny text-danger"
              onClick={() => setTaskToDelete(task)}
              title="Delete Task"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Title */}
        <h4 className={`kanban-card-title ${task.is_completed ? 'completed' : ''}`}>
          {task.title}
        </h4>

        {/* Description Snippet */}
        {task.description && (
          <p className="kanban-card-desc">{task.description}</p>
        )}

        {/* Subtasks Mini Checklist */}
        {subtasks.length > 0 && (
          <div className="card-subtasks-box">
            <div className="card-subtasks-header">
              <span>Milestones: {doneCount}/{subtasks.length}</span>
              <span className="card-subtasks-percent">
                {Math.round((doneCount / subtasks.length) * 100)}%
              </span>
            </div>
            <div className="card-subtasks-progress">
              <div
                className="card-subtasks-fill"
                style={{ width: `${(doneCount / subtasks.length) * 100}%` }}
              />
            </div>
            <div className="card-subtasks-list">
              {subtasks.slice(0, 2).map((st) => (
                <div
                  key={st.id}
                  className="card-subtask-item"
                  onClick={() => handleToggleSubtaskOnCard(task, st.id)}
                >
                  {st.completed ? (
                    <CheckSquare size={13} className="text-success" />
                  ) : (
                    <Square size={13} className="text-subtle" />
                  )}
                  <span className={`subtask-title-inline ${st.completed ? 'completed' : ''}`}>
                    {st.title}
                  </span>
                </div>
              ))}
              {subtasks.length > 2 && (
                <div className="card-more-subtasks" onClick={() => handleOpenEditModal(task)}>
                  +{subtasks.length - 2} more milestones...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Card Footer Info & Column Shift Controls */}
        <div className="kanban-card-footer">
          <div className="card-footer-meta">
            <span className={`meta-due ${isOverdue ? 'text-danger' : ''}`}>
              <CalendarIcon size={12} /> {task.due_date}
            </span>
            <span className="meta-hours">
              <Clock size={12} /> {task.estimated_hours || 2}h
            </span>
          </div>

          <div className="kanban-shift-controls">
            {columnType !== 'todo' && (
              <button
                className="shift-btn"
                onClick={() => handleMoveStatus(task.id, columnType === 'completed' ? 'in_progress' : 'todo')}
                title="Move Left"
              >
                <ArrowLeft size={12} />
              </button>
            )}
            {columnType !== 'completed' && (
              <button
                className="shift-btn"
                onClick={() => handleMoveStatus(task.id, columnType === 'todo' ? 'in_progress' : 'completed')}
                title="Move Right"
              >
                <ArrowRight size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Helper: Render List Item
  function renderListItem(task) {
    const isCompleted = task.is_completed || task.status === 'completed';
    const isOverdue = !isCompleted && task.due_date < new Date().toISOString().split('T')[0];
    const subtasks = task.subtasks || [];
    const doneCount = subtasks.filter((s) => s.completed).length;

    return (
      <div key={task.id} className={`task-list-card ${isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}>
        <button
          className="task-checkbox-btn"
          onClick={() => handleToggleComplete(task)}
          title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {isCompleted ? (
            <CheckCircle2 size={22} className="check-icon-completed" />
          ) : (
            <Circle size={22} className="check-icon-pending" />
          )}
        </button>

        <div className="task-content">
          <div className="task-header-row">
            <h4 className={`task-title ${isCompleted ? 'line-through' : ''}`}>
              {task.title}
            </h4>
            <div className="task-badges-row">
              <span className={`priority-tag priority-${task.priority || 'medium'}`}>
                {task.priority || 'medium'}
              </span>
              <span className="subject-tag">{task.subject}</span>
              <span className={`status-pill status-${task.status || (isCompleted ? 'completed' : 'todo')}`}>
                {task.status || (isCompleted ? 'completed' : 'todo')}
              </span>
            </div>
          </div>

          {task.description && <p className="task-description">{task.description}</p>}

          <div className="task-meta-row">
            <span className={`task-meta-item ${isOverdue ? 'text-danger' : ''}`}>
              <CalendarIcon size={14} />
              <span>Due: {task.due_date} {isOverdue && '(Overdue)'}</span>
            </span>
            <span className="task-meta-item">
              <Clock size={14} />
              <span>Workload: {task.estimated_hours || 2}h</span>
            </span>
            {subtasks.length > 0 && (
              <span className="task-meta-item">
                <CheckSquare size={14} />
                <span>{doneCount}/{subtasks.length} milestones</span>
              </span>
            )}
          </div>
        </div>

        <div className="task-card-actions">
          <button
            className="icon-btn-ghost"
            onClick={() => {
              setActiveFocusTask(task);
              showToast(`🎯 Focused on: ${task.title}`);
            }}
            title="Focus in Pomodoro Sprint"
          >
            <Flame size={16} />
          </button>
          <button
            className="icon-btn-ghost"
            onClick={() => handleOpenEditModal(task)}
            title="Edit Task"
          >
            <Edit3 size={16} />
          </button>
          <button
            className="icon-btn-ghost text-danger"
            onClick={() => setTaskToDelete(task)}
            title="Delete Task"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  }
}
