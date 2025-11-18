-- Migration: create goal_contribution table to store contributions history
CREATE TABLE IF NOT EXISTS `goal_contribution` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `goal_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `note` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX (`goal_id`),
  INDEX (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional FK (uncomment if you have users and goals FK and want enforcement)
-- ALTER TABLE `goal_contribution` ADD CONSTRAINT `fk_gc_goal` FOREIGN KEY (`goal_id`) REFERENCES `goals`(`id`) ON DELETE CASCADE;
-- ALTER TABLE `goal_contribution` ADD CONSTRAINT `fk_gc_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE;
