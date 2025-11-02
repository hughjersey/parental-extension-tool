# YouTube Monitor - Cloud-Based Monitoring System

A complete SaaS solution for monitoring YouTube watch activity across multiple devices with a cloud-hosted control panel.

## Architecture

### Backend (Laravel 12.36.1)
- RESTful API with Sanctum authentication
- MySQL database for multi-tenant data
- Real-time event ingestion from browser extensions
- Dashboard statistics and analytics

### Frontend (React 19.2 + Tailwind 4)
- SPA with React Router
- User registration/login
- Device management with activation codes
- Dashboard with stats and watch history
- Real-time data visualization

### Browser Extension (Manifest V3)
- Chrome/Firefox compatible
- Activation code based device registration
- Real-time YouTube watch event tracking
- Background service worker for API communication

## Setup Instructions

### Prerequisites
- PHP 8.2+
- Composer
- MySQL 5.7+
- Node.js 18+
- npm

### 1. Database Setup

```bash
# Run the database setup script
cd /home/hugh/development/youtube-extension
sudo bash setup-db.sh
```

Or manually:
```bash
sudo mysql < setup-database.sql
```

This creates:
- Database: `youtube_monitor`
- User: `youtube_monitor`
- Password: `youtube_monitor_pass`

### 2. Backend Setup

```bash
cd backend

# Install dependencies
composer install

# Run migrations (already done if setup-db.sh ran)
php artisan migrate

# Start Laravel development server
php artisan serve
```

Backend API will be available at: `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### 4. Browser Extension Setup

1. Open Chrome/Firefox
2. Navigate to extensions page:
   - Chrome: `chrome://extensions/`
   - Firefox: `about:debugging#/runtime/this-firefox`
3. Enable "Developer mode"
4. Click "Load unpacked" (Chrome) or "Load Temporary Add-on" (Firefox)
5. Select the `extension/` directory

## Usage Flow

### For Users

1. **Register Account**
   - Go to `http://localhost:5173/register`
   - Create an account with email/password

2. **Generate Activation Code**
   - Login and navigate to "Devices" page
   - Click "Generate Activation Code"
   - Copy the 12-character code (valid for 24 hours)

3. **Activate Browser Extension**
   - Click the extension icon in your browser
   - Enter the activation code
   - Extension is now activated and monitoring

4. **View Dashboard**
   - Watch events appear in real-time
   - View statistics and analytics
   - Filter watch history
   - Manage devices

### API Endpoints

**Public:**
- `POST /api/register` - Create account
- `POST /api/login` - User login
- `POST /api/devices/activate` - Activate device with code

**Protected (requires Bearer token):**
- `GET /api/user` - Get authenticated user
- `POST /api/logout` - Logout
- `POST /api/activation-codes` - Generate activation code
- `GET /api/activation-codes` - List codes
- `GET /api/devices` - List user's devices
- `POST /api/devices/heartbeat` - Update device last_seen
- `DELETE /api/devices/{id}` - Deactivate device
- `POST /api/watch-events` - Create watch event (real-time)
- `POST /api/watch-events/batch` - Batch create events
- `GET /api/watch-events` - List watch events (paginated, filterable)
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/overview` - Overview data

## Database Schema

### users
- id, name, email, password, timestamps

### devices
- id, user_id, device_uuid, name, browser_type, browser_version, os
- activated_at, last_seen_at, is_active, timestamps

### activation_codes
- id, user_id, code (12 chars), device_id, expires_at, used_at, timestamps

### watch_events
- id, device_id, video_id, video_title, channel_name, channel_id
- video_url, duration_seconds, watch_duration_seconds, watched_at
- thumbnail_url, metadata (JSON), timestamps

## Security Features

- API token-based authentication (Laravel Sanctum)
- Device-specific tokens
- One-time activation codes with expiration
- Password hashing (bcrypt)
- CORS protection
- Input validation and sanitization
- SQL injection protection (Eloquent ORM)
- XSS protection (React auto-escaping)

## Tech Stack Details

**Backend:**
- Laravel 12.36.1
- Laravel Sanctum 4.2
- MySQL 8.0
- PHP 8.2

**Frontend:**
- React 19.2
- Vite 7
- React Router 7
- Axios
- Tailwind CSS 4

**Extension:**
- Manifest V3
- Chrome Extension APIs
- Service Workers

## Development

### Running Backend Tests
```bash
cd backend
php artisan test
```

### Building Frontend for Production
```bash
cd frontend
npm run build
```

### Packaging Extension
```bash
cd extension
# Extension is already in distributable format
# Just zip the directory for distribution
zip -r youtube-monitor-extension.zip .
```

## Environment Variables

### Backend (.env)
```env
APP_NAME="YouTube Monitor"
APP_URL=http://localhost:8000
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=youtube_monitor
DB_USERNAME=youtube_monitor
DB_PASSWORD=youtube_monitor_pass
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000/api
```

## Troubleshooting

### Database Connection Issues
- Ensure MySQL is running: `sudo service mysql status`
- Verify credentials in `backend/.env`
- Check database exists: `mysql -u youtube_monitor -p -e "SHOW DATABASES;"`

### CORS Errors
- Ensure frontend URL is in `backend/config/cors.php`
- Check browser console for specific errors
- Verify API URL in `frontend/.env`

### Extension Not Tracking
- Check if device is activated (click extension icon)
- Verify YouTube is loaded
- Check browser console for errors
- Ensure backend API is running

## Features

- ✅ User registration and authentication
- ✅ Device activation with temporary codes
- ✅ Real-time YouTube watch tracking
- ✅ Dashboard with statistics
- ✅ Device management
- ✅ Watch history with search and filtering
- ✅ Multi-device support per user
- ✅ Automatic heartbeat monitoring
- ✅ Responsive design
- ✅ RESTful API

## License

Proprietary - All rights reserved

## Support

For issues or questions, please contact the development team.
