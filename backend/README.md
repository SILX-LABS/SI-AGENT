# SI-AGENT Backend

## 🚀 Overview
This is the backend service for SI-AGENT, an AI Text-to-API generation platform. The backend handles API generation logic, user management, and runtime execution of generated APIs.

## 🛠 Tech Stack
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **Validation**: Joi
- **Logging**: Winston
- **Testing**: Jest

## 📁 Project Structure
```
backend/
├── src/
│   ├── controllers/     # Request handlers and business logic
│   ├── services/        # Core business logic and external integrations
│   ├── models/          # Database models and schemas
│   ├── routes/          # API route definitions
│   ├── middlewares/     # Custom middleware functions
│   ├── utils/           # Helper functions and utilities
│   ├── config/          # Configuration files
│   ├── database/        # Database setup, migrations, and seeders
│   ├── types/           # TypeScript type definitions
│   └── server.ts        # Application entry point
├── tests/               # Test files
├── prisma/              # Database schema and migrations
└── dist/                # Compiled JavaScript (generated)
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)
- npm or yarn

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Set up database:
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## 🔧 Environment Variables
Create a `.env` file with the following variables:
- `DATABASE_URL`: PostgreSQL connection string
- `CLERK_SECRET_KEY`: Clerk secret key for backend authentication
- `CLERK_PUBLISHABLE_KEY`: Clerk publishable key
- `CLERK_WEBHOOK_SECRET`: Clerk webhook secret for secure webhook handling
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `OPENAI_API_KEY`: OpenAI API key for AI processing

### Clerk Setup
1. Create a Clerk account at https://clerk.com
2. Create a new application in your Clerk dashboard
3. Copy the API keys from your Clerk dashboard to your `.env` file
4. Configure webhooks in Clerk dashboard to point to your backend `/api/auth/webhook` endpoint
5. Set up allowed redirect URLs for your frontend application

## 📝 API Documentation
Once running, API documentation will be available at:
- Development: http://localhost:3001/api/docs
- Swagger UI for interactive testing

## 🧪 Testing
```bash
npm run test          # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

## 🚀 Deployment
```bash
npm run build    # Build for production
npm start        # Start production server
```

## 📋 Development Guidelines
1. Follow TypeScript strict mode
2. Use Prisma for all database operations
3. Implement proper error handling
4. Add tests for new features
5. Use Winston for logging
6. Follow RESTful API conventions
