-- create_demo_user.sql
-- Creates a simple `users` table if missing and inserts/updates a demo user with id=1
-- NOTE: This uses plaintext password for development because the backend currently compares plaintext.
-- Backup your DB before running on production.

CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(191) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(191) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert or update demo user with id = 1
INSERT INTO users (id, email, password, name) VALUES
(1, 'demo@example.com', 'demo', 'Demo User')
ON DUPLICATE KEY UPDATE
  email = VALUES(email),
  password = VALUES(password),
  name = VALUES(name);

-- Quick verify
SELECT id, email, name, created_at FROM users WHERE id = 1 LIMIT 1;
