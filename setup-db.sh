#!/bin/bash

# Database Setup Script for YouTube Monitor

echo "Setting up database for YouTube Monitor..."

# Run MySQL commands
sudo mysql <<EOF
CREATE DATABASE IF NOT EXISTS youtube_monitor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'youtube_monitor'@'localhost' IDENTIFIED BY 'youtube_monitor_pass';
GRANT ALL PRIVILEGES ON youtube_monitor.* TO 'youtube_monitor'@'localhost';
FLUSH PRIVILEGES;
EOF

echo "✓ Database and user created successfully!"
echo ""
echo "Database: youtube_monitor"
echo "User: youtube_monitor"
echo "Password: youtube_monitor_pass"
echo ""
echo "Running migrations..."

cd backend && php artisan migrate --force

echo ""
echo "✓ Setup complete!"
