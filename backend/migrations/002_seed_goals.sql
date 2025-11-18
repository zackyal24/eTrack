-- Seed some demo goals for user_id = 1
INSERT INTO `goals` (`user_id`, `name`, `target_amount`, `current_amount`, `deadline`, `created_at`)
VALUES
(1, 'Trip to Bali', 6000000.00, 2000000.00, '2025-12-31', NOW()),
(1, 'Buy Laptop', 12000000.00, 3200000.00, '2026-03-01', NOW()),
(1, 'Treadmill', 3500000.00, 900000.00, '2026-02-10', NOW());
