-- ==========================================================
-- Supabase Schema for Cloud-Based Student Task Manager (Startup SaaS Edition)
-- Course: Cloud & Distributed Computing
-- ==========================================================

-- 1. Create or alter tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subject TEXT NOT NULL DEFAULT 'General',
    description TEXT DEFAULT '',
    due_date DATE NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'todo', -- 'todo', 'in_progress', 'completed'
    priority TEXT NOT NULL DEFAULT 'medium', -- 'urgent', 'high', 'medium', 'low'
    estimated_hours NUMERIC DEFAULT 2,
    subtasks JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- If the table was already created with fewer columns, add new columns safely:
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'todo';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC DEFAULT 2;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::jsonb;

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 3. Create permissive public policy for student demo
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tasks' AND policyname = 'Allow public read and write access for tasks'
    ) THEN
        CREATE POLICY "Allow public read and write access for tasks"
        ON public.tasks FOR ALL
        USING (true)
        WITH CHECK (true);
    END IF;
END
$$;

-- 4. Enable Realtime Replication for the tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;

-- 5. Seed initial academic tasks
INSERT INTO public.tasks (title, subject, description, due_date, is_completed, status, priority, estimated_hours, subtasks)
VALUES 
(
    'Setup Supabase Cloud Database & RLS Security',
    'Cloud Computing',
    'Configure multi-tenant tables, Row Level Security policies, and enable real-time replication stream in Supabase Sydney region.',
    CURRENT_DATE + INTERVAL '2 days',
    false,
    'in_progress',
    'high',
    4,
    '[{"id":"st-1","title":"Write SQL migration script","completed":true},{"id":"st-2","title":"Test public RLS policies","completed":true},{"id":"st-3","title":"Verify WebSocket replication channel","completed":false}]'::jsonb
),
(
    'Write Distributed Consensus Lab Report',
    'Distributed Systems',
    'Compare Raft vs Paxos consensus mechanisms regarding leader election, partition tolerance, and log replication throughput.',
    CURRENT_DATE + INTERVAL '5 days',
    false,
    'todo',
    'medium',
    6,
    '[{"id":"st-4","title":"Benchmark cluster with 5 nodes","completed":false},{"id":"st-5","title":"Plot latency under network partitions","completed":false}]'::jsonb
),
(
    'Complete Distributed MapReduce Exercise',
    'Cloud Computing',
    'Implement word count and inverted index distributed mapper & reducer tasks across simulated worker nodes.',
    CURRENT_DATE - INTERVAL '1 day',
    true,
    'completed',
    'low',
    3,
    '[{"id":"st-7","title":"Implement custom Mapper interface","completed":true},{"id":"st-8","title":"Implement Reducer aggregation","completed":true}]'::jsonb
)
ON CONFLICT DO NOTHING;
