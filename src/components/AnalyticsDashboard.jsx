import React from 'react';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Zap,
  Server,
  Activity,
  Award
} from 'lucide-react';

export default function AnalyticsDashboard({ tasks, latencyMs, syncEventsCount }) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.is_completed || t.status === 'completed').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const todo = tasks.filter((t) => (t.status === 'todo' || !t.status) && !t.is_completed).length;
  const today = new Date().toISOString().split('T')[0];
  const overdue = tasks.filter((t) => !t.is_completed && t.due_date < today).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const totalHours = tasks.reduce((acc, t) => acc + (Number(t.estimated_hours) || 2), 0);
  const completedHours = tasks
    .filter((t) => t.is_completed || t.status === 'completed')
    .reduce((acc, t) => acc + (Number(t.estimated_hours) || 2), 0);

  // Group by Subject
  const subjectStats = {};
  tasks.forEach((t) => {
    const subj = t.subject || 'General';
    if (!subjectStats[subj]) {
      subjectStats[subj] = { total: 0, completed: 0, hours: 0 };
    }
    subjectStats[subj].total += 1;
    subjectStats[subj].hours += Number(t.estimated_hours) || 2;
    if (t.is_completed || t.status === 'completed') {
      subjectStats[subj].completed += 1;
    }
  });

  // Group by Priority
  const priorityStats = {
    urgent: tasks.filter((t) => t.priority === 'urgent').length,
    high: tasks.filter((t) => t.priority === 'high').length,
    medium: tasks.filter((t) => t.priority === 'medium').length,
    low: tasks.filter((t) => t.priority === 'low').length,
  };

  return (
    <div className="analytics-section">
      <div className="analytics-header">
        <div className="analytics-title">
          <TrendingUp size={20} className="icon-blue" />
          <h3>Academic Velocity & Coursework Telemetry</h3>
        </div>
        <div className="analytics-pill">
          <Activity size={14} className="pulse-icon text-success" />
          <span>Realtime Telemetry Active ({latencyMs}ms ping)</span>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="analytics-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-box kpi-blue">
            <CheckCircle2 size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Completion Velocity</span>
            <div className="kpi-number-row">
              <span className="kpi-val">{completionRate}%</span>
              <span className="kpi-sub">({completed}/{total} tasks)</span>
            </div>
          </div>
          <div className="kpi-progress-bar">
            <div className="kpi-progress-fill fill-blue" style={{ width: `${completionRate}%` }} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-box kpi-purple">
            <Clock size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Study Workload</span>
            <div className="kpi-number-row">
              <span className="kpi-val">{totalHours} hrs</span>
              <span className="kpi-sub">{completedHours}h completed</span>
            </div>
          </div>
          <div className="kpi-progress-bar">
            <div
              className="kpi-progress-fill fill-purple"
              style={{ width: `${totalHours > 0 ? Math.round((completedHours / totalHours) * 100) : 0}%` }}
            />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-box kpi-green">
            <Zap size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">In-Progress Sprint</span>
            <div className="kpi-number-row">
              <span className="kpi-val">{inProgress}</span>
              <span className="kpi-sub">active now</span>
            </div>
          </div>
          <div className="kpi-status-text">
            {todo} queued in backlog
          </div>
        </div>

        <div className={`kpi-card ${overdue > 0 ? 'kpi-card-alert' : ''}`}>
          <div className={`kpi-icon-box ${overdue > 0 ? 'kpi-red' : 'kpi-amber'}`}>
            <AlertTriangle size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Deadline Health</span>
            <div className="kpi-number-row">
              <span className="kpi-val">{overdue}</span>
              <span className="kpi-sub">{overdue > 0 ? 'overdue alert!' : 'on schedule'}</span>
            </div>
          </div>
          <div className="kpi-status-text">
            {overdue === 0 ? 'All deadlines green' : 'Immediate focus required'}
          </div>
        </div>
      </div>

      {/* Two Columns: Subject Workload & Priority Distribution */}
      <div className="analytics-details-grid">
        {/* Subject Breakdown */}
        <div className="analytics-card">
          <div className="analytics-card-title">
            <BookOpen size={16} /> Coursework Workload by Subject
          </div>
          <div className="subject-bars-list">
            {Object.entries(subjectStats).map(([subj, data]) => {
              const subjRate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
              return (
                <div key={subj} className="subject-bar-item">
                  <div className="subject-bar-header">
                    <span className="subject-name">{subj}</span>
                    <span className="subject-meta">
                      {data.completed}/{data.total} tasks • {data.hours}h ({subjRate}%)
                    </span>
                  </div>
                  <div className="subject-bar-track">
                    <div className="subject-bar-fill" style={{ width: `${subjRate}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority & Cloud Distribution */}
        <div className="analytics-card">
          <div className="analytics-card-title">
            <Award size={16} /> Priority Matrix & Distributed State
          </div>
          
          <div className="priority-matrix-row">
            <div className="priority-matrix-item urgent">
              <span className="p-count">{priorityStats.urgent}</span>
              <span className="p-label">Urgent</span>
            </div>
            <div className="priority-matrix-item high">
              <span className="p-count">{priorityStats.high}</span>
              <span className="p-label">High</span>
            </div>
            <div className="priority-matrix-item medium">
              <span className="p-count">{priorityStats.medium}</span>
              <span className="p-label">Medium</span>
            </div>
            <div className="priority-matrix-item low">
              <span className="p-count">{priorityStats.low}</span>
              <span className="p-label">Low</span>
            </div>
          </div>

          <div className="distributed-telemetry-box">
            <div className="dist-row">
              <span className="dist-label"><Server size={14} /> Cloud Node:</span>
              <span className="dist-val">Supabase Oceania (Sydney ap-southeast-2)</span>
            </div>
            <div className="dist-row">
              <span className="dist-label"><Activity size={14} /> CDC Replication:</span>
              <span className="dist-val">{syncEventsCount} realtime packets processed</span>
            </div>
            <div className="dist-row">
              <span className="dist-label"><Zap size={14} /> Transport Protocol:</span>
              <span className="dist-val">WSS (TLS 1.3 / WebSocket)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
