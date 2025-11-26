-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 26 Nov 2025 pada 13.47
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `etrack`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `accounts`
--

CREATE TABLE `accounts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(120) NOT NULL,
  `balance` bigint(20) DEFAULT 0,
  `currency` varchar(10) DEFAULT 'IDR',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `type` enum('income','expense') NOT NULL,
  `color` varchar(32) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `categories`
--

INSERT INTO `categories` (`id`, `user_id`, `name`, `type`, `color`, `created_at`) VALUES
(2, 1, 'Salary', 'income', NULL, '2025-11-17 11:14:09'),
(3, 223, 'Salary', 'income', NULL, '2025-11-17 18:30:00'),
(4, 223, 'Food', 'income', NULL, '2025-11-17 20:20:18');

-- --------------------------------------------------------

--
-- Struktur dari tabel `goals`
--

CREATE TABLE `goals` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `target_amount` bigint(20) NOT NULL,
  `current_amount` bigint(20) DEFAULT 0,
  `target_date` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `goals`
--

INSERT INTO `goals` (`id`, `user_id`, `title`, `target_amount`, `current_amount`, `target_date`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 223, 'yoo', 2000, 1120, '2025-11-18', 1, '2025-11-18 13:07:24', '2025-11-18 13:18:24'),
(2, 223, 'yyhh', 50000, 12210, '2025-11-30', 1, '2025-11-18 14:19:19', '2025-11-18 18:25:07'),
(3, 223, 'nikah', 100000, 30000, '2026-06-26', 1, '2025-11-26 08:15:27', '2025-11-26 08:15:45');

-- --------------------------------------------------------

--
-- Struktur dari tabel `goal_contributions`
--

CREATE TABLE `goal_contributions` (
  `id` int(11) NOT NULL,
  `goal_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `amount` bigint(20) NOT NULL,
  `contributed_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `goal_contributions`
--

INSERT INTO `goal_contributions` (`id`, `goal_id`, `user_id`, `amount`, `contributed_at`) VALUES
(1, 2, 223, 55, '2025-11-18 17:10:07'),
(2, 2, 223, 55, '2025-11-18 17:10:12'),
(3, 2, 223, 100, '2025-11-18 18:24:47'),
(4, 2, 223, 500, '2025-11-18 18:24:53'),
(5, 2, 223, 500, '2025-11-18 18:24:59'),
(6, 2, 223, 10000, '2025-11-18 18:25:07'),
(7, 3, 223, 20000, '2025-11-26 08:15:45');

-- --------------------------------------------------------

--
-- Struktur dari tabel `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `account_id` int(11) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `type` enum('income','expense') NOT NULL,
  `amount` bigint(20) NOT NULL,
  `currency` varchar(10) DEFAULT 'IDR',
  `occurred_at` datetime NOT NULL,
  `description` text DEFAULT NULL,
  `payment_type` varchar(64) DEFAULT NULL,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `is_recurring` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `transactions`
--

INSERT INTO `transactions` (`id`, `user_id`, `account_id`, `category_id`, `type`, `amount`, `currency`, `occurred_at`, `description`, `payment_type`, `tags`, `is_recurring`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 223, NULL, 3, 'income', 20000, 'IDR', '2025-11-17 00:00:00', 'bekel', 'Cash', NULL, 0, '2025-11-17 19:06:46', '2025-11-17 19:06:46', NULL),
(2, 223, NULL, 4, 'expense', 50000, 'IDR', '2025-11-17 00:00:00', 'bakso', 'Cash', NULL, 0, '2025-11-17 20:20:18', '2025-11-17 20:20:18', NULL),
(3, 223, NULL, 3, 'income', 20, 'IDR', '2025-11-25 00:00:00', 'waw', 'Cash', NULL, 0, '2025-11-25 19:58:30', '2025-11-25 19:58:30', NULL),
(4, 223, NULL, 3, 'income', 50000, 'IDR', '2025-11-25 00:00:00', 'apa', 'Cash', NULL, 0, '2025-11-25 20:08:05', '2025-11-25 20:08:05', NULL),
(5, 223, NULL, 3, 'income', 50000, 'IDR', '2025-11-26 00:00:00', 'dagang', 'Cash', NULL, 0, '2025-11-26 08:12:23', '2025-11-26 08:12:23', NULL),
(6, 223, NULL, 4, 'expense', 20000, 'IDR', '2025-11-26 00:00:00', 'bakso', 'Cash', NULL, 0, '2025-11-26 08:14:07', '2025-11-26 08:14:07', NULL);

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `password` varchar(255) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `name`, `created_at`, `updated_at`, `password`) VALUES
(1, 'zacky@gmail.com', '', 'zacky', '2025-11-17 11:12:58', '2025-11-17 11:12:58', '123456'),
(222, 'drabyoheoryus@gmail.com', '123456', 'drabyo', '2025-11-17 07:57:33', '2025-11-17 07:57:33', ''),
(223, 'gilang@gmail.com', '', 'gilang', '2025-11-17 11:19:13', '2025-11-17 11:19:13', '123456'),
(224, 'ririn@gmail.com', '', 'ririn', '2025-11-17 11:22:14', '2025-11-17 11:22:14', '123456');

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indeks untuk tabel `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indeks untuk tabel `goals`
--
ALTER TABLE `goals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indeks untuk tabel `goal_contributions`
--
ALTER TABLE `goal_contributions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `goal_id` (`goal_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indeks untuk tabel `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `account_id` (`account_id`),
  ADD KEY `idx_transactions_user_date` (`user_id`,`occurred_at`),
  ADD KEY `idx_transactions_category` (`category_id`),
  ADD KEY `idx_transactions_type_date` (`type`,`occurred_at`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `uq_users_email` (`email`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `accounts`
--
ALTER TABLE `accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT untuk tabel `goals`
--
ALTER TABLE `goals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT untuk tabel `goal_contributions`
--
ALTER TABLE `goal_contributions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT untuk tabel `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=225;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `accounts`
--
ALTER TABLE `accounts`
  ADD CONSTRAINT `accounts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `goals`
--
ALTER TABLE `goals`
  ADD CONSTRAINT `goals_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `goal_contributions`
--
ALTER TABLE `goal_contributions`
  ADD CONSTRAINT `goal_contributions_ibfk_1` FOREIGN KEY (`goal_id`) REFERENCES `goals` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `goal_contributions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`),
  ADD CONSTRAINT `transactions_ibfk_3` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
