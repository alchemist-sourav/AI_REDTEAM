# AI_REDTEAM

**AI Safety, LLM Security Assessment & Automated Red-Team Testing Platform**

AI_REDTEAM is a security assessment platform designed to evaluate the safety, robustness, and security of Large Language Model (LLM) applications through automated adversarial testing. As organizations increasingly integrate LLMs into production systems, protecting these systems against prompt injection, sensitive information disclosure, and other AI-specific vulnerabilities becomes essential.

AI_REDTEAM provides a centralized environment where developers and security researchers can configure AI targets, execute adversarial test cases, evaluate model responses, calculate security risk, and generate structured assessment reports.

> **Project Status:** Active Development — Backend MVP implemented with security hardening and data isolation verification complete. Frontend dashboard in development.

---

## Project Overview

### The Problem

Large Language Models introduce novel attack surfaces that traditional application security tools do not address:

- **Prompt Injection** — Malicious inputs that override system instructions
- **Sensitive Information Disclosure** — Models revealing training data, PII, or system prompts
- **Jailbreaking** — Techniques to bypass safety guardrails
- **Hallucination Exploitation** — Inducing confident but incorrect outputs
- **Supply Chain Attacks** — Compromised model weights or fine-tuning data

### The Solution

AI_REDTEAM automates the red-teaming workflow:

1. **Configure Targets** — Register LLM providers and models (Groq, OpenAI-compatible APIs)
2. **Define Attack Cases** — Create reusable adversarial test cases categorized by attack type and severity
3. **Execute Batches** — Send test prompts to target models and capture responses
4. **Evaluate Responses** — Analyze outputs using deterministic checks and LLM-as-a-Judge evaluation
5. **Score Risk** — Calculate risk classifications (low/medium/high/critical) with severity distributions
6. **Generate Reports** — Export structured JSON and PDF security assessment reports
7. **Monitor Analytics** — Track testing coverage, risk trends, and target performance over time

### Workflow Architecture

```mermaid
flowchart TD
    A[User Authentication] --> B[Target Management]
    B --> C[Attack Test Case Library]
    C --> D[Execution Engine]
    D --> E[Target LLM Provider]
    E --> F[Model Response Capture]
    F --> G[Evaluation Engine]
    G --> H[LLM-as-a-Judge]
    H --> I[Risk Scoring]
    I --> J[Reports & Analytics]
    
    style A fill:#e1f5fe
    style D fill:#fff3e0
    style G fill:#f3e5f5
    style J fill:#e8f5e9
```

---

## Key Features

### Implemented Features

| Feature | Status | Description |
|---------|--------|-------------|
| **FastAPI Backend Foundation** | ✅ Complete | Async REST API with OpenAPI documentation |
| **PostgreSQL Integration** | ✅ Complete | Async SQLAlchemy 2.x with Alembic migrations |
| **JWT Authentication** | ✅ Complete | HS256 signed tokens with 30-min expiry |
| **Argon2 Password Hashing** | ✅ Complete | Via `pwdlib` with recommended parameters |
| **Role-Based Access Control** | ✅ Complete | Admin / Analyst / Viewer roles |
| **User Management** | ✅ Complete | CRUD with admin-only permissions |
| **Target Management** | ✅ Complete | LLM provider/model configuration |
| **Attack Test Case Library** | ✅ Complete | Categorized by attack type and severity |
| **Groq API Integration** | ✅ Complete | LLM provider service with error handling |
| **Automated Execution Engine** | ✅ Complete | Batch execution with ownership tracking |
| **Execution Ownership** | ✅ Complete | SQL-level `created_by_user_id` filtering |
| **LLM-as-a-Judge Evaluation** | ✅ Complete | AI-assisted security evaluation |
| **Evaluation Ownership** | ✅ Complete | Access isolation via execution ownership |
| **Risk Scoring** | ✅ Complete | Overall score, classification, severity distribution |
| **JSON Report Export** | ✅ Complete | Structured export with ownership filtering |
| **PDF Report Export** | ✅ Complete | Binary PDF with `Content-Disposition` |
| **Dashboard Analytics API** | ✅ Complete | Overview, category breakdown, target performance, risk trends |

### In Progress / Planned

| Feature | Status | Notes |
|---------|--------|-------|
| Report Ownership Enforcement | 🔄 Partial | SQL filtering implemented, API refinement needed |
| Analytics Data Isolation | 🔄 Partial | Ownership filtering active, edge cases under review |
| Frontend Dashboard | 🔄 In Progress | Next.js 16 App Router with React 19 |
| Additional LLM Providers | 📋 Planned | OpenAI, Anthropic, local models |
| Advanced Attack Strategies | 📋 Planned | Multi-turn, encoding, role-play attacks |
| Audit Trail Logging | 📋 Planned | Comprehensive operation logging |
| Deployment Automation | 📋 Planned | Docker, CI/CD pipelines |

---

## Application Architecture

### High-Level Architecture

```mermaid
architecture-beta
    group frontend[Frontend - Next.js 16]
    group backend[Backend - FastAPI]
    group database[Database - PostgreSQL]
    group llm[LLM Provider - Groq]

    service fe_app[Next.js App Router] in frontend
    service fe_auth[Auth Context] in frontend
    service fe_api[API Client] in frontend

    service be_main[FastAPI App] in backend
    service be_auth[Auth Router] in backend
    service be_targets[Targets Router] in backend
    service be_exec[Executions Router] in backend
    service be_eval[Evaluations Router] in backend
    service be_reports[Reports Router] in backend
    service be_analytics[Analytics Router] in backend
    service be_services[Services Layer] in backend

    service db[(PostgreSQL)] in database
    service migrations[Alembic Migrations] in database

    service groq[Groq API] in llm
    service judge[LLM Judge] in llm

    fe_app:B --> L:fe_auth
    fe_app:B --> R:fe_api
    fe_api:T --> B:be_main
    be_auth:T --> B:db
    be_targets:T --> B:db
    be_exec:T --> B:db
    be_exec:T --> R:groq
    be_eval:T --> B:db
    be_eval:T --> R:judge
    be_reports:T --> B:db
    be_analytics:T --> B:db
    migrations:T --> B:db
```

### Request Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│  Next.js    │────▶│   FastAPI   │────▶│  PostgreSQL │
│   (React)   │     │  Frontend   │     │   Backend   │     │  Database   │
└─────────────┘     └─────────────┘     └──────┬──────┘     └─────────────┘
                                                │
                                                ▼
                                         ┌─────────────┐
                                         │  Groq API   │
                                         │ (LLM Judge) │
                                         └─────────────┘
```

### Backend Structure

```
app/
├── api/v1/              # REST API routers
│   ├── analytics.py     # Dashboard analytics
│   ├── auth.py          # Authentication & user profile
│   ├── evaluations.py   # LLM evaluation endpoints
│   ├── executions.py    # Attack batch execution
│   ├── llm.py           # LLM connectivity testing
│   ├── reports.py       # Report generation & export
│   ├── targets.py       # Target management
│   ├── test_cases.py    # Attack test case library
│   └── users.py         # User management (admin)
├── core/
│   ├── config.py        # Pydantic Settings configuration
│   ├── database.py      # Async SQLAlchemy engine/session
│   ├── dependencies.py  # FastAPI dependencies (auth, RBAC)
│   ├── rate_limiter.py  # SlowAPI rate limiting
│   └── security.py      # JWT, password hashing, token validation
├── database/
│   └── base.py          # Declarative base
├── models/              # SQLAlchemy ORM models
│   ├── user.py
│   ├── target.py
│   ├── attack_test_case.py
│   ├── execution.py
│   └── evaluation.py
├── schemas/             # Pydantic request/response models
├── scripts/             # Admin utilities (create admin, reset passwords)
├── services/            # Business logic layer
│   ├── analytics_service.py
│   ├── base_provider.py
│   ├── evaluation_service.py
│   ├── execution_service.py
│   ├── groq_service.py
│   ├── llm_judge_service.py
│   ├── report_service.py
│   └── risk_scoring.py
└── main.py              # FastAPI application entry point
```

### Frontend Structure

```
frontend/
├── app/
│   ├── (auth)/          # Auth route group
│   │   └── login/
│   ├── (dashboard)/     # Protected dashboard routes
│   │   ├── dashboard/
│   │   ├── targets/
│   │   ├── executions/
│   │   ├── evaluations/
│   │   ├── reports/
│   │   ├── risk/
│   │   └── users/
│   ├── layout.tsx       # Root layout with providers
│   └── page.tsx         # Landing page
├── components/
│   ├── layout/          # Header, Sidebar, MainLayout
│   └── ui/              # Reusable UI components (Button, Card, Input, Badge, Avatar)
├── context/
│   └── AuthContext.tsx  # React context for auth state
├── lib/
│   ├── api/
│   │   ├── client.ts    # Pure API client factory
│   │   └── useApiClient.ts  # React hook for API client
│   └── utils.ts         # Utility functions
└── public/              # Static assets
```

---

## Technology Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.13 | Runtime |
| FastAPI | 0.162.0 | Async web framework |
| SQLAlchemy | 2.1.8 | Async ORM |
| Pydantic | 2.14.2 | Data validation & settings |
| Pydantic Settings | 2.16.2 | Configuration management |
| Psycopg | 3.3.8 | PostgreSQL async driver |
| Alembic | 1.20.1 | Database migrations |
| PyJWT | 2.15.1 | JWT token handling |
| pwdlib[argon2] | 0.4.0 | Argon2 password hashing |
| Groq | 1.7.0 | LLM provider SDK |
| SlowAPI | 0.1.10 | Rate limiting |
| Uvicorn | 0.54.0 | ASGI server |
| Pytest | 9.2.0 | Testing framework |
| pytest-asyncio | 1.4.1 | Async test support |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.4.6 | React framework (App Router) |
| React | 19.3.0 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.3.3 | Styling |
| Radix UI | 1.2.1 | Accessible primitives |
| Recharts | 3.10.1 | Data visualization |
| Zod | 3.25.76 | Schema validation |
| ESLint | 9.x | Linting |
| Turbopack | 4.3.3 | Build tool |

### Database & Infrastructure

| Technology | Version | Purpose |
|------------|---------|---------|
| PostgreSQL | 18 | Primary database |
| Alembic | 1.20.1 | Migration management |

### Authentication & Security

| Technology | Version | Purpose |
|------------|---------|---------|
| JWT (PyJWT) | 2.15.1 | Stateless authentication |
| Argon2 (pwdlib) | 0.4.0 | Password hashing |
| SlowAPI | 0.1.10 | Rate limiting |

### AI/LLM Integration

| Technology | Version | Purpose |
|------------|---------|---------|
| Groq SDK | 1.7.0 | LLM provider (OpenAI-compatible) |
| LLM-as-a-Judge | Custom | Evaluation service |

---

## Project Structure

```
AI_REDTEAM/
│
├── app/                          # Backend source
│   ├── api/v1/                   # API routers (9 modules)
│   ├── core/                     # Configuration, DB, security, deps
│   ├── database/                 # SQLAlchemy base
│   ├── models/                   # ORM models (5 tables)
│   ├── schemas/                  # Pydantic schemas (9 modules)
│   ├── scripts/                  # Admin utilities (3 scripts)
│   ├── services/                 # Business logic (7 services)
│   └── main.py                   # FastAPI entry point
│
├── frontend/                     # Next.js frontend
│   ├── app/                      # App Router pages
│   │   ├── (auth)/               # Auth route group
│   │   └── (dashboard)/          # Protected dashboard routes
│   ├── components/               # React components
│   │   ├── layout/               # Layout components
│   │   └── ui/                   # UI primitives
│   ├── context/                  # React context providers
│   ├── lib/                      # Utilities & API client
│   └── public/                   # Static assets
│
├── migrations/                   # Alembic migrations
│   ├── versions/                 # Migration scripts (2)
│   ├── env.py                    # Migration environment
│   └── script.py.mako            # Migration template
│
├── docs/                         # Documentation
│   └── frontend-integration/     # API reference & workflows
│       ├── API_REFERENCE.md
│       ├── API_WORKFLOWS.md
│       ├── AUTHENTICATION.md
│       ├── FRONTEND_HANDOFF.md
│       └── OPENAPI.json
│
├── tests/                        # Test suite (to be expanded)
│
├── .gitignore                    # Git ignore rules
├── .env.example                  # Environment template
├── alembic.ini                   # Alembic configuration
├── README.md                     # This file
└── requirements.txt              # Python dependencies
```

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Python | 3.13+ | Required for async SQLAlchemy 2.x |
| PostgreSQL | 18+ | Primary database |
| Node.js | 20+ | Frontend development |
| npm | 10+ | Package manager (or yarn/pnpm) |
| Git | Latest | Version control |
| Groq API Key | — | For LLM evaluation features |

---

## Installation and Setup

### Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd AI_REDTEAM
```

### Backend Setup

#### Windows PowerShell

```powershell
# Create virtual environment
python -m venv .venv
.venv\Scripts\Activate.ps1

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
```

#### Linux/macOS

```bash
# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
```

#### Configure Environment Variables

Copy the example and edit with your values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Application
APP_NAME=AI Red-Team Platform
APP_VERSION=0.1.0
DEBUG=true

# Database (update with your PostgreSQL credentials)
DATABASE_URL=postgresql+psycopg://redteam_user:your_password@localhost:5432/ai_redteam

# AI Provider (Groq) - Get your key from https://console.groq.com
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b

# Authentication - Generate a secure secret:
# python -c "import secrets; print(secrets.token_urlsafe(32))"
JWT_SECRET_KEY=your_secure_random_secret_here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

#### Database Setup

Ensure PostgreSQL is running and create the database:

```sql
CREATE DATABASE ai_redteam;
CREATE USER redteam_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ai_redteam TO redteam_user;
```

Run migrations:

```bash
alembic upgrade head
```

#### Start the Backend

```bash
uvicorn app.main:app --reload
```

The API will be available at:
- **API Base:** http://127.0.0.1:8000
- **Swagger UI:** http://127.0.0.1:8000/docs
- **ReDoc:** http://127.0.0.1:8000/redoc

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file if needed (for API base URL)
# cp .env.example .env.local

# Start development server
npm run dev
```

The frontend will be available at http://localhost:3000

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL async connection string | `postgresql+psycopg://user:pass@localhost:5432/ai_redteam` |
| `GROQ_API_KEY` | Groq API key for LLM features | `gsk_...` |
| `GROQ_MODEL` | Model identifier | `openai/gpt-oss-120b` |
| `JWT_SECRET_KEY` | Secure random string for JWT signing | Generate with `secrets.token_urlsafe(32)` |
| `JWT_ALGORITHM` | JWT signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime | `30` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_NAME` | `AI Red-Team Platform` | Application display name |
| `APP_VERSION` | `0.1.0` | Application version |
| `DEBUG` | `true` | Enable debug mode |

### Generating a Secure JWT Secret

```bash
# Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# OpenSSL
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

> **Security Note:** Never commit `.env` files or expose secrets in version control. Use `.env.example` as a template only.

---

## API Documentation

### Base URL

```
Development: http://127.0.0.1:8000/api/v1
Production:  https://your-domain.com/api/v1
```

### Endpoint Groups

| Group | Endpoints | Authentication | Roles |
|-------|-----------|----------------|-------|
| **Authentication** | `/auth/login`, `/auth/me` | Varied | All |
| **Users** | `/users/`, `/users/{id}` | Required | Admin |
| **Targets** | `/targets/`, `/targets/{id}` | Required | All (write: Admin/Analyst) |
| **Test Cases** | `/test-cases/`, `/test-cases/{id}` | Required | All (write: Admin/Analyst) |
| **Executions** | `/executions/`, `/executions/{batch_id}` | Required | All (write: Admin/Analyst) |
| **Evaluations** | `/evaluations/batch/{batch_id}`, `/evaluations/{id}` | Required | Admin/Analyst |
| **Analytics** | `/analytics/dashboard` | Required | All (own data) |
| **Reports** | `/reports/`, `/reports/{batch_id}`, `/reports/{batch_id}/export/*` | Required | All (own data) |

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Authenticate and receive JWT |
| GET | `/auth/me` | Get current user profile |
| GET | `/targets` | List configured LLM targets |
| POST | `/targets` | Create new target (Admin/Analyst) |
| GET | `/test-cases` | List attack test cases |
| POST | `/executions/` | Execute attack batch |
| GET | `/executions/{batch_id}` | Get execution results |
| POST | `/evaluations/batch/{batch_id}` | Run LLM evaluations |
| GET | `/analytics/dashboard` | Get dashboard analytics |
| GET | `/reports/{batch_id}` | Get security report |
| GET | `/reports/{batch_id}/export/json` | Export report as JSON |
| GET | `/reports/{batch_id}/export/pdf` | Export report as PDF |

### Authentication

All protected endpoints require a JWT Bearer token:

```
Authorization: Bearer <access_token>
```

Token expires after 30 minutes (configurable). No refresh endpoint exists — re-authenticate on expiry.

---

## Authentication and User Roles

### Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **Admin** | Platform administrator | Full access: user management, all data, global analytics |
| **Analyst** | Security analyst | Create/execute tests, view own data, generate own reports |
| **Viewer** | Read-only access | View targets, test cases, own executions, own reports |

### Access Control Matrix

| Operation | Admin | Analyst | Viewer |
|-----------|-------|---------|--------|
| View Dashboard | Global | Own Data | Own Data |
| Manage Users | ✅ | ❌ | ❌ |
| Create Targets | ✅ | ✅ | ❌ |
| View Targets | ✅ | ✅ | ✅ |
| Manage Test Cases | ✅ | ✅ | ❌ |
| Execute Tests | ✅ | ✅ | ❌ |
| View Executions | All | Own | Own |
| Run Evaluations | ✅ | ✅ | ❌ |
| View Evaluations | All | Own | Own |
| Generate Reports | All | Own | Own |
| Export Reports (JSON/PDF) | All | Own | Own |

### Login Flow

1. `POST /api/v1/auth/login` with `email` and `password`
2. Receive `access_token` (JWT)
3. Include `Authorization: Bearer <token>` in subsequent requests
4. Token expires in 30 minutes — re-authenticate on 401

---

## Dashboard and Analytics

The platform provides a comprehensive analytics dashboard accessible via `GET /api/v1/analytics/dashboard`.

### Dashboard Components

| Component | Description |
|-----------|-------------|
| **Overview** | Total executions, evaluations, coverage percentages |
| **Category Breakdown** | Attack category distribution with pass/fail rates |
| **Target Performance** | Per-target success rates and risk scores |
| **Risk Trends** | Time-series risk score progression |

### Ownership Filtering

- **Admin:** Sees all data across all users
- **Analyst/Viewer:** Sees only their own executions and evaluations (filtered by `created_by_user_id`)

---

## Testing

### Backend Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test module
pytest tests/test_auth.py -v
```

### Frontend Checks

```bash
cd frontend

# TypeScript type checking
npx tsc --noEmit

# ESLint
npx eslint .

# Production build
npm run build
```

### Database Verification

```bash
# Check migration status
alembic current

# Show migration history
alembic history
```

---

## Security Considerations

### Implemented Controls

| Control | Implementation |
|---------|----------------|
| **Password Hashing** | Argon2 via `pwdlib.PasswordHash.recommended()` |
| **JWT Validation** | HS256 with signature, expiry, `sub`, `iat` checks |
| **Role-Based Authorization** | FastAPI dependencies with role checks |
| **Resource Ownership** | SQL-level `created_by_user_id` filtering on all queries |
| **Rate Limiting** | SlowAPI with configurable limits |
| **Environment Secrets** | All secrets via `.env` (not committed) |
| **SQL Injection Prevention** | SQLAlchemy ORM with parameterized queries |
| **CORS Policy** | Restricted to known origins |
| **Input Validation** | Pydantic schemas on all endpoints |

### Known Limitations

- **No Token Refresh** — Users must re-authenticate after 30 minutes
- **No MFA** — Single-factor authentication only
- **No Audit Logging** — Operation logging not yet implemented
- **Groq API Key Required** — LLM features unavailable without valid key
- **CSRF Protection** — Relies on SameSite cookies / Authorization header

### Security Recommendations for Production

1. Rotate `JWT_SECRET_KEY` periodically
2. Use HTTPS/TLS in production
3. Configure stricter CORS origins
4. Enable audit logging for sensitive operations
5. Implement token refresh mechanism
6. Add multi-factor authentication
7. Regular security dependency updates (`pip-audit`, `npm audit`)
8. Conduct independent penetration testing

---

## Known Limitations

1. **Token Refresh Not Implemented** — Sessions expire after 30 minutes; users must log in again
2. **Groq API Dependency** — LLM evaluation features require a valid Groq API key
3. **Single LLM Provider** — Currently only Groq (OpenAI-compatible) is integrated
4. **No Automated Scheduling** — Test executions are manually triggered
5. **Limited Attack Coverage** — Test case library needs expansion
6. **No Webhook/Notification System** — No async completion notifications
7. **PDF Generation Limits** — Very large reports may fail PDF generation

---

## Future Improvements

### Short Term (Next 1-2 Months)

- [ ] Complete report ownership enforcement across all endpoints
- [ ] Complete analytics data isolation for all user roles
- [ ] Add OpenAI and Anthropic provider integrations
- [ ] Implement automated token refresh endpoint
- [ ] Expand attack test case library (prompt injection, jailbreak, encoding)
- [ ] Add audit trail logging for security-relevant operations

### Medium Term (3-6 Months)

- [ ] Complete frontend dashboard with all backend features
- [ ] Add multi-turn conversation attack support
- [ ] Implement scheduled/recurring test executions
- [ ] Add webhook notifications for batch completion
- [ ] Enhanced risk scoring with MITRE ATLAS mapping
- [ ] Team/workspace multi-tenancy support

### Long Term (6+ Months)

- [ ] Local model support (Ollama, vLLM)
- [ ] Advanced visualization and reporting
- [ ] Integration with CI/CD pipelines
- [ ] Compliance reporting templates (ISO 42001, NIST AI RMF)
- [ ] Automated vulnerability discovery (fuzzing)
- [ ] Community attack pattern sharing

---

## Contributing

Contributions are welcome. Please follow this workflow:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/your-feature-name`
3. **Implement** your changes with tests
4. **Verify** all checks pass:
   ```bash
   # Backend
   pytest
   # Frontend
   cd frontend && npx tsc --noEmit && npx eslint . && npm run build
   ```
5. **Submit** a pull request with a clear description

### Code Style

- **Python:** Follow PEP 8, use type hints, run `ruff check` (if configured)
- **TypeScript:** Follow Next.js/React conventions, strict mode enabled
- **Commits:** Use conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)

---

## License

No license has been specified for this project. All rights reserved by the project owner. Reuse permissions should be clarified by the owner before redistribution or commercial use.

---

## Author

**AI_REDTEAM** — AI Safety & Red-Team Testing Platform

- **Repository:** https://github.com/alchemist-sourav/AI_REDTEAM
- **Status:** Active Development

---

*Last updated: November 2026*
*Project Version: 0.1.0*