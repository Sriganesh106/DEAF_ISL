-- ============================================
-- Silent Learn — Seed Data
-- ============================================

-- Demo parent
INSERT INTO profiles (id, name, email, role) VALUES
('a0000000-0000-0000-0000-000000000001', 'Sarah Miller', 'sarah@example.com', 'parent');

-- Demo students (children of Sarah)
INSERT INTO profiles (id, name, email, role, parent_id) VALUES
('b0000000-0000-0000-0000-000000000001', 'Alex Miller', 'alex@example.com', 'student', 'a0000000-0000-0000-0000-000000000001'),
('b0000000-0000-0000-0000-000000000002', 'Emma Miller', 'emma@example.com', 'student', 'a0000000-0000-0000-0000-000000000001');

-- Student Stats for Alex
INSERT INTO student_stats (student_id, signs_learned, total_signs, practice_streak, avg_accuracy, total_time_seconds, total_xp, last_active_date, quizzes_taken, avg_quiz_score) VALUES
('b0000000-0000-0000-0000-000000000001', 18, 26, 5, 87.5, 15120, 650, CURRENT_DATE, 12, 88);

-- Student Stats for Emma
INSERT INTO student_stats (student_id, signs_learned, total_signs, practice_streak, avg_accuracy, total_time_seconds, total_xp, last_active_date, quizzes_taken, avg_quiz_score) VALUES
('b0000000-0000-0000-0000-000000000002', 10, 26, 3, 79.0, 8400, 350, CURRENT_DATE, 6, 76);

-- Learning Progress for Alex
INSERT INTO learning_progress (student_id, lesson_id, lesson_title, status, xp_earned, accuracy, completed_at) VALUES
('b0000000-0000-0000-0000-000000000001', 'isl-a-j', 'Alphabets A–J', 'completed', 50, 92, now() - interval '2 days'),
('b0000000-0000-0000-0000-000000000001', 'isl-k-t', 'Alphabets K–T', 'completed', 50, 85, now() - interval '1 day'),
('b0000000-0000-0000-0000-000000000001', 'isl-u-z', 'Alphabets U–Z', 'in_progress', 25, 78, now() - interval '3 hours'),
('b0000000-0000-0000-0000-000000000001', 'isl-numbers', 'Numbers 1–9', 'completed', 50, 95, now() - interval '5 hours');

-- Learning Progress for Emma
INSERT INTO learning_progress (student_id, lesson_id, lesson_title, status, xp_earned, accuracy, completed_at) VALUES
('b0000000-0000-0000-0000-000000000002', 'isl-a-j', 'Alphabets A–J', 'completed', 50, 80, now() - interval '3 days'),
('b0000000-0000-0000-0000-000000000002', 'isl-numbers', 'Numbers 1–9', 'in_progress', 20, 65, now() - interval '1 day');

-- Quiz Results
INSERT INTO quiz_results (student_id, quiz_id, quiz_title, score, total_questions, passed, completed_at) VALUES
('b0000000-0000-0000-0000-000000000001', 'isl-a-j', 'Alphabets A–J', 90, 10, true, now() - interval '2 days'),
('b0000000-0000-0000-0000-000000000001', 'isl-numbers', 'Numbers 1–9', 100, 9, true, now() - interval '5 hours'),
('b0000000-0000-0000-0000-000000000001', 'isl-spell', 'Spell the Word', 85, 8, true, now() - interval '1 hour'),
('b0000000-0000-0000-0000-000000000002', 'isl-a-j', 'Alphabets A–J', 70, 10, true, now() - interval '3 days'),
('b0000000-0000-0000-0000-000000000002', 'isl-numbers', 'Numbers 1–9', 45, 9, false, now() - interval '1 day');

-- Activity Log
INSERT INTO activity_log (student_id, action_type, title, description, accuracy, created_at) VALUES
('b0000000-0000-0000-0000-000000000001', 'sign_practiced', 'Practiced Sign H', 'Practiced the letter H in ISL', 92, now() - interval '5 minutes'),
('b0000000-0000-0000-0000-000000000001', 'ar_session', 'AR: Solar System', 'Explored Solar System in augmented reality', NULL, now() - interval '2 hours'),
('b0000000-0000-0000-0000-000000000001', 'sign_mastered', 'Mastered Sign E', 'Achieved 96% accuracy on letter E', 96, now() - interval '3 hours'),
('b0000000-0000-0000-0000-000000000001', 'quiz_completed', 'Completed Spell the Word Quiz', 'Scored 85% on the spelling quiz', 85, now() - interval '1 hour'),
('b0000000-0000-0000-0000-000000000001', 'lesson_started', 'Started Alphabets K–T', 'Began learning letters K through T', NULL, now() - interval '1 day'),
('b0000000-0000-0000-0000-000000000001', 'lesson_completed', 'Completed Alphabets A–J', 'Finished all exercises for A–J', NULL, now() - interval '2 days'),
('b0000000-0000-0000-0000-000000000002', 'sign_practiced', 'Learned 5 new signs', 'Practiced signs for letters A-E', 80, now() - interval '1 hour'),
('b0000000-0000-0000-0000-000000000002', 'quiz_failed', 'Failed Numbers 1–9 Quiz', 'Scored 45% — needs review', 45, now() - interval '1 day'),
('b0000000-0000-0000-0000-000000000002', 'lesson_started', 'Started Numbers 1–9', 'Began learning number signs', NULL, now() - interval '2 days');

-- AR Sessions
INSERT INTO ar_sessions (student_id, scene_name, scene_icon, duration_seconds, interactions, created_at) VALUES
('b0000000-0000-0000-0000-000000000001', 'Solar System', '🌍', 720, 14, now() - interval '2 hours'),
('b0000000-0000-0000-0000-000000000001', 'Solar System', '🌍', 480, 9, now() - interval '1 day'),
('b0000000-0000-0000-0000-000000000001', 'Solar System', '🌍', 900, 22, now() - interval '2 days'),
('b0000000-0000-0000-0000-000000000001', 'Solar System', '🌍', 600, 11, now() - interval '3 days'),
('b0000000-0000-0000-0000-000000000001', 'Solar System', '🌍', 360, 7, now() - interval '4 days'),
('b0000000-0000-0000-0000-000000000002', 'Solar System', '🌍', 300, 5, now() - interval '2 days'),
('b0000000-0000-0000-0000-000000000002', 'Solar System', '🌍', 420, 8, now() - interval '3 days');

-- Bookmarks
INSERT INTO bookmarks (student_id, lesson_id, note) VALUES
('b0000000-0000-0000-0000-000000000001', 'isl-a-j', 'Review the J sign — tricky!'),
('b0000000-0000-0000-0000-000000000001', 'isl-numbers', NULL);
