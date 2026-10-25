import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, CheckCircle, Clock } from 'lucide-react';

export default function CalendarView({ tasks, onSelectTask, onAddTaskOnDate }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayTasks, setSelectedDayTasks] = useState(null);
  const [selectedDateStr, setSelectedDateStr] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Days in month calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayTasks(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayTasks(null);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDayTasks(null);
  };

  // Group tasks by due_date (YYYY-MM-DD)
  const tasksByDate = {};
  tasks.forEach((task) => {
    if (!task.due_date) return;
    const key = task.due_date.split('T')[0];
    if (!tasksByDate[key]) tasksByDate[key] = [];
    tasksByDate[key].push(task);
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const handleDayClick = (dateStr, dayTasks) => {
    setSelectedDateStr(dateStr);
    setSelectedDayTasks(dayTasks || []);
  };

  // Build calendar matrix
  const calendarDays = [];

  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevMonthDate = new Date(year, month - 1, d);
    const dateStr = prevMonthDate.toISOString().split('T')[0];
    calendarDays.push({
      day: d,
      dateStr,
      isCurrentMonth: false,
      tasks: tasksByDate[dateStr] || []
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const curDate = new Date(year, month, d);
    // Format YYYY-MM-DD with local padding
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    const dateStr = `${year}-${mStr}-${dStr}`;
    calendarDays.push({
      day: d,
      dateStr,
      isCurrentMonth: true,
      tasks: tasksByDate[dateStr] || []
    });
  }

  // Trailing next month days to complete 35 or 42 grid
  const remaining = (7 - (calendarDays.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const nextDate = new Date(year, month + 1, d);
    const mStr = String(nextDate.getMonth() + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    const dateStr = `${nextDate.getFullYear()}-${mStr}-${dStr}`;
    calendarDays.push({
      day: d,
      dateStr,
      isCurrentMonth: false,
      tasks: tasksByDate[dateStr] || []
    });
  }

  return (
    <div className="calendar-view-container">
      {/* Calendar Header Controls */}
      <div className="calendar-topbar">
        <div className="calendar-month-label">
          <CalendarIcon size={20} className="icon-calendar" />
          <h2>
            {monthNames[month]} {year}
          </h2>
        </div>
        <div className="calendar-nav-buttons">
          <button className="cal-btn-ghost" onClick={handleToday}>
            Today
          </button>
          <button className="cal-btn-icon" onClick={handlePrevMonth} title="Previous Month">
            <ChevronLeft size={18} />
          </button>
          <button className="cal-btn-icon" onClick={handleNextMonth} title="Next Month">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* 7 Days of Week Header */}
      <div className="calendar-grid-header">
        {daysOfWeek.map((day) => (
          <div key={day} className="cal-weekday-cell">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days Matrix */}
      <div className="calendar-grid">
        {calendarDays.map((cell, idx) => {
          const isToday = cell.dateStr === todayStr;
          const isSelected = selectedDateStr === cell.dateStr;
          const hasOverdue = cell.isCurrentMonth && cell.dateStr < todayStr && cell.tasks.some(t => !t.is_completed);

          return (
            <div
              key={idx}
              className={`calendar-cell ${cell.isCurrentMonth ? '' : 'other-month'} ${
                isToday ? 'today' : ''
              } ${isSelected ? 'selected' : ''} ${hasOverdue ? 'has-overdue' : ''}`}
              onClick={() => handleDayClick(cell.dateStr, cell.tasks)}
            >
              <div className="cal-cell-header">
                <span className={`cal-day-number ${isToday ? 'today-pill' : ''}`}>
                  {cell.day}
                </span>
                {cell.tasks.length > 0 && (
                  <span className="cal-task-count-badge">
                    {cell.tasks.length}
                  </span>
                )}
              </div>

              {/* Task Chips inside cell */}
              <div className="cal-cell-tasks">
                {cell.tasks.slice(0, 3).map((t) => (
                  <div
                    key={t.id}
                    className={`cal-task-chip priority-${t.priority || 'medium'} ${
                      t.is_completed ? 'completed' : ''
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTask(t);
                    }}
                    title={`${t.title} (${t.subject})`}
                  >
                    <span className="cal-chip-dot" />
                    <span className="cal-chip-text">{t.title}</span>
                  </div>
                ))}
                {cell.tasks.length > 3 && (
                  <div className="cal-more-pill">+{cell.tasks.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Day Drawer / Detail View */}
      {selectedDateStr && (
        <div className="cal-selected-drawer">
          <div className="cal-drawer-header">
            <div>
              <h3>Tasks for {selectedDateStr}</h3>
              <p className="cal-drawer-sub">
                {selectedDayTasks?.length || 0} tasks scheduled
              </p>
            </div>
            <div className="cal-drawer-actions">
              <button
                className="btn-primary-sm"
                onClick={() => onAddTaskOnDate(selectedDateStr)}
              >
                <Plus size={14} /> Schedule Task
              </button>
              <button
                className="icon-btn-ghost"
                onClick={() => {
                  setSelectedDateStr(null);
                  setSelectedDayTasks(null);
                }}
              >
                &times;
              </button>
            </div>
          </div>

          <div className="cal-drawer-list">
            {(!selectedDayTasks || selectedDayTasks.length === 0) ? (
              <div className="cal-drawer-empty">
                No coursework or assignments scheduled for this day. Click above to add one!
              </div>
            ) : (
              selectedDayTasks.map((task) => (
                <div
                  key={task.id}
                  className="cal-drawer-item"
                  onClick={() => onSelectTask(task)}
                >
                  <div className="cal-item-left">
                    <span className={`priority-tag-sm priority-${task.priority || 'medium'}`}>
                      {task.priority || 'medium'}
                    </span>
                    <span className="cal-item-subject">{task.subject}</span>
                    <h4 className={`cal-item-title ${task.is_completed ? 'completed' : ''}`}>
                      {task.title}
                    </h4>
                  </div>
                  <div className="cal-item-right">
                    <span className="cal-item-hours">
                      <Clock size={12} /> {task.estimated_hours || 2}h
                    </span>
                    <span className={`status-pill status-${task.status || (task.is_completed ? 'completed' : 'todo')}`}>
                      {task.status || (task.is_completed ? 'completed' : 'todo')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
