import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import clients, projects, agreements, analyzer, memory, dashboard, demo
from app.database.connection import engine, Base
from app.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("scopesentry")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure database tables are created
    logger.info("Starting ScopeSentry AI backend...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database initialized successfully.")
    yield
    # Shutdown
    logger.info("Shutting down ScopeSentry AI backend...")
    await engine.dispose()


app = FastAPI(
    title="ScopeSentry AI API",
    description="Intelligent business scope management agent powered by Hindsight persistent memory and Groq AI.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(clients.router, prefix="/api/clients", tags=["clients"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(agreements.router, prefix="/api/agreements", tags=["agreements"])
app.include_router(analyzer.router, prefix="/api", tags=["analyzer"])
app.include_router(memory.router, prefix="/api/memory", tags=["memory"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(demo.router, prefix="/api/demo", tags=["demo"])


@app.get("/")
async def root():
    return {
        "name": "ScopeSentry AI",
        "tagline": "Never Lose Track of What Was Agreed.",
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs",
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "groq_configured": bool(settings.groq_api_key),
        "hindsight_configured": bool(settings.hindsight_api_key),
    }
