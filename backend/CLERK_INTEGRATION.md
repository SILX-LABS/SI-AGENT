# Clerk Integration Guide

## 🔐 Overview
This backend has been configured to use Clerk for authentication instead of traditional JWT tokens. Clerk provides a complete authentication solution with user management, session handling, and security features.

## 🚀 Key Changes Made

### 1. Dependencies Updated
- **Removed**: `jsonwebtoken`, `bcryptjs`
- **Added**: `@clerk/clerk-sdk-node`, `@clerk/express`

### 2. Authentication Flow
```
Frontend (Clerk) → Session Token → Backend Verification → User Data
```

### 3. File Changes
- `src/middlewares/auth.ts` - Updated to use Clerk session verification
- `src/routes/auth.ts` - New Clerk-specific auth routes
- `src/controllers/ClerkAuthController.ts` - New controller for Clerk operations
- `prisma/schema.prisma` - Updated User model with `clerkId` field
- `.env.example` - Updated with Clerk environment variables

## 🛠 Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Clerk Dashboard Setup
1. Go to https://clerk.com and create an account
2. Create a new application
3. In the dashboard, go to "API Keys" section
4. Copy the following keys:
   - Secret Key (starts with `sk_`)
   - Publishable Key (starts with `pk_`)

### 3. Environment Configuration
Create a `.env` file in the backend directory:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/si_agent_db"

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_your_secret_key_here
CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Other configs...
PORT=3001
NODE_ENV=development
```

### 4. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

### 5. Webhook Configuration
1. In Clerk dashboard, go to "Webhooks"
2. Add endpoint: `http://localhost:3001/api/auth/webhook`
3. Select events: `user.created`, `user.updated`, `user.deleted`, `session.created`, `session.ended`
4. Copy the webhook secret to your `.env` file

## 🔄 How Authentication Works

### Frontend Integration
The frontend should use Clerk's React components:
```jsx
import { ClerkProvider, SignIn, SignUp, UserButton } from '@clerk/nextjs'

// Wrap your app with ClerkProvider
<ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
  <App />
</ClerkProvider>
```

### Backend API Calls
When making API calls from frontend:
```javascript
import { useAuth } from '@clerk/nextjs'

const { getToken } = useAuth()

const response = await fetch('/api/protected-route', {
  headers: {
    'Authorization': `Bearer ${await getToken()}`
  }
})
```

### Protected Routes
Backend routes are protected using the `authenticate` middleware:
```typescript
import { authenticate } from '@/middlewares/auth'

router.get('/protected', authenticate, (req, res) => {
  // req.user contains Clerk user data
  // req.auth contains session info
})
```

## 📋 Available Auth Routes

### User Management
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/sync-user` - Sync user to local database
- `GET /api/auth/session` - Verify current session
- `DELETE /api/auth/session` - Revoke current session

### Metadata Management
- `PUT /api/auth/metadata` - Update user metadata (roles, preferences)
- `GET /api/auth/organizations` - Get user's organizations

### Webhooks
- `POST /api/auth/webhook` - Handle Clerk webhooks

## 🔧 User Data Structure

### Request Object Extensions
```typescript
interface Request {
  user?: {
    id: string;           // Clerk user ID
    email: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
    role: string;         // From public metadata
  };
  auth?: {
    userId: string;       // Clerk user ID
    sessionId: string;    // Clerk session ID
  };
}
```

### Database User Model
```prisma
model User {
  id          String   @id @default(cuid())
  clerkId     String   @unique  // Links to Clerk user
  email       String   @unique
  firstName   String?
  lastName    String?
  imageUrl    String?
  role        String   @default("user")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  lastLoginAt DateTime?
}
```

## 🚨 Important Notes

### Security
- Never expose `CLERK_SECRET_KEY` in frontend code
- Always verify webhook signatures using `CLERK_WEBHOOK_SECRET`
- Use HTTPS in production for webhook endpoints

### User Synchronization
- Users are automatically synced to local database via webhooks
- Manual sync available via `POST /api/auth/sync-user`
- Local database stores additional user metadata

### Role Management
- User roles are stored in Clerk's `publicMetadata`
- Update roles via `PUT /api/auth/metadata` endpoint
- Roles are automatically synced to local database

## 🐛 Troubleshooting

### Common Issues
1. **"Invalid session" errors**: Check if `CLERK_SECRET_KEY` is correct
2. **Webhook not working**: Verify webhook URL and secret
3. **User not found**: Ensure user sync is working properly

### Debug Mode
Enable debug logging:
```env
LOG_LEVEL=debug
```

### Testing Authentication
Use Clerk's test mode for development:
- Test users are automatically created
- No real email verification required
- Use test API keys (starting with `sk_test_` and `pk_test_`)

## 📚 Additional Resources
- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Node.js SDK](https://clerk.com/docs/references/nodejs/overview)
- [Clerk Webhooks](https://clerk.com/docs/integrations/webhooks)
