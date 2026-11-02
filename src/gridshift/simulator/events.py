"""Simulation event definitions and data structures."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from ..data.schemas import CanonicalJob


class EventType(Enum):
    """Types of events processed by the simulation loop."""

    JOB_ARRIVAL = "job_arrival"
    JOB_COMPLETION = "job_completion"
    SCHEDULING_DECISION = "scheduling_decision"


@dataclass(order=True)
class Event:
    """A single simulation event, ordered by timestamp for the priority queue."""

    timestamp: float
    event_type: EventType = field(compare=False)
    payload: dict[str, Any] = field(default_factory=dict, compare=False)


@dataclass
class RunningJob:
    """A job currently executing on a machine."""

    job: CanonicalJob
    machine_id: str
    start_time: float
    expected_completion: float

