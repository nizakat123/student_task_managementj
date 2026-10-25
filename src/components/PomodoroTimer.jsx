import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Flame, CheckCircle, Volume2, VolumeX, Minimize2, Maximize2, Coffee } from 'lucide-react';

const TIMER_MODES = {
  focus: { label: 'Focus Session', duration: 25 * 60, color: 'var(--primary)' },
  shortBreak: { label: 'Short Break', duration: 5 * 60, color: 'var(--success)' },
  longBreak: { label: 'Deep Recharge', duration: 15 * 60, color: 'var(--purple)' },
};

export default function PomodoroTimer({ activeTask, onClearActiveTask }) {
  const [mode, setMode] = useState('focus');
  const [timeLeft, setTimeLeft] = useState(TIMER_MODES.focus.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Play audio chime on completion
  const playTimerChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.12);
        gain.gain.setValueAtTime(0.18, audioCtx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.12 + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + i * 0.12);
        osc.stop(audioCtx.currentTime + i * 0.12 + 0.35);
      });
    } catch (_) {}
  };

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      playTimerChime();
      if (mode === 'focus') {
        const nextCount = sessionsCompleted + 1;
        setSessionsCompleted(nextCount);
        if (nextCount % 4 === 0) {
          switchMode('longBreak');
        } else {
          switchMode('shortBreak');
        }
      } else {
        switchMode('focus');
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, sessionsCompleted]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setTimeLeft(TIMER_MODES[newMode].duration);
    setIsRunning(false);
  };

  const toggleTimer = () => {
    setIsRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(TIMER_MODES[mode].duration);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.round(
    ((TIMER_MODES[mode].duration - timeLeft) / TIMER_MODES[mode].duration) * 100
  );

  return (
    <div className={`pomodoro-card ${isMinimized ? 'minimized' : ''}`}>
      <div className="pomodoro-header">
        <div className="pomodoro-badge">
          <Flame size={15} className="flame-icon" />
          <span>Study Sprint Engine</span>
        </div>
        <div className="pomodoro-actions">
          <button
            className="icon-btn-ghost"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute Chime' : 'Unmute Chime'}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
          <button
            className="icon-btn-ghost"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
        </div>
      </div>

      {isMinimized ? (
        <div className="pomodoro-mini-row" onClick={() => setIsMinimized(false)}>
          <div className="mini-time">{formatTime(timeLeft)}</div>
          <div className="mini-mode">{TIMER_MODES[mode].label}</div>
          <button
            className="mini-play-btn"
            onClick={(e) => {
              e.stopPropagation();
              toggleTimer();
            }}
          >
            {isRunning ? <Pause size={12} /> : <Play size={12} />}
          </button>
        </div>
      ) : (
        <div className="pomodoro-body">
          {/* Active Task Link */}
          {activeTask ? (
            <div className="pomodoro-task-chip">
              <span className="task-chip-prefix">Focusing on:</span>
              <span className="task-chip-title" title={activeTask.title}>
                {activeTask.title}
              </span>
              <button
                className="task-chip-clear"
                onClick={onClearActiveTask}
                title="Detach Task"
              >
                &times;
              </button>
            </div>
          ) : (
            <div className="pomodoro-no-task">
              Click <Flame size={12} style={{ display: 'inline', color: 'var(--warning)' }} /> on any task card to track dedicated focus time.
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="pomodoro-tabs">
            {Object.entries(TIMER_MODES).map(([key, config]) => (
              <button
                key={key}
                className={`pomodoro-tab ${mode === key ? 'active' : ''}`}
                onClick={() => switchMode(key)}
              >
                {key === 'focus' ? '🎯 Focus (25m)' : key === 'shortBreak' ? '☕ Break (5m)' : '🌴 Long (15m)'}
              </button>
            ))}
          </div>

          {/* Time Display */}
          <div className="pomodoro-clock-wrap">
            <div className="pomodoro-clock-text">{formatTime(timeLeft)}</div>
            <div className="pomodoro-progress-bar">
              <div
                className="pomodoro-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Timer Controls */}
          <div className="pomodoro-controls">
            <button
              className={`pomodoro-btn-primary ${isRunning ? 'running' : ''}`}
              onClick={toggleTimer}
            >
              {isRunning ? (
                <>
                  <Pause size={16} /> Pause
                </>
              ) : (
                <>
                  <Play size={16} /> Start Focus
                </>
              )}
            </button>
            <button className="pomodoro-btn-secondary" onClick={resetTimer} title="Reset Timer">
              <RotateCcw size={15} />
            </button>
          </div>

          {/* Session Tracker */}
          <div className="pomodoro-footer">
            <div className="pomodoro-sessions">
              <span>Sprints:</span>
              <div className="session-dots">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`session-dot ${sessionsCompleted % 4 > idx ? 'filled' : ''}`}
                  />
                ))}
              </div>
              <span className="session-count">({sessionsCompleted} completed)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
