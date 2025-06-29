# Astrology Chat Backend - Deployment Guide

## Overview

This deployment guide covers setting up the Astrology Chat Backend with integrated Python (Kerykeion) astrology calculations for both Vedic and Western systems.

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.9+ (for local development)
- PostgreSQL database (or Supabase account)
- Google Gemini AI API key

## Architecture

The application uses:
- **Node.js/TypeScript** for the main backend API
- **Python/Kerykeion** for accurate astrology calculations
- **PostgreSQL** for data storage
- **Supabase** for authentication and database hosting
- **Google Gemini AI** for intelligent astrological insights

## Quick Start with Docker

### 1. Clone and Setup

```bash
git clone <repository-url>
cd astrology-chat-backend
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file with your actual values:

```bash
# Database Configuration
DATABASE_URL=your-supabase-postgres-url
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key

# AI Service Configuration
GOOGLE_GEMINI_API_KEY=your-gemini-api-key
```

### 3. Run with Docker Compose

```bash
# Build and start services
docker-compose up -d

# Check logs
docker-compose logs -f astrology-backend

# Stop services
docker-compose down
```

### 4. Database Setup

Run the database migrations:

```bash
# Connect to your PostgreSQL database and run:
psql -h your-host -U your-user -d your-database -f src/database/schema.sql
psql -h your-host -U your-user -d your-database -f src/database/migrations/add_western_astrology_fields.sql
```

## Manual Deployment

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
pip3 install -r requirements.txt
```

### 2. Build Application

```bash
npm run build
```

### 3. Start Application

```bash
# Development
npm run dev

# Production
npm start
```

## Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:port/db` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJ...` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `GOOGLE_GEMINI_API_KEY` | Google Gemini AI API key | `AIza...` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PYTHON_PATH` | Python executable path | `python3` |
| `LOG_LEVEL` | Logging level | `info` |
| `CORS_ORIGIN` | Allowed CORS origins | `*` |
| `RATE_LIMIT_MAX_REQUESTS` | Rate limit per window | `100` |

## Python Dependencies

The application requires these Python packages (installed via `requirements.txt`):

```
kerykeion>=4.26.2
geopy>=2.4.1
timezonefinder>=6.5.9
pytz>=2024.2
```

## API Endpoints

### Health Check
- `GET /api/health` - Service health status

### Authentication
- `POST /api/auth/signin` - User sign in
- `POST /api/auth/signup` - User sign up

### Profiles
- `GET /api/profiles` - Get user profiles
- `POST /api/profiles` - Create new profile
- `PUT /api/profiles/:id` - Update profile
- `DELETE /api/profiles/:id` - Delete profile

### Chat (Unified)
- `POST /api/chat` - Send message (auto-detects system)
- `GET /api/chat/history` - Get chat history
- `GET /api/chat/messages/:id` - Get specific message
- `PUT /api/chat/messages/:id` - Update message
- `DELETE /api/chat/messages/:id` - Delete message

### Legacy System-Specific Endpoints
- `POST /api/vedic-chat` - Force Vedic astrology
- `POST /api/western-chat` - Force Western astrology

## Database Schema

### Key Tables

1. **profiles** - User profile information
   - Basic info: `firstname`, `lastname`, `gender`
   - Birth data: `date_of_birth`, `time_of_birth`, `place_of_birth`
   - Western astrology: `western_sun_sign`, `western_moon_sign`, `western_ascendant`
   - Vedic astrology: `vedic_rasi`, `vedic_nakshatra`, `vedic_lagna`

2. **accounts** - User account management
3. **account_settings** - User preferences and primary profile
4. **chat** - Chat messages and responses

## Astrology Calculation Features

### Vedic Astrology
- **Rasi** (Moon Sign) - Sidereal zodiac position
- **Nakshatra** (Birth Star) - 27 lunar mansions
- **Lagna** (Ascendant) - Rising sign
- **Sun Sign** - Vedic sun position

### Western Astrology  
- **Sun Sign** - Tropical zodiac sun position
- **Moon Sign** - Tropical zodiac moon position
- **Ascendant** - Rising sign in tropical system

### Calculation Engine
- **Primary**: Kerykeion (Python) with Swiss Ephemeris
- **Accuracy**: Professional-grade astronomical calculations
- **Coordinate Systems**: Automatic geocoding and timezone detection
- **Ayanamsa**: Lahiri Ayanamsa for Vedic calculations

## Monitoring and Logging

### Health Checks
```bash
curl http://localhost:3000/api/health
```

### Log Files
- Application logs: `logs/app.log`
- Error logs: `logs/error.log`
- Access logs: `logs/access.log`

### Docker Health Check
The Docker container includes automatic health checks every 30 seconds.

## Security

### Authentication
- Supabase Auth integration
- JWT token validation
- Row Level Security (RLS) policies

### Rate Limiting
- 100 requests per 15-minute window (configurable)
- IP-based rate limiting

### CORS
- Configurable allowed origins
- Secure headers enabled

## Troubleshooting

### Common Issues

1. **Python Import Errors**
   ```bash
   # Check Python path
   which python3
   
   # Install dependencies
   pip3 install -r requirements.txt
   ```

2. **Database Connection Issues**
   ```bash
   # Test database connection
   psql $DATABASE_URL -c "SELECT 1;"
   ```

3. **Kerykeion Calculation Failures**
   ```bash
   # Test Python script directly
   python3 scripts/kerykeion_calculator.py "Test" "2004-08-02" "09:52" "Coimbatore, India" "VEDIC"
   ```

4. **Docker Build Issues**
   ```bash
   # Clear Docker cache
   docker system prune -a
   
   # Rebuild without cache
   docker-compose build --no-cache
   ```

### Debug Mode

Enable debug logging:
```bash
export NODE_ENV=development
export ENABLE_DEBUG_LOGS=true
```

## Performance Optimization

### Caching
- Geocoding results cached per session
- Astrological calculations cached by input hash

### Database
- Indexes on astrology fields
- Optimized queries for profile lookups

### Python Process
- Spawned processes for each calculation
- Error handling with graceful fallbacks

## Scaling Considerations

### Horizontal Scaling
- Stateless application design
- Database connection pooling
- Load balancer compatible

### Python Process Management
- Consider process pooling for high traffic
- Async Python execution for concurrent requests

## Support

For deployment issues or questions:
1. Check logs: `docker-compose logs astrology-backend`
2. Verify environment variables
3. Test Python dependencies: `python3 -c "import kerykeion; print('OK')"`
4. Test database connectivity
5. Validate API key configurations

## Version Information

- Node.js: 18+
- Python: 3.9+
- Kerykeion: 4.26.2+
- PostgreSQL: 13+
- Docker: 20.10+