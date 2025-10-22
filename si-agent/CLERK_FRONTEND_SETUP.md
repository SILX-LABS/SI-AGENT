# Clerk Frontend Integration Guide

## 🚀 Overview
This guide shows how to integrate Clerk authentication with your Next.js frontend to work with the SI-AGENT backend.

## 📦 Installation

### 1. Install Clerk Next.js Package
```bash
npm install @clerk/nextjs
```

### 2. Environment Variables
Create/update `.env.local` in your Next.js project:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

## 🔧 Setup Instructions

### 1. Wrap Your App with ClerkProvider
Update `app/layout.tsx`:
```tsx
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

### 2. Create Authentication Pages

#### Sign In Page (`app/sign-in/[[...sign-in]]/page.tsx`)
```tsx
import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignIn />
    </div>
  )
}
```

#### Sign Up Page (`app/sign-up/[[...sign-up]]/page.tsx`)
```tsx
import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignUp />
    </div>
  )
}
```

### 3. Create Protected Routes
Create middleware (`middleware.ts` in root):
```tsx
import { authMiddleware } from '@clerk/nextjs'

export default authMiddleware({
  // Routes that can be accessed while signed out
  publicRoutes: ["/", "/sign-in", "/sign-up"],
  // Routes that can always be accessed, and have
  // no authentication information
  ignoredRoutes: ["/no-auth-in-this-route"],
})

export const config = {
  // Protects all routes, including api/trpc.
  // See https://clerk.com/docs/references/nextjs/auth-middleware
  // for more information about configuring your Middleware
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}
```

### 4. Create API Client with Authentication
Create `lib/api.ts`:
```tsx
import { useAuth } from '@clerk/nextjs'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const useApiClient = () => {
  const { getToken } = useAuth()

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = await getToken()
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`)
    }

    return response.json()
  }

  return { apiCall }
}
```

### 5. Create User Profile Component
Create `components/UserProfile.tsx`:
```tsx
import { UserButton, useUser } from '@clerk/nextjs'

export default function UserProfile() {
  const { user, isLoaded } = useUser()

  if (!isLoaded) return <div>Loading...</div>

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm">
        <p className="font-medium">{user?.firstName} {user?.lastName}</p>
        <p className="text-gray-500">{user?.emailAddresses[0]?.emailAddress}</p>
      </div>
      <UserButton afterSignOutUrl="/" />
    </div>
  )
}
```

### 6. Create Dashboard Page
Create `app/dashboard/page.tsx`:
```tsx
'use client'

import { useUser } from '@clerk/nextjs'
import { useApiClient } from '@/lib/api'
import { useEffect, useState } from 'react'
import UserProfile from '@/components/UserProfile'

export default function Dashboard() {
  const { user, isLoaded } = useUser()
  const { apiCall } = useApiClient()
  const [userApis, setUserApis] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoaded && user) {
      // Sync user to backend database
      syncUser()
      // Load user's APIs
      loadUserApis()
    }
  }, [isLoaded, user])

  const syncUser = async () => {
    try {
      await apiCall('/api/auth/sync-user', { method: 'POST' })
    } catch (error) {
      console.error('Failed to sync user:', error)
    }
  }

  const loadUserApis = async () => {
    try {
      const response = await apiCall('/api/generated-apis')
      setUserApis(response.data || [])
    } catch (error) {
      console.error('Failed to load APIs:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded || loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              SI-AGENT Dashboard
            </h1>
            <UserProfile />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <h2 className="text-xl font-semibold mb-4">Your Generated APIs</h2>
            {userApis.length === 0 ? (
              <p className="text-gray-500">No APIs generated yet. Create your first API!</p>
            ) : (
              <div className="grid gap-4">
                {userApis.map((api: any) => (
                  <div key={api.id} className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-medium">{api.name}</h3>
                    <p className="text-gray-600">{api.description}</p>
                    <div className="mt-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        api.status === 'DEPLOYED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {api.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
```

### 7. Update Main Page
Update `app/page.tsx`:
```tsx
'use client'

import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard')
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to SI-AGENT
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Transform your ideas into working APIs with the power of AI. 
            Simply describe what you want, and we'll generate it for you.
          </p>
          
          {!isSignedIn && (
            <div className="space-x-4">
              <a
                href="/sign-up"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Get Started
              </a>
              <a
                href="/sign-in"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold border border-blue-600 hover:bg-blue-50 transition-colors"
              >
                Sign In
              </a>
            </div>
          )}
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-3">🤖 AI-Powered</h3>
            <p className="text-gray-600">
              Describe your API in natural language and let AI generate the complete implementation.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-3">⚡ Instant Deploy</h3>
            <p className="text-gray-600">
              Generated APIs are immediately deployable and ready for production use.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-3">📊 Full Analytics</h3>
            <p className="text-gray-600">
              Monitor your APIs with comprehensive analytics and performance metrics.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

## 🔧 Environment Setup

### Next.js Environment Variables
Add to `.env.local`:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

## 🚀 Running the Application

1. **Start the backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend**:
   ```bash
   cd si-agent
   npm run dev
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## 🔐 Authentication Flow

1. User visits the app
2. If not authenticated, redirected to sign-in
3. After sign-in, user is redirected to dashboard
4. Frontend automatically syncs user data to backend
5. All API calls include Clerk session token
6. Backend verifies token with Clerk and attaches user info

## 📝 Next Steps

1. Install dependencies: `npm install @clerk/nextjs`
2. Set up environment variables
3. Configure Clerk dashboard with your domain
4. Test the authentication flow
5. Start building your API generation features!

## 🐛 Troubleshooting

- **Redirect loops**: Check your middleware configuration
- **API calls failing**: Verify backend is running and CORS is configured
- **User not syncing**: Check webhook configuration in Clerk dashboard
- **Styling issues**: Make sure Tailwind CSS is properly configured
