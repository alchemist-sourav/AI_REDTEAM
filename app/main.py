import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(
        asyncio.WindowsSelectorEventLoopPolicy()
    )

if sys.platform == "win32":
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    except RuntimeError:
        pass

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db, close_db
from app.models import Target, User
from app.api.v1.targets import router as targets_router
from app.api.v1.executions import router as executions_router
from app.api.v1.llm import router as llm_router
from app.api.v1.evaluations import router as evaluations_router
from app.api.v1.test_cases import router as test_cases_router
from app.api.v1.reports import router as reports_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.rate_limiter import limiter


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting AI Red-Team Platform...")
    await init_db()
    yield
    print("Shutting down AI Red-Team Platform...")
    await close_db()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI Safety and Red-Team Testing Platform",
    lifespan=lifespan,
    redirect_slashes=False,
)

# CORS — allow the Next.js development server and production origin.
# Credentials (Authorization header) are forwarded via the Next.js rewrite
# proxy, so the browser only ever talks to the same origin in production.
# In development, the backend may be accessed directly from the browser
# during testing, so we allow the local dev origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["General"])
async def root():
    return {
        "message": "AI Red-Team Platform API",
        "version": settings.app_version,
        "status": "running",
    }


@app.get("/api/v1/health", tags=["Health"])
async def health():
    return {
        "status": "healthy",
        "application": settings.app_name,
    }


app.include_router(targets_router, prefix="/api/v1")
app.include_router(llm_router, prefix="/api/v1")
app.include_router(test_cases_router, prefix="/api/v1")
app.include_router(executions_router, prefix="/api/v1")
app.include_router(evaluations_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")

app.state.limiter = limiter
app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler,
)