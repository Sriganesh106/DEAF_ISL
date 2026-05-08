-- ============================================
-- Silent Learn — Supabase Schema
-- ============================================

-- 1. Profiles (students + parents)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'parent', 'admin')),
    avatar_url TEXT,
    parent_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Learning Progress
CREATE TABLE IF NOT EXISTS learning_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL,
    lesson_title TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    xp_earned INT DEFAULT 50,
    time_spent_seconds INT DEFAULT 0,
    accuracy REAL DEFAULT 0,
    completed_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Quiz Results
CREATE TABLE IF NOT EXISTS quiz_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    quiz_id TEXT NOT NULL,
    quiz_title TEXT,
    score INT NOT NULL,
    total_questions INT DEFAULT 10,
    passed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Activity Log (unified feed)
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('sign_practiced', 'sign_mastered', 'quiz_completed', 'quiz_failed', 'lesson_started', 'lesson_completed', 'ar_session', 'badge_earned')),
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    accuracy REAL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. AR Sessions
CREATE TABLE IF NOT EXISTS ar_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    scene_name TEXT NOT NULL,
    scene_icon TEXT DEFAULT '🌍',
    duration_seconds INT DEFAULT 0,
    interactions INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Student Stats (aggregated, updated via triggers or app logic)
CREATE TABLE IF NOT EXISTS student_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    signs_learned INT DEFAULT 0,
    total_signs INT DEFAULT 26,
    practice_streak INT DEFAULT 0,
    avg_accuracy REAL DEFAULT 0,
    total_time_seconds INT DEFAULT 0,
    total_xp INT DEFAULT 0,
    last_active_date DATE DEFAULT CURRENT_DATE,
    quizzes_taken INT DEFAULT 0,
    avg_quiz_score REAL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Bookmarks & Notes
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, lesson_id)
);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (anon key, no auth yet)
CREATE POLICY "Allow all on profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on learning_progress" ON learning_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on quiz_results" ON quiz_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on activity_log" ON activity_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on ar_sessions" ON ar_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on student_stats" ON student_stats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on bookmarks" ON bookmarks FOR ALL USING (true) WITH CHECK (true);
