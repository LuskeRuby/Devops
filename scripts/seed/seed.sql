-- Families
INSERT INTO family (email, password) VALUES
                                         ('johnson@family.com', 'hashed_password_1'),
                                         ('smith@family.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHG');

-- Users
INSERT INTO users (id, Family_Email, email, name, role, pincode, total_points) VALUES
                                                                                   (1, 'johnson@family.com', 'mark@family.com', 'Mark Johnson', 'PARENT', '1234', 0),
                                                                                   (2, 'johnson@family.com', 'sarah@family.com', 'Sarah Johnson', 'PARENT', '5678', 0),
                                                                                   (3, 'johnson@family.com', 'tim@family.com', 'Tim Johnson', 'CHILD', '0000', 0),
                                                                                   (4, 'smith@family.com', 'dave@family.com', 'Dave Smith', 'PARENT', '1111', 0);

-- Tasks
INSERT INTO task (id, name, timestamp, description, points, checked, Repeat_every, Repeat_Until) VALUES
                                                                                                     (1, 'Clean Kitchen', NOW(), 'Clean all surfaces and mop the floor', 10, false, 'Weekly', '2026-12-31 23:59:59'),
                                                                                                     (2, 'Take out trash', NOW(), 'Take out all bins', 5, false, 'Daily', '2026-12-31 23:59:59');

-- UserTask
INSERT INTO user_task (User_ID, Task_ID) VALUES
                                             (1, 1),
                                             (3, 2);

-- Seed test user
INSERT INTO users (id, Family_Email, email, name, role, pincode, total_points)
SELECT COALESCE((SELECT MAX(id) + 1 FROM users), 1),
       'johnson@family.com',
       'test@test.dk',
       'test',
       'PARENT',
       '1234',
       0
    WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'test@test.dk'
);

-- Seed calendar event
INSERT INTO task (id, name, timestamp, description, points, checked, Repeat_every, Repeat_Until)
SELECT COALESCE((SELECT MAX(id) + 1 FROM task), 1),
       'Test calendar event',
       NOW() + INTERVAL '1 hour',
    'Dashboard seed event for test user',
    5,
    false,
    'Once',
    NOW() + INTERVAL '2 hours'
WHERE NOT EXISTS (
    SELECT 1 FROM task
    WHERE name = 'Test calendar event'
  AND description = 'Dashboard seed event for test user'
    );

INSERT INTO user_task (User_ID, Task_ID)
SELECT u.id, t.id
FROM users u
         JOIN task t
              ON t.name = 'Test calendar event'
                  AND t.description = 'Dashboard seed event for test user'
WHERE u.email = 'test@test.dk'
  AND NOT EXISTS (
    SELECT 1 FROM user_task ut
    WHERE ut.User_ID = u.id
      AND ut.Task_ID = t.id
);

-- Messages
INSERT INTO message (id, User_ID, content, timestamp) VALUES
                                                          (1, 1, 'Don''t forget to clean the kitchen today!', NOW()),
                                                          (2, 2, 'I already did it!', NOW());