"""Runtime forecast predictor for the scheduler and Gymnasium environment."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Sequence

import numpy as np
import xgboost as xgb

logger = logging.getLogger(__name__)


class ForecastPredictor:
    """Predicts upcoming GPU demand from recent workload history.

    Parameters
    ----------
    model_path:
        Path to the saved XGBoost model (.json or .ubj).
    """

    def __init__(self, model_path: str | Path | None = None) -> None:
        self._model: xgb.XGBRegressor | None = None
        self._feature_names: list[str] = []

        if model_path:
            self.load(model_path)

    def load(self, model_path: str | Path) -> None:
        """Load an XGBoost model from disk."""
        path = Path(model_path)
        if not path.exists():
            logger.warning("Forecast model file not found at %s", path)
            return

        self._model = xgb.XGBRegressor()
        self._model.load_model(str(path))
        # Extract booster feature names if present
        try:
            self._feature_names = self._model.get_booster().feature_names or []
        except Exception:
            self._feature_names = []
        logger.info("Loaded XGBoost forecast model from %s", path)

    @property
    def is_ready(self) -> bool:
        """Return True if model is loaded."""
        return self._model is not None

    def predict_from_features(self, feature_vector: Sequence[float] | np.ndarray) -> float:
        """Predict forward GPU demand given a feature vector.

        Parameters
        ----------
        feature_vector:
            1D array of features matching the model's training schema.

        Returns
        -------
        float
            Predicted aggregate GPU demand (non-negative).
        """
        if self._model is None:
            return 0.0

        vec = np.asarray(feature_vector, dtype=float).reshape(1, -1)
        pred = float(self._model.predict(vec)[0])
        return max(0.0, pred)

