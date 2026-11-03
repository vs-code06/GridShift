"""Simple one-command launcher for the GridShift backend."""
import sys
from pathlib import Path

# Automatically add src directory to python search path
sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))

import uvicorn
from gridshift.config import get_settings

if __name__ == "__main__":
    settings = get_settings()
    uvicorn.run(
        "gridshift.api.main:app",
        host="0.0.0.0",
        port=settings.API_PORT,
        reload=True,
    )

