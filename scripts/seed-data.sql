-- ReOpenInnoLab 种子数据
-- 创建开发环境的初始数据

-- 插入默认租户
INSERT INTO tenants (code, name, plan, metadata) VALUES
('demo', 'Demo School', 'pro', '{
    "branding": {
        "logo": "https://example.com/logo.png",
        "primary_color": "#4F46E5",
        "secondary_color": "#10B981"
    },
    "features": {
        "ai_assistant": true,
        "virtual_lab": true,
        "analytics": true
    },
    "limits": {
        "max_users": 1000,
        "max_courses": 100,
        "storage_gb": 100
    }
}') ON CONFLICT (code) DO NOTHING;

-- 插入系统权限
INSERT INTO permissions (name, resource, action, description) VALUES
-- 用户管理权限
('users.create', 'users', 'create', '创建用户'),
('users.read', 'users', 'read', '查看用户'),
('users.update', 'users', 'update', '更新用户'),
('users.delete', 'users', 'delete', '删除用户'),
('users.manage_roles', 'users', 'manage_roles', '管理用户角色'),

-- 课程管理权限
('courses.create', 'courses', 'create', '创建课程'),
('courses.read', 'courses', 'read', '查看课程'),
('courses.update', 'courses', 'update', '更新课程'),
('courses.delete', 'courses', 'delete', '删除课程'),
('courses.publish', 'courses', 'publish', '发布课程'),

-- 班级管理权限
('classrooms.create', 'classrooms', 'create', '创建班级'),
('classrooms.read', 'classrooms', 'read', '查看班级'),
('classrooms.update', 'classrooms', 'update', '更新班级'),
('classrooms.delete', 'classrooms', 'delete', '删除班级'),
('classrooms.manage_members', 'classrooms', 'manage_members', '管理班级成员'),

-- 作业管理权限
('assignments.create', 'assignments', 'create', '创建作业'),
('assignments.read', 'assignments', 'read', '查看作业'),
('assignments.update', 'assignments', 'update', '更新作业'),
('assignments.delete', 'assignments', 'delete', '删除作业'),
('assignments.grade', 'assignments', 'grade', '批改作业'),

-- 实验管理权限
('labs.create', 'labs', 'create', '创建实验'),
('labs.read', 'labs', 'read', '查看实验'),
('labs.update', 'labs', 'update', '更新实验'),
('labs.delete', 'labs', 'delete', '删除实验'),
('labs.run', 'labs', 'run', '运行实验'),

-- 系统管理权限
('system.admin', 'system', 'admin', '系统管理'),
('system.analytics', 'system', 'analytics', '查看系统分析'),
('system.audit', 'system', 'audit', '查看审计日志') ON CONFLICT (name) DO NOTHING;

-- 插入系统角色
INSERT INTO roles (tenant_id, name, description, is_system) VALUES
(NULL, 'super_admin', '超级管理员', TRUE),
(NULL, 'tenant_admin', '租户管理员', TRUE),
(NULL, 'teacher', '教师', TRUE),
(NULL, 'student', '学生', TRUE),
(NULL, 'parent', '家长', TRUE),
(NULL, 'researcher', '研究员', TRUE) ON CONFLICT (tenant_id, name) DO NOTHING;

-- 为系统角色分配权限
-- 超级管理员拥有所有权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'super_admin' AND r.tenant_id IS NULL
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 租户管理员权限（除了系统管理）
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'tenant_admin' AND r.tenant_id IS NULL
AND p.name NOT LIKE 'system.%'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 教师权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'teacher' AND r.tenant_id IS NULL
AND p.name IN (
    'users.read', 'courses.create', 'courses.read', 'courses.update', 'courses.publish',
    'classrooms.create', 'classrooms.read', 'classrooms.update', 'classrooms.manage_members',
    'assignments.create', 'assignments.read', 'assignments.update', 'assignments.grade',
    'labs.create', 'labs.read', 'labs.update', 'labs.run'
) ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 学生权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'student' AND r.tenant_id IS NULL
AND p.name IN (
    'courses.read', 'classrooms.read', 'assignments.read', 'labs.read', 'labs.run'
) ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 家长权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'parent' AND r.tenant_id IS NULL
AND p.name IN (
    'courses.read', 'classrooms.read', 'assignments.read'
) ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 获取租户ID和角色ID用于创建用户
DO $$
DECLARE
    demo_tenant UUID;
    admin_role UUID;
    teacher_role UUID;
    student_role UUID;
BEGIN
    -- 获取demo租户ID
    SELECT id INTO demo_tenant FROM tenants WHERE code = 'demo';

    -- 获取角色ID
    SELECT id INTO admin_role FROM roles WHERE name = 'super_admin' AND tenant_id IS NULL;
    SELECT id INTO teacher_role FROM roles WHERE name = 'teacher' AND tenant_id IS NULL;
    SELECT id INTO student_role FROM roles WHERE name = 'student' AND tenant_id IS NULL;

    -- 插入管理员用户
    INSERT INTO users (tenant_id, email, name, password_hash, role_type, status, profile_json) VALUES
    (demo_tenant, 'admin@reopenlab.dev', '系统管理员', crypt('admin123', gen_salt('bf')), 'admin', 'active', '{
        "avatar": null,
        "timezone": "Asia/Shanghai",
        "language": "zh-CN",
        "notifications": {"email": true, "push": true, "sms": false},
        "preferences": {"theme": "auto", "workspace_layout": "default"}
    }') ON CONFLICT (email) DO NOTHING;

    -- 插入教师用户
    INSERT INTO users (tenant_id, email, name, password_hash, role_type, status, profile_json) VALUES
    (demo_tenant, 'teacher@reopenlab.dev', '张老师', crypt('teacher123', gen_salt('bf')), 'teacher', 'active', '{
        "avatar": null,
        "timezone": "Asia/Shanghai",
        "language": "zh-CN",
        "notifications": {"email": true, "push": true, "sms": false},
        "preferences": {"theme": "light", "workspace_layout": "teacher"}
    }') ON CONFLICT (email) DO NOTHING;

    -- 插入学生用户
    INSERT INTO users (tenant_id, email, name, password_hash, role_type, status, profile_json) VALUES
    (demo_tenant, 'student@reopenlab.dev', '李同学', crypt('student123', gen_salt('bf')), 'student', 'active', '{
        "avatar": null,
        "timezone": "Asia/Shanghai",
        "language": "zh-CN",
        "notifications": {"email": true, "push": false, "sms": false},
        "preferences": {"theme": "auto", "workspace_layout": "student"}
    }') ON CONFLICT (email) DO NOTHING;

    -- 为用户分配角色
    INSERT INTO user_roles (user_id, role_id, assigned_by)
    SELECT u.id, admin_role, u.id FROM users u WHERE u.email = 'admin@reopenlab.dev'
    ON CONFLICT (user_id, role_id) DO NOTHING;

    INSERT INTO user_roles (user_id, role_id, assigned_by)
    SELECT u.id, teacher_role, u.id FROM users u WHERE u.email = 'teacher@reopenlab.dev'
    ON CONFLICT (user_id, role_id) DO NOTHING;

    INSERT INTO user_roles (user_id, role_id, assigned_by)
    SELECT u.id, student_role, u.id FROM users u WHERE u.email = 'student@reopenlab.dev'
    ON CONFLICT (user_id, role_id) DO NOTHING;
END $$;

-- 插入认证提供商配置
INSERT INTO auth_providers (tenant_id, provider_name, config, is_enabled) VALUES
((SELECT id FROM tenants WHERE code = 'demo'), 'local', '{"enabled": true, "password_policy": {"min_length": 8, "require_uppercase": true, "require_lowercase": true, "require_numbers": true}}', true),
((SELECT id FROM tenants WHERE code = 'demo'), 'oauth_google', '{"client_id": "your-google-client-id", "client_secret": "your-google-client-secret", "redirect_uri": "http://localhost:3000/auth/google/callback"}', false),
((SELECT id FROM tenants WHERE code = 'demo'), 'oauth_microsoft', '{"client_id": "your-microsoft-client-id", "client_secret": "your-microsoft-client-secret", "redirect_uri": "http://localhost:3000/auth/microsoft/callback"}', false)
ON CONFLICT (tenant_id, provider_name) DO NOTHING;

-- 创建数据库函数：验证密码
CREATE OR REPLACE FUNCTION verify_user_password(user_email VARCHAR, password_plain VARCHAR)
RETURNS TABLE(user_id UUID, tenant_id UUID, is_valid BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.tenant_id, (u.password_hash = crypt(password_plain, u.password_hash)) AS is_valid
    FROM users u
    WHERE u.email = user_email AND u.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建数据库函数：获取用户权限
CREATE OR REPLACE FUNCTION get_user_permissions(user_id_param UUID)
RETURNS TABLE(permission_name VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT p.name
    FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    JOIN user_roles ur ON rp.role_id = ur.role_id
    WHERE ur.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建视图：用户完整信息
CREATE OR REPLACE VIEW user_profiles AS
SELECT
    u.id,
    u.tenant_id,
    u.email,
    u.name,
    u.role_type,
    u.status,
    u.last_login_at,
    u.profile_json,
    u.created_at,
    u.updated_at,
    t.code as tenant_code,
    t.name as tenant_name,
    ARRAY_AGG(DISTINCT r.name) as roles
FROM users u
JOIN tenants t ON u.tenant_id = t.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.id, u.tenant_id, u.email, u.name, u.role_type, u.status, u.last_login_at, u.profile_json, u.created_at, u.updated_at, t.code, t.name;

-- 设置行级安全策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY tenant_isolation_users ON users
    FOR ALL TO authenticated_role
    USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

CREATE POLICY own_sessions ON user_sessions
    FOR ALL TO authenticated_role
    USING (user_id = current_setting('app.current_user_id', true)::UUID);

CREATE POLICY tenant_audit_logs ON audit_logs
    FOR ALL TO authenticated_role
    USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- 创建应用角色
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated_role') THEN
        CREATE ROLE authenticated_role;
    END IF;
END $$;

-- 授权
GRANT USAGE ON SCHEMA public TO authenticated_role;
GRANT SELECT ON user_profiles TO authenticated_role;
GRANT SELECT, INSERT, UPDATE ON user_sessions TO authenticated_role;
GRANT SELECT ON audit_logs TO authenticated_role;