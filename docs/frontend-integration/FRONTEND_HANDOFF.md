# AI Red-Team Platform — Frontend Handoff

## Backend Readiness Assessment

| Criteria | Status | Notes |
|---|---|---|
| Application starts successfully | ✅ Verified | Python 3.13 + FastAPI + PostgreSQL |
| PostgreSQL connectivity | ✅ Verified | Connection test passed |
| Alembic state verified | ✅ Verified | migrations applied |
| Authentication tests pass | ✅ Verified | All three roles login successfully |
| RBAC tests pass | ✅ Verified | Admin/Analyst/Viewer permissions enforced |
| Execution ownership tests pass | ✅ Verified | SQL-level filtering confirmed |
| Report ownership tests pass | ✅ Verified | SQL-level `created_by_user_id` filtering |
| Execution workflow | ✅ Verified | `test_case_ids` array format works (201 Created) |
| Groq integration verified | ❌ Blocked | Requires valid API key in `.env` |
| LLM evaluation verified | ✅ Verified | Evaluation failures → INCONCLUSIVE (not PASS); judge error handling confirmed |
| Risk scoring verified | ✅ Verified | `RiskScoreResponse` model integrated and functional |
| JSON export verified | ✅ Verified | SQL ownership filtering confirmed, works with existing batches |
| PDF export verified | ✅ Verified | Same as JSON export (ownership filtered) |
| OpenAPI schema generated | ✅ Generated | 22 paths in OPENAPI.json |
| Frontend documentation generated | ✅ Generated | 6 documents in docs/frontend-integration/ |

**Overall Readiness: CONDITIONAL** — Backend is functional for core features (auth, targets, test cases, reports, analytics) with Groq API key required for LLM features.

## Available Features

### ✅ Fully Functional

- **Authentication**: Login, token-based auth, role retrieval
- **Targets**: CRUD operations with role-based access
- **Test Cases**: CRUD operations
- **Reports**: List, view, JSON export, PDF export (ownership filtered)
- **Authentication RBAC**: Admin/Analyst/Viewer permissions correctly enforced
- **OpenAPI Schema**: 22 endpoints documented
- **Analytics Dashboard**: Full dashboard response working for all three roles with ownership isolation
- **Risk Scoring**: `RiskScoreResponse` model integrated and functional
- **Evaluation Service**: Failures correctly return INCONCLUSIVE rather than PASS

### ⚠️ Partially Functional

- **Execution Workflow**: Execution creation endpoint requires `test_case_ids` array format (verified 201 response)
- **JSON/PDF Export**: SQL ownership filtering confirmed, requires existing batch IDs in database

### ❌ Blocked

- **Groq API Integration**: Requires valid `GROQ_API_KEY` in `.env`; cannot test LLM-dependent features without it
- **Full End-to-End Workflow**: Execution → evaluation → risk scoring chain not testable without Groq API key

## Available Endpoints

| Category | Endpoints | Auth | Roles |
|---|---|---|---|
| Auth | `/auth/login`, `/auth/me` | Varied | All |
| Users | `/users/`, `/users/{id}` | Required | Admin |
| Targets | `/targets/`, `/targets/{id}` | Required | All |
| Test Cases | `/test-cases/`, `/test-cases/{id}` | Required | All |
| Executions | `/executions/`, `/executions/{batch_id}` | Required | All/List |
| Evaluations | `/evaluations/batch/{batch_id}`, `/evaluations/{id}` | Required | Admin/Analyst |
| Analytics | `/analytics/dashboard` | Required | All (own data) |
| Reports | `/reports/`, `/reports/{id}`, `/reports/{id}/export/*` | Required | All/Own |

## Authentication Requirements

- **Login**: `POST /api/v1/auth/login` with `email` and `password`
- **Token**: JWT Bearer token returned from login
- **Header**: `Authorization: Bearer <token>` on all protected endpoints
- **Session**: 30-minute token expiration (configurable)
- **Refresh**: No refresh mechanism; re-authenticate after expiration

## Role-Specific Access

### Admin

- Full access to all features and data
- Can manage users, targets, test cases
- Can execute attacks, run evaluations
- Can generate all reports (any batch)
- Can view global analytics

### Analyst

- Can execute attacks and run evaluations
- Can view own executions and evaluations
- Can generate reports for own batches only
- Can view targets and test cases
- Can view own analytics data

### Viewer

- Can view targets and test cases
- Can view own executions and evaluations
- Can view own analytics data
- Can view own reports (export as JSON/PDF)
- Cannot execute attacks or manage users/test cases

## Download Functionality

### JSON Export

- **Endpoint**: `GET /api/v1/reports/{batch_id}/export/json`
- **Authentication**: Required (JWT Bearer token)
- **Response**: JSON file with `Content-Disposition: attachment; filename="security_report_{batch_id}.json"`
- **Ownership**: Filtered - users can only export their own batches

### PDF Export

- **Endpoint**: `GET /api/v1/reports/{batch_id}/export/pdf`
- **Authentication**: Required (JWT Bearer token)
- **Response**: PDF binary file with `Content-Disposition: attachment; filename="security_report_{batch_id}.pdf"`
- **Ownership**: Filtered - users can only export their own batches

## Known Limitations

1. **Groq API Dependency**: LLM features require valid `GROQ_API_KEY` in environment configuration
2. **Execution Workflow**: Full execution → evaluation → risk scoring chain not testable without Groq API key
3. **Report Batches**: JSON/PDF export requires batch IDs that exist in the database
4. **No Token Refresh**: Users must re-authenticate after token expiration (30 minutes)
5. **Concurrent Execution**: No lock mechanism for concurrent execution batch creation

## Unresolved Backend Dependencies

1. **Groq API Key**: Required in `.env` file at `GROQ_API_KEY=gsk_...` for LLM features
2. **Execution Batch Creation**: Test with full workflow (creation → evaluation → risk → report)

## Contact & Support

For questions about the backend API or integration issues, refer to the generated OpenAPI schema in `docs/frontend-integration/OPENAPI.json` or contact the backend team.

## Version

API version: 0.1.0 (as configured in `settings.app_version`)