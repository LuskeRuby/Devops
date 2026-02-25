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
INSERT INTO users (id, Family_Email, Image_ID, email, name, role, pincode) VALUES
  (1, 'johnson@family.com', 1, 'mark@family.com', 'Mark Johnson', 'PARENT', '1234'),
  (2, 'johnson@family.com', 2, 'sarah@family.com', 'Sarah Johnson', 'PARENT', '5678'),
  (3, 'johnson@family.com', 3, 'tim@family.com', 'Tim Johnson', 'CHILD', '0000'),
  (4, 'smith@family.com', 1, 'dave@family.com', 'Dave Smith', 'PARENT', '1111');

-- Tasks (Added explicit IDs to ensure UserTask maps perfectly)
INSERT INTO task (id, Image_ID, name, timestamp, description, points, checked, Repeat_every, Repeat_Until) VALUES
  (1, 4, 'Clean Kitchen', NOW(), 'Clean all surfaces and mop the floor', 10, false, 'Weekly', '2026-12-31 23:59:59'),
  (2, 4, 'Take out trash', NOW(), 'Take out all bins', 5, false, 'Daily', '2026-12-31 23:59:59');

-- UserTask
INSERT INTO user_task (User_ID, Task_ID) VALUES
  (1, 1),
  (3, 2);

-- Messages
INSERT INTO message (id, User_ID, content, timestamp) VALUES
  (1, 1, 'Don''t forget to clean the kitchen today!', NOW()),
  (2, 2, 'I already did it!', NOW());