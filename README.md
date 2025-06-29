# Astrology Profile Backend

A TypeScript/Express.js backend service for managing user authentication and astrological profiles with support for both Vedic and Western astrology systems.

## Features

### 🔐 Authentication
- **Email/Password Authentication** with email verification
- **Google OAuth Integration** via Supabase
- **Cross-method Account Linking** - seamless integration between OAuth and email/password
- **JWT Token Management** with refresh token support
- **Smart Error Handling** - detects existing accounts and guides users appropriately

### ⭐ Astrology System
- **Vedic Astrology Calculations** - Rasi, Nakshatra, Lagna computation
- **Western Zodiac Support** - Traditional zodiac sign determination
- **Birth Chart Generation** - Based on date, time, and location
- **Geocoding Integration** - Automatic coordinate resolution for birth places
- **Profile Management** - Multiple profiles per user with account membership system

### 🏗️ Architecture
- **TypeScript** with strict type checking
- **Express.js** with comprehensive middleware
- **Supabase** for authentication and database
- **Row Level Security (RLS)** for data protection
- **Comprehensive Error Handling** with detailed logging
- **Rate Limiting** and security middleware

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- PostgreSQL database

### 1. Installation

```bash
# Clone and install dependencies
git clone <repository-url>
cd project
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3000

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration (optional - Supabase handles this)
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret
```

### 3. Database Setup

Run the database schema in your Supabase SQL editor:

```bash
# Copy the SQL content from src/database/schema.sql
# and execute it in your Supabase dashboard
```

### 4. Development

```bash
# Start development server
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Start production server
npm run start:prod
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Email/password registration |
| POST | `/api/auth/signin` | Email/password login |
| POST | `/api/auth/google` | Initiate Google OAuth |
| GET | `/api/auth/google/callback` | Handle OAuth callback |
| GET/POST | `/api/auth/verify-email` | Email verification |
| POST | `/api/auth/signout` | User logout |
| POST | `/api/auth/reset-password` | Password reset |
| POST | `/api/auth/refresh-token` | Token refresh |

### Profiles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profiles` | Get user's profiles |
| GET | `/api/profiles/primary` | Get primary profile |
| GET | `/api/profiles/:id` | Get specific profile |
| POST | `/api/profiles` | Create new profile |
| PUT | `/api/profiles/:id` | Update profile |

### Account Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profiles/settings` | Get account settings |
| PUT | `/api/profiles/settings` | Update account settings |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Service health status |

## Database Schema

### Core Tables

- **profiles** - User profile information with astrological data
- **accounts** - Account groupings for profile management
- **account_membership** - Links profiles to accounts with roles
- **account_settings** - Account-level configuration including astrology system preference (WESTERN/VEDIC)
- **chat** - Chat message history (for future features)

### Key Features

- **Row Level Security (RLS)** enforced on all tables
- **Automatic timestamps** with triggers
- **Data validation** with custom PostgreSQL functions
- **Constraint naming conventions** for maintainability

## Authentication Flow Examples

### Email Signup with Existing Google Account

```bash
curl -X POST http://localhost:3000/api/auth/signup \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@gmail.com",
    "password": "password123",
    "full_name": "John Doe"
  }'

# Response: 409 Conflict
{
  "success": false,
  "error": {
    "code": "EMAIL_REGISTERED_WITH_OAUTH",
    "message": "This email is already registered with Google. Please sign in with Google instead.",
    "provider": "google",
    "suggestedAction": "Use the 'Sign in with Google' option to access your account"
  }
}
```

### Google OAuth with Existing Email Account

```bash
curl -X POST http://localhost:3000/api/auth/google

# Response: OAuth URL for authentication
{
  "success": true,
  "data": {
    "url": "https://accounts.google.com/oauth/authorize?...",
    "message": "Google OAuth URL generated successfully"
  }
}

# After OAuth callback:
{
  "success": true,
  "data": {
    "user": {...},
    "session": {...},
    "message": "Welcome back! Your Google account has been linked to your existing account.",
    "isNewUser": false,
    "linkedExistingAccount": true,
    "actionType": "signed in",
    "provider": "google"
  }
}
```

### Profile Creation with Astrology

```bash
curl -X POST http://localhost:3000/api/profiles \\
  -H "Authorization: Bearer your_access_token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "firstname": "Vishal",
    "lastname": "K",
    "gender": "MALE",
    "date_of_birth": "2004-08-02",
    "time_of_birth": "08:30",
    "place_of_birth": "Coimbatore, India",
    "calculate_astrology": true,
    "language": "ENGLISH",
    "astrology_system": "VEDIC",
    "set_as_primary": true
  }'

# Response: Profile with calculated astrology
{
  "success": true,
  "data": {
    "profile": {
      "profile_id": 1,
      "firstname": "Vishal",
      "lastname": "K",
      "gender": "MALE",
      "vedic_rasi": "Simha",
      "vedic_nakshatra": "Magha",
      "vedic_lagna": "Kanya",
      "western_zodiac": "Leo"
    },
    "account": {
      "account_id": 1,
      "account_name": "Vishal K",
      "is_primary": true
    }
  }
}
```

## Development

### Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route handlers
├── database/        # Database schema and migrations
├── middleware/      # Express middleware
├── models/          # TypeScript interfaces and types
├── routes/          # API route definitions
├── services/        # Business logic layer
├── templates/       # HTML templates for auth flows
└── utils/           # Utility functions and helpers
```

### Key Design Patterns

- **Service Layer Architecture** - Controllers delegate to services
- **Consistent Error Handling** - Standardized error responses
- **Type Safety** - Comprehensive TypeScript interfaces
- **Middleware Chain** - Security, validation, authentication
- **Response Formatting** - Uniform API response structure

### Security Features

- **Helmet.js** - Security headers
- **CORS** configuration
- **Rate limiting** - API protection
- **Input validation** - Joi schema validation
- **SQL injection protection** - Parameterized queries via Supabase
- **Authentication middleware** - JWT token verification

## Deployment

### Environment Variables

Ensure all required environment variables are set:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `FRONTEND_URL` - Frontend application URL
- `NODE_ENV` - production/development
- `PORT` - Server port (default: 3000)

### Build Process

```bash
# Clean previous builds
npm run clean

# Type check
npm run type-check

# Build TypeScript to JavaScript
npm run build

# Start production server
npm run start
```

### Health Monitoring

The `/api/health` endpoint provides service status:

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "uptime": 3600,
    "version": "1.0.0"
  }
}
```

## Contributing

1. Follow TypeScript strict mode
2. Use conventional commit messages
3. Add comprehensive error handling
4. Include input validation
5. Write type-safe interfaces
6. Test authentication flows
7. Verify astrology calculations

## License

MIT License - see LICENSE file for details.