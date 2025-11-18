-- Migration: create goals table for eTrack
CREATE TABLE IF NOT EXISTS `goals` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `target_amount` DECIMAL(12,2) NOT NULL,
  `current_amount` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `deadline` DATE DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT NULL,
  `deleted_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optionally add a foreign key if your users table exists and you want enforcement
-- ALTER TABLE `goals` ADD CONSTRAINT `fk_goals_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
