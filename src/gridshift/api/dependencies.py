"""Persistence layer and dependency injection for FastAPI."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from motor.motor_asyncio import AsyncIOMotorClient

from ..config import get_settings

logger = logging.getLogger(__name__)


class StorageManager:
    """Hybrid storage manager with async MongoDB support and local JSON fallback."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self._mongo_client: AsyncIOMotorClient | None = None
        self._db: Any = None
        self._memory_datasets: dict[str, dict[str, Any]] = {}
        self._memory_experiments: dict[str, dict[str, Any]] = {}
        self._memory_jobs: dict[str, list[dict[str, Any]]] = {}
        self._memory_timelines: dict[str, list[dict[str, Any]]] = {}

        # Local persistence directory
        self._storage_dir = Path(self.settings.ARTIFACTS_DIR) / "db"
        self._storage_dir.mkdir(parents=True, exist_ok=True)
        self._load_local_state()

    def _load_local_state(self) -> None:
        exp_file = self._storage_dir / "experiments.json"
        if exp_file.exists():
            try:
                with open(exp_file, encoding="utf-8") as f:
                    self._memory_experiments = json.load(f)
            except Exception:
                pass

        ds_file = self._storage_dir / "datasets.json"
        if ds_file.exists():
            try:
                with open(ds_file, encoding="utf-8") as f:
                    self._memory_datasets = json.load(f)
            except Exception:
                pass

    def _save_local_state(self) -> None:
        try:
            with open(self._storage_dir / "experiments.json", "w", encoding="utf-8") as f:
                json.dump(self._memory_experiments, f, indent=2)
            with open(self._storage_dir / "datasets.json", "w", encoding="utf-8") as f:
                json.dump(self._memory_datasets, f, indent=2)
        except Exception as e:
            logger.warning("Failed to save local state: %s", e)

    async def init_mongo(self) -> None:
        try:
            self._mongo_client = AsyncIOMotorClient(
                self.settings.MONGODB_URI,
                serverSelectionTimeoutMS=1000,
            )
            # Ping
            await self._mongo_client.admin.command("ping")
            self._db = self._mongo_client[self.settings.MONGODB_DATABASE]
            logger.info("Connected to MongoDB at %s", self.settings.MONGODB_URI)
        except Exception as e:
            logger.info("MongoDB not reachable (%s); using file-backed local storage.", e)
            self._db = None

    async def save_dataset(self, dataset_id: str, data: dict[str, Any]) -> None:
        self._memory_datasets[dataset_id] = data
        self._save_local_state()
        if self._db is not None:
            try:
                await self._db.datasets.replace_one({"id": dataset_id}, data, upsert=True)
            except Exception:
                pass

    async def get_dataset(self, dataset_id: str) -> dict[str, Any] | None:
        if self._db is not None:
            try:
                doc = await self._db.datasets.find_one({"id": dataset_id})
                if doc:
                    doc.pop("_id", None)
                    return doc
            except Exception:
                pass
        return self._memory_datasets.get(dataset_id)

    async def list_datasets(self) -> list[dict[str, Any]]:
        if self._db is not None:
            try:
                cursor = self._db.datasets.find({})
                results = []
                async for doc in cursor:
                    doc.pop("_id", None)
                    results.append(doc)
                return results
            except Exception:
                pass
        return list(self._memory_datasets.values())

    async def save_experiment(self, exp_id: str, data: dict[str, Any]) -> None:
        self._memory_experiments[exp_id] = data
        self._save_local_state()
        if self._db is not None:
            try:
                await self._db.experiments.replace_one({"id": exp_id}, data, upsert=True)
            except Exception:
                pass

    async def get_experiment(self, exp_id: str) -> dict[str, Any] | None:
        if self._db is not None:
            try:
                doc = await self._db.experiments.find_one({"id": exp_id})
                if doc:
                    doc.pop("_id", None)
                    return doc
            except Exception:
                pass
        return self._memory_experiments.get(exp_id)

    async def list_experiments(self) -> list[dict[str, Any]]:
        if self._db is not None:
            try:
                cursor = self._db.experiments.find({})
                results = []
                async for doc in cursor:
                    doc.pop("_id", None)
                    results.append(doc)
                return results
            except Exception:
                pass
        return list(self._memory_experiments.values())

    def save_job_outcomes(self, exp_id: str, jobs: list[dict[str, Any]]) -> None:
        self._memory_jobs[exp_id] = jobs

    def get_job_outcomes(self, exp_id: str) -> list[dict[str, Any]]:
        return self._memory_jobs.get(exp_id, [])

    def save_timeline(self, exp_id: str, events: list[dict[str, Any]]) -> None:
        self._memory_timelines[exp_id] = events

    def get_timeline(self, exp_id: str) -> list[dict[str, Any]]:
        return self._memory_timelines.get(exp_id, [])


# Singleton instance
storage = StorageManager()


def get_storage() -> StorageManager:
    return storage
