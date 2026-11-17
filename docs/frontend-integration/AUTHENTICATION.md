# AI Red-Team Platform Authentication

## Login Workflow

1. **Obtain JWT Token**

   ```bash
   POST http://localhost:8000/api/v1/auth/login
   ```
   
   **Request Body:**
   ```json
   {
     "email": "user@example.com",
     "password": "Password123!"
   }
   ```
   
   **Successful Response:**
   ```json
   {
     "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....",
     "token_type": "bearer",
     "expires_in": 1800
   }
   ```

2. **Store Token Securely**

   Store the `access_token` in the frontend's secure storage (e.g., HttpOnly cookie or memory). Do not store in localStorage without additional protection.

3. **Include Token in Requests**

   Include the token in the `Authorization` header of all API requests:
   ```
   Authorization: Bearer <access_token>
   ```

4. **Token Expiration**

   Tokens expire after 30 minutes (configurable). Upon expiration:
   
   - The frontend should detect 401 Unauthorized responses
   - Clear the stored token
   - Redirect to login page
   - Optionally refresh the token (refresh not currently supported; re-authenticate)

## JWT Token Handling

### Token Structure

The JWT token is signed using HS256 algorithm with the secret key from `JWT_SECRET_KEY` configuration. The token payload contains:

- `sub`: Subject (user ID as string)
- `iat`: Issued-at timestamp
- `exp`: Expiration timestamp
- `iat`: Issued-at timestamp

### Token Validation

The backend validates tokens using `fastapi.security.HTTPBearer` with the following checks:

- Token signature verification
- `sub` field presence and validity
- Token expiration (`exp` claim)
- Token issuance time (`iat` claim)
- User existence and `is_active` status

### Invalid Token Responses

- **401 Unauthorized**: "Invalid or expired authentication token"
  - Missing token, expired token, or invalid signature
  - `WWW-Authenticate: Bearer` header included

- **403 Forbidden**: "You do not have permission to perform this action"
  - Token is valid but user lacks required role

## Role-Based Frontend Navigation

The frontend should implement role-based routing based on the user's role obtained from `/api/v1/auth/me`:

### Admin Role

- Full access to all features
- User management interface
- Target and test case management
- Execute attacks and evaluate results
- Generate and export all reports
- View global analytics

### Analyst Role

- Execute attacks and evaluate results
- View own executions and evaluations
- Generate and export own reports
- View targets and test cases
- Limited analytics (own data only)

### Viewer Role

- View targets and test cases
- View own executions and evaluations
- View own analytics
- Cannot execute attacks or manage users/test cases

## Authentication State Management

### Recommended Approach (React Example)

```typescript
const useAuth = () => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth on mount
  useEffect(() => {
    const stored = localStorage.getItem('auth_token');
    if (stored) setToken(stored);
    fetchAuthUser();
  }, []);

  const fetchAuthUser = async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        // Token invalid, clear it
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch('http://localhost:8000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (response.ok) {
      const data = await response.json();
      setToken(data.access_token);
      setUser(data);
      localStorage.setItem('auth_token', data.access_token);
    }
    
    return response.ok;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
  };

  return { token, user, loading, login, logout };
};
```

## Unauthorized Responses

The frontend should handle the following unauthorized scenarios:

1. **401 - Missing/Invalid Token**
   - Show: "Please log in to access this resource"
   - Action: Clear token, redirect to login

2. **401 - Expired Token**
   - Show: "Your session has expired. Please log in again."
   - Action: Clear token, redirect to login

3. **403 - Insufficient Permissions**
   - Show: "You do not have permission to perform this action"
   - Action: Navigate away or show restricted content disabled state

## Session Timeout

User sessions are managed via JWT tokens with a 30-minute expiration. There is no server-side session refresh mechanism. Users must re-authenticate after token expiration.

## Login/Logout UI Flow

1. **Login Page**
   - Email and password fields
   - Login button
   - Error message display for invalid credentials

2. **Main Application**
   - Persistent login state
   - User profile display (optional)
   - Logout button

3. **Session Expiry**
   - Automatic logout after 30 minutes
   - Login re-prompt on next API call