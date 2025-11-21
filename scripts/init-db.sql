-- CodeGymnasium Database Initialization Script
-- PostgreSQL Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- USERS & AUTHENTICATION
-- ==============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar_url VARCHAR(500),
    bio TEXT,
    location VARCHAR(100),
    website VARCHAR(255),
    github_username VARCHAR(100),
    linkedin_url VARCHAR(255),
    role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
    subscription_type VARCHAR(20) DEFAULT 'free' CHECK (subscription_type IN ('free', 'premium', 'enterprise')),
    subscription_expires_at TIMESTAMP,
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    total_score INTEGER DEFAULT 0,
    problems_solved INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) NOT NULL,
    device_info VARCHAR(255),
    ip_address VARCHAR(45),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_social_logins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'github', 'linkedin')),
    provider_user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id)
);

-- ==============================================
-- COURSES & TOPICS
-- ==============================================

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    category VARCHAR(100) NOT NULL,
    thumbnail_url VARCHAR(500),
    estimated_duration_hours INTEGER,
    instructor_id UUID REFERENCES users(id),
    is_published BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    order_index INTEGER,
    enrollment_count INTEGER DEFAULT 0,
    completion_count INTEGER DEFAULT 0,
    rating_average DECIMAL(3, 2) DEFAULT 0.0,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT,
    video_url VARCHAR(500),
    order_index INTEGER NOT NULL,
    estimated_duration_minutes INTEGER,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    progress_percentage DECIMAL(5, 2) DEFAULT 0.0,
    is_completed BOOLEAN DEFAULT FALSE,
    last_accessed_topic_id UUID REFERENCES topics(id),
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    UNIQUE(user_id, course_id)
);

CREATE TABLE user_topic_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT FALSE,
    time_spent_seconds INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    UNIQUE(user_id, topic_id)
);

-- ==============================================
-- PROBLEMS & CHALLENGES
-- ==============================================

CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    category VARCHAR(100),
    tags TEXT[], -- Array of tags
    constraints TEXT,
    input_format TEXT,
    output_format TEXT,
    time_limit_ms INTEGER DEFAULT 2000,
    memory_limit_mb INTEGER DEFAULT 256,
    score_points INTEGER DEFAULT 100,
    acceptance_rate DECIMAL(5, 2) DEFAULT 0.0,
    total_submissions INTEGER DEFAULT 0,
    total_accepted INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE problem_examples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    output TEXT NOT NULL,
    explanation TEXT,
    order_index INTEGER NOT NULL
);

CREATE TABLE problem_test_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_sample BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT TRUE,
    order_index INTEGER NOT NULL
);

CREATE TABLE problem_editorials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID UNIQUE NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    time_complexity VARCHAR(100),
    space_complexity VARCHAR(100),
    approach VARCHAR(255),
    code_snippets JSONB, -- {language: code}
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- SUBMISSIONS & CODE EXECUTION
-- ==============================================

CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    language VARCHAR(50) NOT NULL,
    code TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'running', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'runtime_error', 'compilation_error')),
    execution_time_ms INTEGER,
    memory_used_kb INTEGER,
    test_cases_passed INTEGER DEFAULT 0,
    test_cases_total INTEGER DEFAULT 0,
    error_message TEXT,
    score INTEGER DEFAULT 0,
    is_accepted BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_problem_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    attempts_count INTEGER DEFAULT 0,
    is_solved BOOLEAN DEFAULT FALSE,
    best_submission_id UUID REFERENCES submissions(id),
    first_solved_at TIMESTAMP,
    last_attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, problem_id)
);

-- ==============================================
-- CHALLENGES & CONTESTS
-- ==============================================

CREATE TABLE challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly', 'special')),
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard', 'mixed')),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_ranked BOOLEAN DEFAULT TRUE,
    max_participants INTEGER,
    prize_description TEXT,
    total_participants INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE challenge_problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    points INTEGER NOT NULL,
    UNIQUE(challenge_id, problem_id)
);

CREATE TABLE challenge_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_score INTEGER DEFAULT 0,
    problems_solved INTEGER DEFAULT 0,
    rank INTEGER,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_submission_at TIMESTAMP,
    UNIQUE(challenge_id, user_id)
);

CREATE TABLE challenge_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES challenge_participants(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    points_earned INTEGER DEFAULT 0,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- ACHIEVEMENTS & BADGES
-- ==============================================

CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    category VARCHAR(50),
    criteria JSONB, -- Conditions to earn the badge
    rarity VARCHAR(20) CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, badge_id)
);

-- ==============================================
-- ANALYTICS & ACTIVITY
-- ==============================================

CREATE TABLE user_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_date DATE NOT NULL,
    points_earned INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Courses indexes
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_difficulty ON courses(difficulty);
CREATE INDEX idx_courses_is_published ON courses(is_published);
CREATE INDEX idx_courses_slug ON courses(slug);

-- Problems indexes
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_category ON problems(category);
CREATE INDEX idx_problems_is_published ON problems(is_published);
CREATE INDEX idx_problems_slug ON problems(slug);
CREATE INDEX idx_problems_tags ON problems USING GIN(tags);

-- Submissions indexes
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_problem_id ON submissions(problem_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at);

-- Challenges indexes
CREATE INDEX idx_challenges_type ON challenges(type);
CREATE INDEX idx_challenges_start_time ON challenges(start_time);
CREATE INDEX idx_challenges_end_time ON challenges(end_time);
CREATE INDEX idx_challenges_is_active ON challenges(is_active);

-- ==============================================
-- TRIGGERS FOR UPDATED_AT
-- ==============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON topics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_problems_updated_at BEFORE UPDATE ON problems FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- SAMPLE DATA (Optional - for development)
-- ==============================================

-- Insert sample admin user (password: admin123)
INSERT INTO users (username, email, password_hash, full_name, role, is_email_verified)
VALUES ('admin', 'admin@codegymnasium.com', '$2b$10$YourHashedPasswordHere', 'Admin User', 'admin', TRUE);

-- Insert sample categories and courses
INSERT INTO courses (title, slug, description, difficulty, category, is_published, order_index)
VALUES 
    ('Data Structures Fundamentals', 'data-structures-fundamentals', 'Learn the basics of data structures', 'beginner', 'Data Structures', TRUE, 1),
    ('Algorithms & Problem Solving', 'algorithms-problem-solving', 'Master algorithmic thinking', 'intermediate', 'Algorithms', TRUE, 2),
    ('Web Development with JavaScript', 'web-development-javascript', 'Build modern web applications', 'beginner', 'Web Development', TRUE, 3);

-- End of initialization script
