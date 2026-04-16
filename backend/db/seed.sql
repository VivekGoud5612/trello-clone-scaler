-- Seed Data for Trello Clone

-- Sample Users
INSERT INTO users (name, email, avatar_color) VALUES
('Alex Johnson', 'alex@example.com', '#0079BF'),
('Sarah Miller', 'sarah@example.com', '#D29034'),
('Mike Chen', 'mike@example.com', '#519839'),
('Emily Davis', 'emily@example.com', '#B04632'),
('James Wilson', 'james@example.com', '#89609E');

-- Sample Boards
INSERT INTO boards (title, background) VALUES
('Project Alpha', '#0079BF'),
('Marketing Campaign', '#D29034'),
('Bug Tracker', '#519839');

-- Labels for Board 1 (Project Alpha)
INSERT INTO labels (board_id, name, color) VALUES
(1, 'Urgent', '#EB5A46'),
(1, 'Feature', '#61BD4F'),
(1, 'Bug', '#F2D600'),
(1, 'Enhancement', '#0079BF'),
(1, 'Documentation', '#C377E0'),
(1, 'Design', '#FF9F1A');

-- Labels for Board 2 (Marketing)
INSERT INTO labels (board_id, name, color) VALUES
(2, 'Social Media', '#61BD4F'),
(2, 'Email', '#0079BF'),
(2, 'Blog', '#F2D600'),
(2, 'Video', '#EB5A46');

-- Labels for Board 3 (Bug Tracker)
INSERT INTO labels (board_id, name, color) VALUES
(3, 'Critical', '#EB5A46'),
(3, 'Major', '#F2D600'),
(3, 'Minor', '#61BD4F'),
(3, 'Won''t Fix', '#B3BAC5');

-- Lists for Board 1 (Project Alpha)
INSERT INTO lists (board_id, title, position) VALUES
(1, 'Backlog', 0),
(1, 'To Do', 1),
(1, 'In Progress', 2),
(1, 'Review', 3),
(1, 'Done', 4);

-- Lists for Board 2 (Marketing)
INSERT INTO lists (board_id, title, position) VALUES
(2, 'Ideas', 0),
(2, 'Planning', 1),
(2, 'In Progress', 2),
(2, 'Published', 3);

-- Lists for Board 3 (Bug Tracker)
INSERT INTO lists (board_id, title, position) VALUES
(3, 'Reported', 0),
(3, 'Confirmed', 1),
(3, 'In Progress', 2),
(3, 'Resolved', 3);

-- Cards for Board 1, List 1 (Backlog)
INSERT INTO cards (list_id, title, description, position, due_date) VALUES
(1, 'Research authentication options', 'Evaluate OAuth2, JWT, and session-based auth for the application.', 0, '2026-05-01'),
(1, 'Design database schema', 'Create ER diagram and define all tables with relationships.', 1, NULL),
(1, 'Set up CI/CD pipeline', 'Configure GitHub Actions for automated testing and deployment.', 2, '2026-04-25');

-- Cards for Board 1, List 2 (To Do)
INSERT INTO cards (list_id, title, description, position, due_date, cover_color) VALUES
(2, 'Implement user registration', 'Build registration form with email verification.', 0, '2026-04-20', '#61BD4F'),
(2, 'Create API documentation', 'Use Swagger/OpenAPI to document all endpoints.', 1, '2026-04-22', NULL),
(2, 'Design landing page', 'Create mockup for the landing page with responsive layout.', 2, '2026-04-18', '#0079BF');

-- Cards for Board 1, List 3 (In Progress)
INSERT INTO cards (list_id, title, description, position, due_date) VALUES
(3, 'Build dashboard UI', 'Create the main dashboard with charts and statistics.', 0, '2026-04-17'),
(3, 'Implement search functionality', 'Add full-text search across all entities.', 1, '2026-04-19');

-- Cards for Board 1, List 4 (Review)
INSERT INTO cards (list_id, title, description, position) VALUES
(4, 'Code review: Auth module', 'Review PR #42 for the authentication module.', 0);

-- Cards for Board 1, List 5 (Done)
INSERT INTO cards (list_id, title, description, position) VALUES
(5, 'Project setup', 'Initialize project with React and Express.', 0),
(5, 'Database configuration', 'Set up PostgreSQL with connection pooling.', 1);

-- Cards for Board 2
INSERT INTO cards (list_id, title, description, position) VALUES
(6, 'Blog post about product launch', 'Write a comprehensive blog post.', 0),
(6, 'Social media content calendar', 'Plan 30 days of social media content.', 1),
(7, 'Email newsletter template', 'Design HTML email template.', 0),
(8, 'Instagram campaign', 'Create visual assets for Instagram.', 0),
(9, 'Product launch announcement', 'Published blog post about the launch.', 0);

-- Cards for Board 3
INSERT INTO cards (list_id, title, description, position, due_date) VALUES
(10, 'Login page CSS broken on Safari', 'Flexbox layout not rendering correctly.', 0, '2026-04-16'),
(10, 'API returns 500 on empty input', 'Validation missing for empty strings.', 1, '2026-04-17'),
(11, 'Memory leak in WebSocket handler', 'Connections not being cleaned up.', 0, '2026-04-15'),
(12, 'Fix pagination offset', 'Off-by-one error in pagination logic.', 0, NULL),
(13, 'Update error messages', 'Improved user-facing error messages.', 0, NULL);

-- Card Labels
INSERT INTO card_labels (card_id, label_id) VALUES
(1, 4), (2, 5), (3, 4),
(4, 2), (4, 1), (5, 5),
(6, 6), (7, 2), (8, 2),
(9, 2), (18, 11), (19, 12),
(20, 11), (21, 13);

-- Card Members
INSERT INTO card_members (card_id, user_id) VALUES
(1, 1), (1, 3), (4, 2), (4, 4),
(5, 1), (7, 3), (7, 5), (8, 2),
(9, 1), (9, 4), (18, 3), (20, 5);

-- Checklists
INSERT INTO checklists (card_id, title) VALUES
(4, 'Registration Flow'),
(7, 'Dashboard Components'),
(3, 'CI/CD Tasks');

-- Checklist Items
INSERT INTO checklist_items (checklist_id, title, is_completed, position) VALUES
(1, 'Create registration form UI', TRUE, 0),
(1, 'Add form validation', TRUE, 1),
(1, 'Implement email verification', FALSE, 2),
(1, 'Write unit tests', FALSE, 3),
(2, 'Revenue chart', TRUE, 0),
(2, 'User activity graph', FALSE, 1),
(2, 'Recent orders table', FALSE, 2),
(2, 'Notification panel', FALSE, 3),
(3, 'Configure GitHub Actions', TRUE, 0),
(3, 'Add test stage', TRUE, 1),
(3, 'Add build stage', FALSE, 2),
(3, 'Add deploy stage', FALSE, 3);

-- Comments
INSERT INTO comments (card_id, user_id, content) VALUES
(4, 1, 'Should we use OAuth2 for this? It might be overkill for our use case.'),
(4, 2, 'I agree, JWT with refresh tokens should be sufficient.'),
(7, 3, 'The dashboard mockup looks great! I will start implementing the charts tomorrow.'),
(7, 5, 'Make sure to use a responsive grid layout.'),
(18, 3, 'This only affects Safari 16+. I''ll investigate the flexbox issue.'),
(20, 5, 'I found the root cause - the disconnect handler is not being called properly.');

-- Activity Log
INSERT INTO activity_log (board_id, card_id, user_id, action, details) VALUES
(1, 4, 2, 'created card', 'Created "Implement user registration" in To Do'),
(1, 7, 3, 'moved card', 'Moved "Build dashboard UI" from To Do to In Progress'),
(1, 9, 1, 'moved card', 'Moved "Code review: Auth module" from In Progress to Review'),
(1, 10, 1, 'created card', 'Created "Project setup" in Done'),
(3, 18, 3, 'added label', 'Added "Critical" label to "Login page CSS broken on Safari"');
