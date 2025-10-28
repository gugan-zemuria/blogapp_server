# Posts API Server

A RESTful API server for posts management with Supabase integration, authentication, and comprehensive testing.

## Features

- **RESTful API** for posts management (CRUD operations)
- **Supabase Integration** for database operations
- **Authentication System** with JWT and Google OAuth
- **Security** with Helmet.js and CORS protection
- **Input Validation** using Zod schemas
- **Session Management** with Express sessions
- **Comprehensive Testing** with Jest and Supertest
- **Password Hashing** with bcrypt

## Tech Stack

- **Runtime**: Node.js (>=16.0.0)
- **Framework**: Express.js
- **Database**: Supabase
- **Authentication**: JWT, Passport.js, Google OAuth 2.0
- **Validation**: Zod
- **Security**: Helmet.js, CORS, bcrypt
- **Testing**: Jest, Supertest
- **Development**: Nodemon

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- Supabase account and project
- Google OAuth credentials (for social login)

## Installation

1. Clone the repository and navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables by creating a `.env` file:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
FRONTEND_ORIGIN=http://localhost:5173
```

## Usage

### Development Mode
```bash
npm run devStart
```
This starts the server with nodemon for automatic restarts on file changes.

### Production Mode
```bash
npm start
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run custom test runner
npm run test:run
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login with email/password
- `GET /auth/google` - Initiate Google OAuth login
- `GET /auth/google/callback` - Google OAuth callback
- `POST /auth/logout` - Logout user

### Posts Management
- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get a specific post
- `POST /api/posts` - Create a new post (authenticated)
- `PUT /api/posts/:id` - Update a post (authenticated)
- `DELETE /api/posts/:id` - Delete a post (authenticated)

## Project Structure

```
server/
├── index.js          # Application entry point
├── server.js         # Express server configuration
├── test-runner.js    # Custom test runner
├── posts.json        # Sample posts data
├── jest.config.js    # Jest configuration
├── render.yaml       # Deployment configuration
├── tests/            # Test files
├── coverage/         # Test coverage reports
└── package.json      # Dependencies and scripts
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 3000) | No |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_KEY` | Supabase anon key | Yes |
| `JWT_SECRET` | Secret for JWT token signing | Yes |
| `SESSION_SECRET` | Secret for session management | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes |
| `GOOGLE_CALLBACK_URL` | Google OAuth callback URL | Yes |
| `FRONTEND_ORIGIN` | Frontend URL for CORS | Yes |

## Security Features

- **Helmet.js**: Sets various HTTP headers for security
- **CORS**: Configured for specific frontend origin
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: Zod schemas for request validation
- **Session Management**: Secure session handling

## Deployment

The server includes a `render.yaml` configuration file for deployment on Render.com or similar platforms.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

ISC License