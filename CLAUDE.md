# AI Red-Team Platform - Claude Code Guidelines

## Overview
AI Red-Team Platform is an asynchronous FastAPI backend designed for automated AI red-teaming, model safety evaluations, and vulnerability assessment.

## Project Structure
- `app/api/v1/`: API route definitions and endpoint handlers
- `app/core/`: Application settings, environment configuration (`config.py`), and database session lifecycle (`database.py`)
- `app/database/`: SQLAlchemy declarative base and database utilities
- `app/models/`: SQLAlchemy ORM database models
- `app/schemas/`: Pydantic models for validation and serialization
- `app/services/`: Core business logic, LLM integrations, and red-teaming orchestrators
- `tests/`: Automated test suite (pytest, pytest-asyncio)

## Environment & Commands
- **Virtual Environment (Windows PowerShell)**: `.\venv\Scripts\Activate.ps1`
- **Dependencies**: `pip install -r requirements.txt`
- **Start Dev Server**: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
- **Database Migrations**: `alembic upgrade head`
- **Run Tests**: `pytest`

## Code Conventions
- **Asynchronous First**: All I/O operations (database, HTTP requests, LLM calls) must use `async`/`await`.
- **Database**: Use SQLAlchemy 2.0 style queries with `AsyncSession` injected via FastAPI dependency `get_db()`.
- **Configuration**: Access configuration through `app.core.config.settings`. Keep secrets in `.env`.
- **Typing**: Use standard Python type annotations (`str | None`, `list[dict]`, etc.).

