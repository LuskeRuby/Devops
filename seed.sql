-- Families
INSERT INTO family (email, password) VALUES
  ('johnson@family.com', 'hashed_password_1'),
  ('smith@family.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHG');

-- Images (Converting strings to PostgreSQL Large Objects)
INSERT INTO image (id, image) VALUES
  (1, lo_from_bytea(0, 'avatar_dad.png'::bytea)),
  (2, lo_from_bytea(0, 'avatar_mom.png'::bytea)),
  (3, lo_from_bytea(0, 'avatar_kid.png'::bytea)),
  (4, lo_from_bytea(0, 'task_icon.png'::bytea));

-- Users (Explicitly providing IDs since GenerationType.IDENTITY is missing in Java)
INSERT INTO users (id, Family_Email, Image_ID, email, name, role, pincode, total_points) VALUES
  (1, 'johnson@family.com', 1, 'mark@family.com', 'Mark Johnson', 'PARENT', '1234', 0),
  (2, 'johnson@family.com', 2, 'sarah@family.com', 'Sarah Johnson', 'PARENT', '5678', 0),
  (3, 'johnson@family.com', 3, 'tim@family.com', 'Tim Johnson', 'CHILD', '0000', 0),
  (4, 'smith@family.com', 1, 'dave@family.com', 'Dave Smith', 'PARENT', '1111', 0);

-- Tasks (Added explicit IDs to ensure UserTask maps perfectly)
INSERT INTO task (id, Image_ID, name, timestamp, description, points, checked, Repeat_every, Repeat_Until) VALUES
  (1, 4, 'Clean Kitchen', NOW(), 'Clean all surfaces and mop the floor', 10, false, 'Weekly', '2026-12-31 23:59:59'),
  (2, 4, 'Take out trash', NOW(), 'Take out all bins', 5, false, 'Daily', '2026-12-31 23:59:59');

-- UserTask
INSERT INTO user_task (User_ID, Task_ID) VALUES
  (1, 1),
  (3, 2);

-- Seed one parent member under johnson family for quick dashboard testing
INSERT INTO users (id, Family_Email, Image_ID, email, name, role, pincode, total_points)
SELECT COALESCE((SELECT MAX(id) + 1 FROM users), 1),
       'johnson@family.com',
       1,
       'test@test.dk',
       'test',
       'PARENT',
       '1234',
       0
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'test@test.dk'
);

-- Seed a current-week calendar event so it shows up immediately
INSERT INTO task (id, Image_ID, name, timestamp, description, points, checked, Repeat_every, Repeat_Until)
SELECT COALESCE((SELECT MAX(id) + 1 FROM task), 1),
       4,
       'Test calendar event',
       NOW() + INTERVAL '1 hour',
       'Dashboard seed event for test user',
       5,
       false,
       'Once',
       NOW() + INTERVAL '2 hours'
WHERE NOT EXISTS (
  SELECT 1
  FROM task
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
    SELECT 1
    FROM user_task ut
    WHERE ut.User_ID = u.id
      AND ut.Task_ID = t.id
  );

-- Messages
INSERT INTO message (id, User_ID, content, timestamp) VALUES
  (1, 1, 'Don''t forget to clean the kitchen today!', NOW()),
  (2, 2, 'I already did it!', NOW());