# AI Red-Team Platform API Reference

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

All endpoints except `/api/v1/auth/login` require JWT Bearer token authentication.

### Login

```
POST /api/v1/auth/login
```

**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "access_token": "string",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### Current User

```
GET /api/v1/auth/me
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "role": "admin",
  "is_active": true,
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-01T00:00:00Z"
}
```

### Token Expiration

Tokens expire after 30 minutes (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`). Expired tokens return 401 Unauthorized.

## Role Permissions

| Operation | Admin | Analyst | Viewer |
|---|---|---|---|
| View dashboard | Global | Own data | Own data |
| Manage users | Yes | No | No |
| Create targets | Yes | Yes | No |
| View targets | Yes | Yes | Yes |
| Manage test cases | Yes | Yes | No |
| Execute tests | Yes | Yes | No |
| View executions | All | Own | Own |
| Run evaluations | Yes | Yes | No |
| View evaluations | All | Own | Own |
| Generate reports | All | Own | Own |
| JSON export | All | Own | Own |
| PDF export | All | Own | Own |

## Endpoint Inventory

### Authentication

| Endpoint | Method | Auth | Roles | Description |
|---|---|---|---|---|
| `/api/v1/auth/login` | POST | Optional | All | Authenticate user and issue JWT |
| `/api/v1/auth/me` | GET | Required | All | Get current user profile |

### Users

| Endpoint | Method | Auth | Roles | Description |
|---|---|---|---|---|
| `/api/v1/users/` | GET | Required | Admin | List all users |
| `/api/v1/users/` | POST | Required | Admin | Create user |
| `/api/v1/users/{user_id}` | GET | Required | Admin | Get user |
| `/api/v1/users/{user_id}/role` | PATCH | Required | Admin | Update user role |
| `/api/v1/users/{user_id}/status` | PATCH | Required | Admin | Update user status |

### Targets

| Endpoint | Method | Auth | Roles | Description |
|---|---|---|---|---|
| `/api/v1/targets/` | GET | Required | All | List targets |
| `/api/v1/targets/` | POST | Required | Admin/Analyst | Create target |
| `/api/v1/targets/{target_id}` | GET | Required | All | Get target |
| `/api/v1/targets/{target_id}` | PATCH | Required | Admin/Analyst | Update target |
| `/api/v1/targets/{target_id}` | DELETE | Required | Admin | Delete target |

### Test Cases

| Endpoint | Method | Auth | Roles | Description |
|---|---|---|---|---|
| `/api/v1/test-cases/` | GET | Required | All | List test cases |
| `/api/v1/test-cases/` | POST | Required | Admin/Analyst | Create test case |
| `/api/v1/test-cases/{test_case_id}` | GET | Required | All | Get test case |
| `/api/v1/test-cases/{test_case_id}` | PATCH | Required | Admin/Analyst | Update test case |
| `/api/v1/test-cases/{test_case_id}` | DELETE | Required | Admin | Delete test case |

### Executions

| Endpoint | Method | Auth | Roles | Description |
|---|---|---|---|---|
| `/api/v1/executions/` | GET | Required | All/List | List executions *(405 if no filters)* |
| `/api/v1/executions/` | POST | Required | Admin/Analyst | Execute attack batch |
| `/api/v1/executions/{batch_id}` | GET | Required | All | Get execution batch |

### Evaluations

| Endpoint | Method | Auth | Roles | Description |
|---|---|---|---|---|
| `/api/v1/evaluations/batch/{batch_id}` | POST | Required | Admin/Analyst | Evaluate batch |
| `/api/v1/evaluations/{execution_result_id}` | GET | Required | All | Get evaluation |
| `/api/v1/evaluations/{execution_result_id}` | POST | Required | Admin/Analyst | Evaluate execution |

### Analytics

| Endpoint | Method | Auth | Roles | Description |
|---|---|---|---|---|
| `/api/v1/analytics/dashboard` | GET | Required | All (own data) | Get dashboard analytics. Ownership filtering applies - admins see all data, analysts/viewers see only their own executions/evaluations. **Note**: Response model fixed - `AnalyticsDashboardResponse` now properly constructed from service data. |

### Reports

| Endpoint | Method | Auth | Roles | Description |
|---|---|---|---|---|
| `/api/v1/reports/` | GET | Required | All/List | List reports |
| `/api/v1/reports/{batch_id}` | GET | Required | All | Get security report |
| `/api/v1/reports/{batch_id}/export/json` | GET | Required | All | Export report as JSON |
| `/api/v1/reports/{batch_id}/export/pdf` | GET | Required | All | Export report as PDF |

## Request/Response Examples

### Create Target

**Request:**
```json
{
  "name": "Groq GPT OSS 120B",
  "provider": "openai",
  "model_id": "openai/gpt-oss-120b",
  "description": "Red team testing model"
}
```

**Response (201):**
```json
{
  "id": 1,
  "name": "Groq GPT OSS 120B",
  "provider": "openai",
  "model_id": "openai/gpt-oss-120B",
  "is_active": true,
  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-01-15T10:00:00Z"
}
```

### Execute Attack Batch

**Request:**
```json
{
  "target_id": 1,
  "test_case_ids": [1, 2, 3]
}
```

**Response (201):**
```json
{
  "id": 1,
  "batch_id": "batch-1234567890",
  "target_id": 1,
  "status": "running",
  "created_by_user_id": 1,
  "executed_at": "2026-01-15T10:00:00Z"
}
```

### Export Report as JSON

**Request:**
```
GET /api/v1/reports/{batch_id}/export/json
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "batch_id": "batch-1234567890",
  "generated_at": "2026-01-15T10:00:00Z",
  "target_id": 1,
  "target_name": "Groq GPT OSS 120B",
  "summary": {
    "total_tests": 3,
    "evaluated": 3,
    "unevaluated": 0,
    "passed": 2,
    "failed": 1,
    "inconclusive": 0,
    "evaluation_coverage": 100.0,
    "conclusive_coverage": 66.67
  },
  "risk_assessment": {
    "overall_score": 0.75,
    "risk_classification": "high",
    "severity_distribution": {
      "low": 1,
      "medium": 0,
      "high": 2,
      "critical": 0
    }
  },
  "findings": [...]
}
```

### Export Report as PDF

**Request:**
```
GET /api/v1/reports/{batch_id}/export/pdf
Authorization: Bearer <token>
```

**Response (200):** PDF binary file with `Content-Disposition: attachment; filename="security_report_{batch_id}.pdf"`

## Error Examples

### 401 Unauthorized

```json
{
  "detail": "Invalid or expired authentication token",
  "headers": {"WWW-Authenticate": "Bearer"}
}
```

### 403 Forbidden

```json
{
  "detail": "You do not have permission to perform this action"
}
```

### 404 Not Found

```json
{
  "detail": "Execution batch not found."
}
```

### 422 Validation Error

```json
{
  "detail": [
    {"type": "missing", "loc": ["body", "test_case_ids"], "msg": "Field required", "input": {"target_id": 1}}
  ]
}
```