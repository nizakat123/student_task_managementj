import React, { useState } from 'react';
import { Download, Copy, Check, FileText, Table, Code, X } from 'lucide-react';

export default function AcademicExportModal({ isOpen, onClose, tasks }) {
  const [exportType, setExportType] = useState('markdown'); // markdown | csv | json
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate CSV
  const generateCSV = () => {
    const headers = ['ID', 'Title', 'Subject', 'Status', 'Priority', 'Due Date', 'Est Hours', 'Subtasks Total', 'Subtasks Done'];
    const rows = tasks.map((t) => {
      const subtasks = t.subtasks || [];
      const doneCount = subtasks.filter((s) => s.completed).length;
      return [
        `"${t.id}"`,
        `"${(t.title || '').replace(/"/g, '""')}"`,
        `"${(t.subject || '').replace(/"/g, '""')}"`,
        `"${t.status || (t.is_completed ? 'completed' : 'todo')}"`,
        `"${t.priority || 'medium'}"`,
        `"${t.due_date || ''}"`,
        `"${t.estimated_hours || 2}"`,
        `"${subtasks.length}"`,
        `"${doneCount}"`
      ].join(',');
    });
    return [headers.join(','), ...rows].join('\n');
  };

  // Generate Academic Markdown Report
  const generateMarkdown = () => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.is_completed || t.status === 'completed').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const todo = tasks.filter((t) => (t.status === 'todo' || !t.status) && !t.is_completed).length;
    const totalHours = tasks.reduce((acc, t) => acc + (Number(t.estimated_hours) || 2), 0);
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    let md = `# Semester Coursework & Task Progress Report\n`;
    md += `**Course:** Cloud & Distributed Computing (Semester Mini-Project)\n`;
    md += `**Date Generated:** ${dateStr}\n`;
    md += `**System Architecture:** Supabase (Cloud PostgreSQL + Realtime CDC) + React.js SPA\n\n`;

    md += `## 1. Executive Summary\n\n`;
    md += `| Metric | Value |\n`;
    md += `| :--- | :--- |\n`;
    md += `| Total Registered Tasks | **${total}** |\n`;
    md += `| Completed Tasks | **${completed}** (${total > 0 ? Math.round((completed / total) * 100) : 0}%) |\n`;
    md += `| In-Progress Tasks | **${inProgress}** |\n`;
    md += `| Pending / To Do | **${todo}** |\n`;
    md += `| Total Workload Volume | **${totalHours} hours** |\n\n`;

    md += `## 2. Coursework Tasks & Milestones Breakdown\n\n`;
    tasks.forEach((t, i) => {
      const sub = t.subtasks || [];
      const statusEmoji = t.is_completed || t.status === 'completed' ? '✅ COMPLETED' : t.status === 'in_progress' ? '🔄 IN PROGRESS' : '⏳ PENDING';
      md += `### ${i + 1}. ${t.title} [${statusEmoji}]\n`;
      md += `- **Subject / Module:** ${t.subject}\n`;
      md += `- **Due Date:** ${t.due_date}\n`;
      md += `- **Priority:** ${t.priority?.toUpperCase() || 'MEDIUM'}\n`;
      md += `- **Estimated Workload:** ${t.estimated_hours || 2} hours\n`;
      if (t.description) {
        md += `- **Description:** ${t.description}\n`;
      }
      if (sub.length > 0) {
        md += `- **Subtask Milestones:**\n`;
        sub.forEach((s) => {
          md += `  - [${s.completed ? 'x' : ' '}] ${s.title}\n`;
        });
      }
      md += `\n`;
    });

    md += `---\n*Report generated via Student Sprint Cloud Task Management System.*\n`;
    return md;
  };

  // Generate JSON
  const generateJSON = () => {
    return JSON.stringify(tasks, null, 2);
  };

  const getExportContent = () => {
    if (exportType === 'markdown') return generateMarkdown();
    if (exportType === 'csv') return generateCSV();
    return generateJSON();
  };

  const content = getExportContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = exportType === 'markdown' ? 'md' : exportType === 'csv' ? 'csv' : 'json';
    const mime = exportType === 'markdown' ? 'text/markdown' : exportType === 'csv' ? 'text/csv' : 'application/json';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_coursework_report_${new Date().toISOString().split('T')[0]}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Academic Report & Data Export Suite</h3>
            <p className="modal-sub">Generate formatted reports for professor evaluation, grading, or spreadsheet analysis.</p>
          </div>
          <button className="icon-btn-ghost" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="export-tabs">
          <button
            className={`export-tab ${exportType === 'markdown' ? 'active' : ''}`}
            onClick={() => setExportType('markdown')}
          >
            <FileText size={16} /> Markdown Report (.md)
          </button>
          <button
            className={`export-tab ${exportType === 'csv' ? 'active' : ''}`}
            onClick={() => setExportType('csv')}
          >
            <Table size={16} /> Spreadsheet CSV (.csv)
          </button>
          <button
            className={`export-tab ${exportType === 'json' ? 'active' : ''}`}
            onClick={() => setExportType('json')}
          >
            <Code size={16} /> Database JSON (.json)
          </button>
        </div>

        {/* Preview box */}
        <div className="export-preview-wrap">
          <div className="export-preview-header">
            <span>Live Output Preview</span>
            <div className="export-preview-actions">
              <button className="btn-secondary-sm" onClick={handleCopy}>
                {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
              <button className="btn-primary-sm" onClick={handleDownload}>
                <Download size={14} /> Download File
              </button>
            </div>
          </div>
          <pre className="export-preview-code">
            <code>{content}</code>
          </pre>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn-primary" onClick={handleDownload}>
            <Download size={16} /> Download {exportType.toUpperCase()} File
          </button>
        </div>
      </div>
    </div>
  );
}
