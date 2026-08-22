# Supabase Integration Setup

✅ **Supabase database connection is now configured!**

## Configuration Details

- **Project URL:** https://czjkckicpfzsogdgcakd.supabase.co
- **Publishable Key:** Configured in `.env.local`

## Created Files

### 1. `.env.local`
Environment variables for Supabase connection (automatically loaded by Vite)

### 2. `src/lib/supabase.js`
Core Supabase client initialization. Use this to access the Supabase instance.

```javascript
import { supabase } from '@/lib/supabase'
```

### 3. `src/lib/api.js`
Pre-built database functions for common operations:
- **Auth:** `signUp()`, `signIn()`, `signOut()`, `getCurrentUser()`
- **Students:** `getStudents()`, `getStudentById()`, `updateStudent()`
- **Recruiters:** `getRecruiters()`, `getRecruiterById()`
- **Drives:** `getDrives()`, `getDriveById()`, `createDrive()`, `updateDrive()`
- **Applications:** `getApplications()`, `getApplicationsByStudentId()`, `createApplication()`, etc.
- **Realtime:** `subscribeToTable()`, `unsubscribeFromTable()`

```javascript
import { getStudents, createApplication } from '@/lib/api'
```

### 4. `src/lib/useAuth.js`
React hook for managing authentication state across your app.

```javascript
import { useAuth } from '@/lib/useAuth'

function MyComponent() {
  const { user, loading, error, signIn, signOut } = useAuth()
  // ... use user authentication
}
```

## Installation Status

✅ `@supabase/supabase-js` package installed

## Running the Application

The dev server is already running at: **http://localhost:5173/**

The server automatically restarted after configuration. You can now:
1. Import and use Supabase functions in your components
2. Build authentication flows
3. Query and manage database data
4. Set up realtime subscriptions

## Next Steps

1. Create database tables in Supabase if not already done
2. Update your React components to use the auth hook and API functions
3. Set up Row Level Security (RLS) policies in Supabase for production
4. Test database connectivity in your components

## Example Usage

```javascript
import { useAuth } from '@/lib/useAuth'
import { getStudents } from '@/lib/api'

export function StudentList() {
  const { user } = useAuth()
  const [students, setStudents] = useState([])

  useEffect(() => {
    if (user) {
      getStudents().then(setStudents)
    }
  }, [user])

  return (
    <div>
      {students.map(student => (
        <div key={student.id}>{student.name}</div>
      ))}
    </div>
  )
}
```
