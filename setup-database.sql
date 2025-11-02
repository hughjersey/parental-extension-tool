-- Database setup script for YouTube Monitor
-- Run this with: sudo mysql < setup-database.sql

-- Create database
CREATE DATABASE IF NOT EXISTS youtube_monitor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (change password if needed)
CREATE USER IF NOT EXISTS 'youtube_monitor'@'localhost' IDENTIFIED BY 'youtube_monitor_pass';

-- Grant privileges
GRANT ALL PRIVILEGES ON youtube_monitor.* TO 'youtube_monitor'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;

-- Display success message
SELECT 'Database youtube_monitor created successfully!' as Message;
SELECT 'User youtube_monitor created with password: youtube_monitor_pass' as Message;
SELECT 'Update your .env file with these credentials' as Message;
