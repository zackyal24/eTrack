-- split_tables.sql
-- Purpose: create separate `income` and `expense` tables, plus categories table (if missing),
-- and migration helper statements to move data from an existing `transactions` table into the new split tables.
-- IMPORTANT: run these in a test copy first. Backup your DB before running destructive statements.

-- 1) Create categories (if you don't have it already)
CREATE TABLE IF NOT EXISTS `categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categories_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2) Create income table
CREATE TABLE IF NOT EXISTS `income` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `category_id` BIGINT UNSIGNED NULL,
  `amount` BIGINT NOT NULL, -- store in smallest currency unit (e.g. cents) or use integer for whole units
  `occurred_at` DATETIME NOT NULL,
  `description` VARCHAR(255) NULL,
  `payment_type` VARCHAR(60) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  `deleted_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  KEY `idx_income_user_occurred` (`user_id`,`occurred_at`),
  CONSTRAINT `income_fk_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) Create expense table
CREATE TABLE IF NOT EXISTS `expense` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `category_id` BIGINT UNSIGNED NULL,
  `amount` BIGINT NOT NULL,
  `occurred_at` DATETIME NOT NULL,
  `description` VARCHAR(255) NULL,
  `payment_type` VARCHAR(60) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  `deleted_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  KEY `idx_expense_user_occurred` (`user_id`,`occurred_at`),
  CONSTRAINT `expense_fk_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- Migration helpers
-- If you already have a `transactions` table with columns similar to: id,user_id,category_id,amount,type,occurred_at,description,payment_type,deleted_at
-- you can migrate rows like this. First run SELECTs to preview.

-- Preview income rows to migrate
SELECT * FROM transactions WHERE type = 'income' LIMIT 20;
-- Preview expense rows to migrate
SELECT * FROM transactions WHERE type = 'expense' LIMIT 20;

-- Insert income rows into `income` (example; adjust column names/types if different):
-- NOTE: Use transaction and test first on a copy of the DB.

START TRANSACTION;

INSERT INTO income (user_id, category_id, amount, occurred_at, description, payment_type, created_at, updated_at, deleted_at)
SELECT user_id, category_id, amount, occurred_at, description, payment_type, created_at, updated_at, deleted_at
FROM transactions
WHERE type = 'income' AND (deleted_at IS NULL OR deleted_at = '0000-00-00 00:00:00');

INSERT INTO expense (user_id, category_id, amount, occurred_at, description, payment_type, created_at, updated_at, deleted_at)
SELECT user_id, category_id, amount, occurred_at, description, payment_type, created_at, updated_at, deleted_at
FROM transactions
WHERE type = 'expense' AND (deleted_at IS NULL OR deleted_at = '0000-00-00 00:00:00');

-- After verifying data looks good, you can optionally drop or archive the transactions table:
-- RENAME TABLE transactions TO transactions_archive_YYYYMMDD;

COMMIT;

-- =====================
-- Sample seed data (for testing)
INSERT INTO categories (name) VALUES ('Salary') ON DUPLICATE KEY UPDATE name=name;
INSERT INTO categories (name) VALUES ('Freelance') ON DUPLICATE KEY UPDATE name=name;
INSERT INTO categories (name) VALUES ('Rent') ON DUPLICATE KEY UPDATE name=name;
INSERT INTO categories (name) VALUES ('Food') ON DUPLICATE KEY UPDATE name=name;

-- Small sample incomes
INSERT INTO income (user_id, category_id, amount, occurred_at, description)
VALUES
(1, (SELECT id FROM categories WHERE name='Salary' LIMIT 1), 9000000, '2025-11-01 09:00:00', 'Nov salary'),
(1, (SELECT id FROM categories WHERE name='Freelance' LIMIT 1), 2200000, '2025-11-11 14:00:00', 'Project A');

-- Small sample expenses
INSERT INTO expense (user_id, category_id, amount, occurred_at, description)
VALUES
(1, (SELECT id FROM categories WHERE name='Rent' LIMIT 1), 3000000, '2025-11-05 08:00:00', 'Monthly rent'),
(1, (SELECT id FROM categories WHERE name='Food' LIMIT 1), 2400000, '2025-11-12 13:00:00', 'Groceries');

-- =====================
-- Import instructions (phpMyAdmin or mysql CLI):
-- phpMyAdmin: open SQL tab, paste this file and run (do step-by-step, not all at once).
-- mysql CLI (from terminal):
-- mysql -u root -p etrack < split_tables.sql

-- Always backup before running migration: use mysqldump or phpMyAdmin export.

-- End of split_tables.sql
