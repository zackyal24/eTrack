-- seed_transactions.sql
-- Creates `categories` and `transactions` (single-table approach) and inserts sample data.
-- IMPORTANT: Run on a test DB first. Backup existing DB before importing.

CREATE TABLE IF NOT EXISTS `categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categories_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `transactions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `category_id` BIGINT UNSIGNED NULL,
  `amount` BIGINT NOT NULL,
  `type` ENUM('income','expense') NOT NULL,
  `occurred_at` DATETIME NOT NULL,
  `description` VARCHAR(255) NULL,
  `payment_type` VARCHAR(60) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  `deleted_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tx_user_occurred` (`user_id`,`occurred_at`),
  CONSTRAINT `tx_fk_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample categories
INSERT INTO categories (name) VALUES
('Salary'),('Freelance'),('Rent'),('Food')
ON DUPLICATE KEY UPDATE name = name;

-- Sample transactions (amount in whole Rupiah)
INSERT INTO transactions (user_id, category_id, amount, type, occurred_at, description, payment_type)
VALUES
(1, (SELECT id FROM categories WHERE name='Salary' LIMIT 1), 9000000, 'income', '2025-11-01 09:00:00', 'Nov salary', 'Transfer'),
(1, (SELECT id FROM categories WHERE name='Freelance' LIMIT 1), 2200000, 'income', '2025-11-11 14:00:00', 'Project A', 'Transfer'),
(1, (SELECT id FROM categories WHERE name='Rent' LIMIT 1), 3000000, 'expense', '2025-11-05 08:00:00', 'Monthly rent', 'Transfer'),
(1, (SELECT id FROM categories WHERE name='Food' LIMIT 1), 2400000, 'expense', '2025-11-12 13:00:00', 'Groceries', 'Cash');

-- Quick verification selects
SELECT COUNT(*) AS c_categories FROM categories;
SELECT COUNT(*) AS c_transactions FROM transactions;

-- End of seed_transactions.sql
