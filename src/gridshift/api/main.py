"""FastAPI application entrypoint for GridShift."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ..config import get_settings
from .dependencies import storage
from .routes.datasets import router as datasets_router
from .routes.experiments import router as experiments_router
from .routes.forecasts import router as forecasts_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan event handler to initialize resources on startup."""
    await storage.init_mongo()
    yield


def create_app() -> FastAPI:
    """Build and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="GridShift API",
        description="Adaptive GPU Cluster Scheduler REST API",
        version="0.1.0",
        lifespan=lifespan,
    )

    # CORS middleware for frontend communication
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount API routers
    app.include_router(datasets_router)
    app.include_router(experiments_router)
    app.include_router(forecasts_router)

    @app.get("/health")
    async def health_check() -> dict[str, str]:
        return {"status": "ok", "version": "0.1.0"}

    return app


app = create_app()


def run_server() -> None:
    """CLI launcher for uvicorn server."""
    settings = get_settings()
    uvicorn.run(
        "gridshift.api.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True,
    )


if __name__ == "__main__":
    run_server()

