import { supabase, isSupabaseConfigured } from '../lib/supabase';

const LOCAL_STORAGE_KEY = 'student_tasks_local';
const METADATA_STORAGE_KEY = 'student_tasks_metadata_v2';

const initialDemoTasks = [
  {
    id: 'demo-1',
    title: 'Setup Supabase Cloud Database & RLS Security',
    subject: 'Cloud Computing',
    description: 'Create multi-tenant tables, configure Row Level Security policies, and enable real-time replication stream in Supabase Sydney region.',
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_completed: false,
    status: 'in_progress', // 'todo' | 'in_progress' | 'completed'
    priority: 'high',
    estimated_hours: 4,
    subtasks: [
      { id: 'st-1', title: 'Write SQL migration script', completed: true },
      { id: 'st-2', title: 'Test public RLS policies', completed: true },
      { id: 'st-3', title: 'Verify WebSocket replication channel', completed: false },
    ],
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: 'demo-2',
    title: 'Write Distributed Consensus Lab Report',
    subject: 'Distributed Systems',
    description: 'Compare Raft vs Paxos consensus mechanisms regarding leader election, partition tolerance, and log replication throughput.',
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_completed: false,
    status: 'todo',
    priority: 'medium',
    estimated_hours: 6,
    subtasks: [
      { id: 'st-4', title: 'Benchmark cluster with 5 nodes', completed: false },
      { id: 'st-5', title: 'Plot latency under network partitions', completed: false },
      { id: 'st-6', title: 'Finalize PDF presentation', completed: false },
    ],
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'demo-3',
    title: 'Complete Distributed MapReduce Exercise',
    subject: 'Cloud Computing',
    description: 'Implement word count and inverted index distributed mapper & reducer tasks across simulated worker nodes.',
    due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_completed: true,
    status: 'completed',
    priority: 'low',
    estimated_hours: 3,
    subtasks: [
      { id: 'st-7', title: 'Implement custom Mapper interface', completed: true },
      { id: 'st-8', title: 'Implement Reducer aggregation', completed: true },
    ],
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
];

// Metadata helper to preserve subtasks, description, hours if Supabase table has only core columns
const getMetadataStore = () => {
  try {
    const raw = localStorage.getItem(METADATA_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveMetadata = (taskId, data) => {
  try {
    const store = getMetadataStore();
    store[taskId] = { ...(store[taskId] || {}), ...data };
    localStorage.setItem(METADATA_STORAGE_KEY, JSON.stringify(store));
  } catch (_) {}
};

const getLocalTasks = () => {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialDemoTasks));
    return initialDemoTasks;
  }
  try {
    const parsed = JSON.parse(data);
    return parsed.map((t) => ({
      ...t,
      status: t.status || (t.is_completed ? 'completed' : 'todo'),
      subtasks: t.subtasks || [],
      estimated_hours: t.estimated_hours || 2,
    }));
  } catch {
    return initialDemoTasks;
  }
};

const saveLocalTasks = (tasks) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
  window.dispatchEvent(new Event('local_tasks_updated'));
};

// Track whether Supabase table supports extended columns
let supportsExtendedColumns = null;

export const taskService = {
  async getTasks() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Supabase fetch error, fallback to local:', error.message);
          return getLocalTasks();
        }

        const metaStore = getMetadataStore();

        return (data || []).map((t) => {
          const meta = metaStore[t.id] || {};
          return {
            ...t,
            description: t.description !== undefined ? t.description : (meta.description || ''),
            status: t.status || meta.status || (t.is_completed ? 'completed' : 'todo'),
            subtasks: t.subtasks !== undefined ? (t.subtasks || []) : (meta.subtasks || []),
            estimated_hours: t.estimated_hours !== undefined ? t.estimated_hours : (meta.estimated_hours || 2),
            priority: t.priority || 'medium',
          };
        });
      } catch (err) {
        console.warn('Network error reaching Supabase:', err);
        return getLocalTasks();
      }
    }
    return getLocalTasks();
  },

  subscribeToTasks(onUpdate) {
    if (isSupabaseConfigured && supabase) {
      const channel = supabase
        .channel('public:tasks')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tasks' },
          (payload) => {
            onUpdate(payload);
          }
        )
        .subscribe((status) => {
          console.log('Supabase Realtime status:', status);
        });

      return () => {
        supabase.removeChannel(channel);
      };
    }

    const handleStorageChange = () => {
      onUpdate({ eventType: 'LOCAL_SYNC' });
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local_tasks_updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local_tasks_updated', handleStorageChange);
    };
  },

  async createTask(task) {
    const isCompleted = task.status === 'completed';
    const newTask = {
      title: task.title.trim(),
      subject: task.subject.trim() || 'General',
      description: task.description?.trim() || '',
      due_date: task.due_date,
      is_completed: isCompleted,
      status: task.status || (isCompleted ? 'completed' : 'todo'),
      priority: task.priority || 'medium',
      estimated_hours: Number(task.estimated_hours) || 2,
      subtasks: task.subtasks || [],
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      // First attempt: try inserting full payload if extended columns are supported
      if (supportsExtendedColumns !== false) {
        const { data, error } = await supabase
          .from('tasks')
          .insert([newTask])
          .select()
          .single();

        if (!error && data) {
          supportsExtendedColumns = true;
          return data;
        }

        // If error indicates column missing (42703 or message with column)
        if (error && (error.code === '42703' || error.message.includes('column'))) {
          supportsExtendedColumns = false;
        }
      }

      // Safe fallback: insert base columns that exist in all schemas
      const basePayload = {
        title: newTask.title,
        subject: newTask.subject,
        due_date: newTask.due_date,
        is_completed: newTask.is_completed,
        priority: newTask.priority,
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([basePayload])
        .select()
        .single();

      if (!error && data) {
        // Save extended metadata locally so user gets full experience
        saveMetadata(data.id, {
          description: newTask.description,
          status: newTask.status,
          estimated_hours: newTask.estimated_hours,
          subtasks: newTask.subtasks,
        });
        return {
          ...data,
          description: newTask.description,
          status: newTask.status,
          estimated_hours: newTask.estimated_hours,
          subtasks: newTask.subtasks,
        };
      }

      console.warn('Supabase base insert failed, saving to local:', error?.message);
    }

    const tasks = getLocalTasks();
    const localTask = { ...newTask, id: 'task_' + Date.now() };
    saveLocalTasks([localTask, ...tasks]);
    return localTask;
  },

  async updateTask(id, updates) {
    if (updates.status) {
      updates.is_completed = updates.status === 'completed';
    } else if (updates.is_completed !== undefined) {
      updates.status = updates.is_completed ? 'completed' : 'todo';
    }

    // Always update local metadata store
    saveMetadata(id, updates);

    if (isSupabaseConfigured && supabase) {
      // If extended columns are supported, try updating all
      if (supportsExtendedColumns !== false) {
        const { data, error } = await supabase
          .from('tasks')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          return { ...data, ...updates };
        }

        if (error && (error.code === '42703' || error.message.includes('column'))) {
          supportsExtendedColumns = false;
        }
      }

      // Safe fallback for core columns
      const baseUpdates = {};
      if (updates.title !== undefined) baseUpdates.title = updates.title;
      if (updates.subject !== undefined) baseUpdates.subject = updates.subject;
      if (updates.due_date !== undefined) baseUpdates.due_date = updates.due_date;
      if (updates.is_completed !== undefined) baseUpdates.is_completed = updates.is_completed;
      if (updates.priority !== undefined) baseUpdates.priority = updates.priority;

      if (Object.keys(baseUpdates).length > 0) {
        const { data } = await supabase
          .from('tasks')
          .update(baseUpdates)
          .eq('id', id)
          .select()
          .single();

        if (data) {
          return { ...data, ...updates };
        }
      }
    }

    const tasks = getLocalTasks();
    const updated = tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
    saveLocalTasks(updated);
    return updated.find((t) => t.id === id) || updates;
  },

  async toggleTask(task) {
    const willBeCompleted = !task.is_completed;
    return this.updateTask(task.id, {
      is_completed: willBeCompleted,
      status: willBeCompleted ? 'completed' : 'todo',
    });
  },

  async updateStatus(id, newStatus) {
    return this.updateTask(id, {
      status: newStatus,
      is_completed: newStatus === 'completed',
    });
  },

  async updateSubtasks(id, subtasks) {
    return this.updateTask(id, { subtasks });
  },

  async deleteTask(id) {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) {
        console.warn('Supabase delete error, fallback to local:', error.message);
        const tasks = getLocalTasks();
        saveLocalTasks(tasks.filter((t) => t.id !== id));
        return true;
      }
      return true;
    }

    const tasks = getLocalTasks();
    saveLocalTasks(tasks.filter((t) => t.id !== id));
    return true;
  },

  getDbStatus() {
    return {
      isConfigured: isSupabaseConfigured,
      supportsExtendedColumns,
    };
  }
};
