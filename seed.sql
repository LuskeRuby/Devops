-- Families
INSERT INTO familie (email, password) VALUES
  ('test@test.dk', 'test'),
  ('smith@family.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHG');

-- Images
INSERT INTO image (id, image) VALUES
  (1, 'avatar_dad.png'),
  (2, 'avatar_mom.png'),
  (3, 'avatar_kid.png'),
  (4, 'task_icon.png');

-- Users
INSERT INTO users (familie_email, image_id, name, role, pincode) VALUES
  ('johnson@family.com', 1, 'Mark Johnson', 'PARENT', '1234'),
  ('johnson@family.com', 2, 'Sarah Johnson', 'PARENT', '5678'),
  ('johnson@family.com', 3, 'Tim Johnson', 'CHILD', '0000'),
  ('smith@family.com', 1, 'Dave Smith', 'PARENT', '1111');

-- Tasks
INSERT INTO task (image_id, name, timestamp, description, checked, repeat_every, repeat_until) VALUES
  (4, 'Clean Kitchen', NOW(), 'Clean all surfaces and mop the floor', false, 7, '2026-12-31'),
  (4, 'Take out trash', NOW(), 'Take out all bins', false, 3, '2026-12-31');

-- UserTask
INSERT INTO user_task (user_id, task_id) VALUES
  (1, 1),
  (3, 2);

-- Messages
INSERT INTO message (user_id, content, timestamp) VALUES
  (1, 'Don''t forget to clean the kitchen today!', NOW()),
  (2, 'I already did it!', NOW());