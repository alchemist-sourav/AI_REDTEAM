# AI_REDTEAM
### AI Safety, LLM Security Assessment & Automated Red-Team Testing Platform

**AI_REDTEAM** is an AI security assessment platform designed to evaluate the safety, robustness and security of Large Language Model (LLM) applications through automated adversarial testing.

As organizations increasingly integrate LLMs into their applications, protecting these systems against prompt injection, sensitive information disclosure and other AI-specific vulnerabilities becomes essential.

AI_REDTEAM aims to provide a centralized environment where developers and security researchers can configure AI targets, execute adversarial test cases, evaluate model responses, calculate security risk and generate structured assessment reports.

> **Project Status:** Active Development — Backend MVP implemented, security hardening and data isolation verification in progress.

---

## 1. Project Vision

The goal of AI_REDTEAM is to build a unified platform for systematically testing and evaluating the security of AI-powered applications.

Rather than manually testing prompts and inspecting model responses, the platform aims to automate the red-teaming workflow through:

- Configurable LLM targets.
- Reusable adversarial attack test cases.
- Automated test execution.
- LLM-assisted response evaluation.
- Risk classification and scoring.
- Security assessment reports.
- Analytics and performance monitoring.

The long-term vision is to evolve AI_REDTEAM into a comprehensive AI security testing environment that helps developers identify weaknesses before deploying AI applications into production.

## 2. Core Objectives

- Identify vulnerabilities in LLM-powered applications.
- Evaluate how models respond to adversarial prompts.
- Detect prompt injection and sensitive information disclosure.
- Automate repetitive security testing workflows.
- Assess model responses using an LLM-as-a-Judge approach.
- Quantify security findings through risk scoring.
- Generate structured reports for security assessment.
- Provide role-based access and controlled execution history.

## 3. How the Platform Works

The platform follows a structured security assessment workflow.

```text
       User Authentication
               |
               v
       Target Management
               |
               v
      Attack Test Case Library
               |
               v
       Execution Engine
               |
               v
        Target LLM
               |
               v
      Model Response Capture
               |
               v
       Evaluation Engine
               |
               v
        LLM-as-a-Judge
               |
               v
         Risk Scoring
               |
          +----+----+
          |         |
          v         v
       Reports   Analytics
```

### Assessment Workflow

1. **Configure a target:** Register an LLM provider and model.
2. **Select attack scenarios:** Choose adversarial test cases from the test-case library.
3. **Execute attacks:** Send test prompts to the configured target model.
4. **Capture responses:** Store model outputs and execution metadata.
5. **Evaluate responses:** Analyze the responses using evaluation logic and an LLM judge.
6. **Calculate risk:** Assign risk levels and calculate an overall security score.
7. **Generate reports:** Present findings and assessment results in structured formats.

## 4. Core Modules

| Module | Responsibility |
|---|---|
| Authentication & RBAC | Secure login, JWT authentication and role-based authorization |
| Target Management | Configure and manage LLM testing targets |
| Attack Test Library | Store and manage adversarial test cases |
| LLM Provider Integration | Connect to supported model providers |
| Execution Engine | Execute attack scenarios and capture responses |
| Evaluation Engine | Evaluate model responses |
| LLM-as-a-Judge | Perform AI-assisted security evaluation |
| Risk Scoring | Calculate risk scores and classify findings |
| Reporting Engine | Generate security assessment reports |
| Analytics Engine | Aggregate testing and evaluation metrics |

## 5. Technology Stack

### Backend
- Python 3.13
- FastAPI
- SQLAlchemy 2.x
- Pydantic
- Async database operations

### Database
- PostgreSQL 18
- Psycopg 3

### AI Integration
- Groq API
- LLM-as-a-Judge evaluation
- Configurable LLM target models

### Authentication & Security
- JWT authentication
- Argon2 password hashing
- Role-Based Access Control (RBAC)
- User-level execution ownership

### Database Migrations
- Alembic

### Development Tools
- Git and GitHub
- Visual Studio Code
- Swagger / OpenAPI

## 6. Current Development Progress

AI_REDTEAM is being developed incrementally, with the backend and its core security assessment workflow being implemented first.

### Implemented Features

| Feature | Status |
|---|---|
| FastAPI backend foundation | Completed |
| PostgreSQL integration | Completed |
| SQLAlchemy async database layer | Completed |
| JWT authentication | Completed |
| Argon2 password hashing | Completed |
| User management | Completed |
| Role-Based Access Control | Completed |
| Target management APIs | Completed |
| Groq API integration | Completed |
| Attack test-case management | Completed |
| Automated execution engine | Completed |
| Execution ownership | Implemented and tested |
| LLM-as-a-Judge evaluation | Implemented |
| Evaluation and risk scoring | Implemented |
| Evaluation ownership and access isolation | Implemented and tested |
| JSON security report export | Implemented |
| PDF security report export | Implemented |
| Dashboard analytics API | Implemented |

### Current Development Focus

The current focus is strengthening authorization and ensuring that users can access only the data permitted by their roles.

Work in progress:

- Report ownership and access isolation.
- Dashboard analytics data isolation.
- Comprehensive API security verification.
- Automated security and authorization tests.
- Final backend reliability and security improvements.

### Upcoming Development

- Complete report and analytics ownership enforcement.
- Expand adversarial attack test-case coverage.
- Improve evaluation accuracy and reliability.
- Introduce additional LLM provider integrations.
- Develop a frontend dashboard.
- Add advanced security analytics and assessment capabilities.
- Improve reporting and visualization.

*Development status reflects the current implementation as of November 2026. Features marked as upcoming are not yet claimed as completed.*

## 7. Role-Based Access Control

The platform currently supports three user roles.

| Role | Permissions |
|---|---|
| Admin | Full platform access and user management |
| Analyst | Create and execute security tests; access permitted assessment data |
| Viewer | Read-only access to permitted resources |

Execution records are associated with the user who initiated them. Evaluation access is also enforced through the underlying execution ownership.

The platform uses role-based permissions and resource-level access restrictions to prevent unauthorized access to other users' assessment data.

## 8. Project Structure

```text
AI_REDTEAM/
│
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── analytics.py
│   │       ├── auth.py
│   │       ├── evaluations.py
│   │       ├── executions.py
│   │       ├── llm.py
│   │       ├── reports.py
│   │       ├── targets.py
│   │       ├── test_cases.py
│   │       └── users.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   ├── rate_limiter.py
│   │   └── security.py
│   │
│   ├── database/
│   │   └── base.py
│   │
│   ├── models/
│   ├── schemas/
│   ├── scripts/
│   ├── services/
│   │
│   └── main.py
│
├── migrations/
│   └── versions/
│
├── alembic.ini
├── requirements.txt
├── .gitignore
└── README.md
```

## 9. Local Development Setup

### Prerequisites

- Python 3.13+
- PostgreSQL 18+
- Git
- Groq API key

### Clone the Repository

```bash
git clone https://github.com/alchemist-sourav/AI_REDTEAM.git
cd AI_REDTEAM
```

### Create a Virtual Environment

Windows PowerShell:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Configure Environment Variables

Create a `.env` file in the project root.

Configure the required settings:

```env
DATABASE_URL=your_postgresql_connection_string

GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b

JWT_SECRET_KEY=your_secure_random_secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Use your own local credentials. Never commit `.env` or expose API keys and JWT secrets in the repository.

### Run Database Migrations

```bash
alembic upgrade head
```

### Start the Backend

```bash
uvicorn app.main:app --reload
```

### Access API Documentation

Once the server is running:

- API: http://127.0.0.1:8000
- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

## 10. API Overview

The backend exposes versioned REST API endpoints.

| Endpoint | Purpose |
|---|---|
| `/api/v1/auth/login` | User authentication |
| `/api/v1/auth/me` | Current user information |
| `/api/v1/users/` | User management |
| `/api/v1/targets/` | Target management |
| `/api/v1/test-cases/` | Attack test-case management |
| `/api/v1/llm/test` | Test LLM connectivity and inference |
| `/api/v1/executions/` | Execute security test batches |
| `/api/v1/evaluations/` | Evaluate model responses |
| `/api/v1/reports/` | Security assessment reports |
| `/api/v1/analytics/dashboard` | Dashboard analytics |

Refer to the Swagger documentation for request schemas, parameters and response formats.

## 11. Security Considerations

AI_REDTEAM is itself a security-oriented application, so protecting the platform is a core development priority.

Current security mechanisms include:

- Secure password hashing with Argon2.
- JWT-based authentication.
- Role-based authorization.
- Resource-level execution ownership.
- Restricted evaluation access.
- Database constraints and foreign keys.
- Environment-based secret configuration.
- Alembic-managed database migrations.

The platform is actively undergoing additional authorization and data-isolation verification.

**Important:** AI_REDTEAM is under active development. It is not yet presented as a certified security product or a substitute for comprehensive penetration testing.

## 12. Project Roadmap

- [x] Backend foundation
- [x] Database integration
- [x] Authentication and RBAC
- [x] Target management
- [x] Attack test-case library
- [x] LLM provider integration
- [x] Execution engine
- [x] Evaluation engine
- [x] LLM-as-a-Judge
- [x] Risk scoring
- [x] Basic reporting
- [x] Basic dashboard analytics
- [ ] Complete report ownership enforcement
- [ ] Complete analytics data isolation
- [ ] Final backend security audit
- [ ] Expand attack test coverage
- [ ] Frontend dashboard
- [ ] Additional LLM providers
- [ ] Advanced security analytics

## 13. Long-Term Vision

AI_REDTEAM aims to become a practical security assessment environment for AI-powered systems.

Future development will focus on expanding adversarial testing capabilities, improving evaluation reliability, supporting more LLM providers and delivering a comprehensive interface for understanding and managing AI security risks.

The objective is simple:

**Build safer AI systems by continuously testing how they behave under adversarial conditions.**

---

## 14. Contributing

Contributions, suggestions and discussions are welcome.

If you would like to contribute:

1. Fork the repository.
2. Create a feature branch.
3. Implement and test your changes.
4. Submit a pull request with a clear description.

## 15. License

License information will be added once the project license is finalized.

---

**Repository:** https://github.com/alchemist-sourav/AI_REDTEAM

**Project:** AI_REDTEAM — AI Safety & Red-Team Testing Platform

**Status:** Active Development
