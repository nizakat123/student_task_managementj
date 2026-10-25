import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Flame,
  LayoutList,
  Kanban,
  Calendar,
  Moon,
  Sun,
  Download,
  Database,
  ArrowRight,
  BookOpen,
  X
} from 'lucide-react';

export default function CommandPalette({
  isOpen,
  onClose,
  tasks,
  onSelectTask,
  onOpenNewTask,
  onSetViewMode,
  onToggleTheme,
  theme,
  onOpenExport,
  onOpenSettings,
  onStartPomodoro
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Static action items
  const staticActions = [
    {
      id: 'act-new-task',
      category: 'Actions',
      title: 'Create New Task / Coursework',
      subtitle: 'Open task creation modal (Shortcut: N)',
      icon: <Plus size={16} className="cmd-icon-blue" />,
      run: () => {
        onClose();
        onOpenNewTask();
      }
    },
    {
      id: 'act-start-pomo',
      category: 'Actions',
      title: 'Start 25-Min Study Sprint',
      subtitle: 'Activate Pomodoro focus session',
      icon: <Flame size={16} className="cmd-icon-orange" />,
      run: () => {
        onClose();
        onStartPomodoro();
      }
    },
    {
      id: 'act-view-kanban',
      category: 'Navigation',
      title: 'Switch to Kanban Board',
      subtitle: 'Visualize workflow across To Do, In Progress, Completed',
      icon: <Kanban size={16} className="cmd-icon-purple" />,
      run: () => {
        onClose();
        onSetViewMode('kanban');
      }
    },
    {
      id: 'act-view-calendar',
      category: 'Navigation',
      title: 'Switch to Deadline Calendar',
      subtitle: 'View monthly submission dates and timeline',
      icon: <Calendar size={16} className="cmd-icon-green" />,
      run: () => {
        onClose();
        onSetViewMode('calendar');
      }
    },
    {
      id: 'act-view-list',
      category: 'Navigation',
      title: 'Switch to List View',
      subtitle: 'Detailed table format with batch management',
      icon: <LayoutList size={16} className="cmd-icon-blue" />,
      run: () => {
        onClose();
        onSetViewMode('list');
      }
    },
    {
      id: 'act-toggle-theme',
      category: 'Appearance',
      title: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      subtitle: 'Toggle interface color scheme (Shortcut: D)',
      icon: theme === 'dark' ? <Sun size={16} className="cmd-icon-amber" /> : <Moon size={16} className="cmd-icon-purple" />,
      run: () => {
        onClose();
        onToggleTheme();
      }
    },
    {
      id: 'act-export',
      category: 'Submission & Reports',
      title: 'Export Academic Report (CSV / JSON / Markdown)',
      subtitle: 'Download coursework report for professor evaluation',
      icon: <Download size={16} className="cmd-icon-green" />,
      run: () => {
        onClose();
        onOpenExport();
      }
    },
    {
      id: 'act-db-settings',
      category: 'Cloud & Infrastructure',
      title: 'Supabase Cloud Settings & RLS Status',
      subtitle: 'Verify live PostgreSQL replication credentials and latency',
      icon: <Database size={16} className="cmd-icon-blue" />,
      run: () => {
        onClose();
        onOpenSettings();
      }
    }
  ];

  // Dynamic task items from active tasks
  const taskActions = tasks.map((t) => ({
    id: `task-${t.id}`,
    category: 'Assignments & Tasks',
    title: t.title,
    subtitle: `${t.subject} • Due ${t.due_date} • ${t.priority || 'medium'} priority`,
    icon: <BookOpen size={16} className="cmd-icon-blue" />,
    task: t,
    run: () => {
      onClose();
      onSelectTask(t);
    }
  }));

  // Filter combined results
  const q = query.toLowerCase().trim();
  const filteredItems = [...staticActions, ...taskActions].filter((item) => {
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle?.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  }).slice(0, 10);

  // Keyboard navigation inside palette
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].run();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="cmd-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-search-bar">
          <Search size={18} className="cmd-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="cmd-input"
            placeholder="Type a command or search coursework (e.g. 'Cloud', 'Pomodoro', 'Kanban')..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <span className="cmd-badge">ESC to close</span>
        </div>

        <div className="cmd-results-list">
          {filteredItems.length === 0 ? (
            <div className="cmd-empty">No matching commands or tasks found.</div>
          ) : (
            filteredItems.map((item, index) => (
              <div
                key={item.id}
                className={`cmd-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={item.run}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="cmd-item-left">
                  <div className="cmd-item-icon-box">{item.icon}</div>
                  <div className="cmd-item-text">
                    <div className="cmd-item-title">{item.title}</div>
                    <div className="cmd-item-subtitle">{item.subtitle}</div>
                  </div>
                </div>
                <div className="cmd-item-right">
                  <span className="cmd-category-tag">{item.category}</span>
                  <ArrowRight size={14} className="cmd-arrow" />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cmd-footer">
          <div className="cmd-hint">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <div className="cmd-brand">Student Sprint Cloud OS</div>
        </div>
      </div>
    </div>
  );
}
