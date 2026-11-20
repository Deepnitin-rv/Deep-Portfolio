"""Pure Python implementation of Linear Regression from scratch (zero external ML libraries)."""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Iterable


@dataclass
class RegressionResult:
    method: str
    slope: float
    intercept: float
    mse: float
    rmse: float
    r2: float
    epochs: int
    learning_rate: float
    loss_history: list[dict[str, float | int]]
    predictions: list[dict[str, float]]
    equation: str


class LinearRegressionOLS:
    """Closed-form Ordinary Least Squares linear regression implemented from scratch."""

    def __init__(self) -> None:
        self.slope: float = 0.0
        self.intercept: float = 0.0
        self.fitted: bool = False

    def fit(self, xs: Iterable[float], ys: Iterable[float]) -> "LinearRegressionOLS":
        x_vals = [float(x) for x in xs]
        y_vals = [float(y) for y in ys]
        if len(x_vals) != len(y_vals) or len(x_vals) < 2:
            raise ValueError("At least 2 matching (x, y) data points are required.")

        n = len(x_vals)
        mean_x = sum(x_vals) / n
        mean_y = sum(y_vals) / n

        numerator = sum((x - mean_x) * (y - mean_y) for x, y in zip(x_vals, y_vals))
        denominator = sum((x - mean_x) ** 2 for x in x_vals)

        if abs(denominator) < 1e-12:
            raise ValueError("All x values are identical; slope is undefined.")

        self.slope = numerator / denominator
        self.intercept = mean_y - self.slope * mean_x
        self.fitted = True
        return self

    def predict_one(self, x: float) -> float:
        if not self.fitted:
            raise RuntimeError("Model must be fitted before calling predict.")
        return self.slope * float(x) + self.intercept

    def predict(self, xs: Iterable[float]) -> list[float]:
        return [self.predict_one(x) for x in xs]

    def evaluate(self, xs: Iterable[float], ys: Iterable[float]) -> tuple[float, float, float]:
        x_vals = [float(x) for x in xs]
        y_vals = [float(y) for y in ys]
        preds = self.predict(x_vals)
        n = len(y_vals)
        mse = sum((y - y_hat) ** 2 for y, y_hat in zip(y_vals, preds)) / n
        rmse = math.sqrt(mse)

        mean_y = sum(y_vals) / n
        ss_tot = sum((y - mean_y) ** 2 for y in y_vals)
        ss_res = sum((y - y_hat) ** 2 for y, y_hat in zip(y_vals, preds))
        r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 1e-12 else 1.0
        return mse, rmse, r2


class LinearRegressionGD:
    """Gradient Descent linear regression implemented from scratch using pure Python."""

    def __init__(self, learning_rate: float = 0.01, epochs: int = 400) -> None:
        if learning_rate <= 0 or learning_rate > 1.0:
            raise ValueError("Learning rate must be between 0 and 1.0.")
        if epochs < 1 or epochs > 5000:
            raise ValueError("Epochs must be between 1 and 5000.")
        self.learning_rate = float(learning_rate)
        self.epochs = int(epochs)
        self.slope: float = 0.0
        self.intercept: float = 0.0
        self.loss_history: list[dict[str, float | int]] = []
        self.fitted: bool = False

    def fit(self, xs: Iterable[float], ys: Iterable[float]) -> "LinearRegressionGD":
        x_vals = [float(x) for x in xs]
        y_vals = [float(y) for y in ys]
        if len(x_vals) != len(y_vals) or len(x_vals) < 2:
            raise ValueError("At least 2 matching (x, y) data points are required.")

        n = len(x_vals)
        # Scale x internally for stable gradient descent convergence across arbitrary ranges,
        # then map parameters back to original units.
        mean_x = sum(x_vals) / n
        std_x = math.sqrt(sum((x - mean_x) ** 2 for x in x_vals) / n)
        if std_x < 1e-12:
            raise ValueError("All x values are identical; slope is undefined.")

        x_scaled = [(x - mean_x) / std_x for x in x_vals]

        w = 0.0
        b = 0.0
        self.loss_history = []
        sample_stride = max(1, self.epochs // 40)

        for epoch in range(1, self.epochs + 1):
            dw = 0.0
            db = 0.0
            total_sq_error = 0.0

            for x_i, y_i in zip(x_scaled, y_vals):
                y_pred = w * x_i + b
                error = y_pred - y_i
                total_sq_error += error * error
                dw += (2.0 / n) * error * x_i
                db += (2.0 / n) * error

            w -= self.learning_rate * dw
            b -= self.learning_rate * db
            mse = total_sq_error / n

            if epoch == 1 or epoch % sample_stride == 0 or epoch == self.epochs:
                self.loss_history.append({"epoch": epoch, "mse": round(mse, 6)})

        # Unscale w and b back to original coordinate space: y = (w/std_x)*x + (b - w*mean_x/std_x)
        self.slope = w / std_x
        self.intercept = b - (w * mean_x / std_x)
        self.fitted = True
        return self

    def predict_one(self, x: float) -> float:
        if not self.fitted:
            raise RuntimeError("Model must be fitted before calling predict.")
        return self.slope * float(x) + self.intercept

    def predict(self, xs: Iterable[float]) -> list[float]:
        return [self.predict_one(x) for x in xs]

    def evaluate(self, xs: Iterable[float], ys: Iterable[float]) -> tuple[float, float, float]:
        x_vals = [float(x) for x in xs]
        y_vals = [float(y) for y in ys]
        preds = self.predict(x_vals)
        n = len(y_vals)
        mse = sum((y - y_hat) ** 2 for y, y_hat in zip(y_vals, preds)) / n
        rmse = math.sqrt(mse)

        mean_y = sum(y_vals) / n
        ss_tot = sum((y - mean_y) ** 2 for y in y_vals)
        ss_res = sum((y - y_hat) ** 2 for y, y_hat in zip(y_vals, preds))
        r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 1e-12 else 1.0
        return mse, rmse, r2


PRESET_DATASETS: dict[str, dict[str, object]] = {
    "study-scores": {
        "id": "study-scores",
        "name": "Study Hours vs Exam Score",
        "xLabel": "Weekly Study Hours",
        "yLabel": "Exam Score (%)",
        "points": [
            {"x": 1.0, "y": 42.0},
            {"x": 2.0, "y": 49.0},
            {"x": 3.0, "y": 54.0},
            {"x": 4.0, "y": 63.0},
            {"x": 5.0, "y": 68.0},
            {"x": 6.0, "y": 74.0},
            {"x": 7.0, "y": 81.0},
            {"x": 8.0, "y": 87.0},
            {"x": 9.0, "y": 91.0},
            {"x": 10.0, "y": 96.0},
        ],
    },
    "compute-latency": {
        "id": "compute-latency",
        "name": "Batch Size vs Inference Time",
        "xLabel": "Batch Size (items)",
        "yLabel": "Latency (ms)",
        "points": [
            {"x": 1.0, "y": 14.5},
            {"x": 2.0, "y": 21.0},
            {"x": 3.5, "y": 29.2},
            {"x": 4.5, "y": 36.8},
            {"x": 6.0, "y": 47.5},
            {"x": 7.5, "y": 55.4},
            {"x": 8.5, "y": 64.1},
            {"x": 9.5, "y": 71.0},
        ],
    },
    "noisy-signal": {
        "id": "noisy-signal",
        "name": "Sensor Calibration Drift",
        "xLabel": "Temperature Index",
        "yLabel": "Voltage Reading",
        "points": [
            {"x": 1.2, "y": 24.0},
            {"x": 2.1, "y": 35.5},
            {"x": 3.4, "y": 38.0},
            {"x": 4.0, "y": 51.0},
            {"x": 5.2, "y": 52.0},
            {"x": 6.3, "y": 66.5},
            {"x": 7.1, "y": 68.0},
            {"x": 8.4, "y": 80.5},
            {"x": 9.2, "y": 84.0},
        ],
    },
}


def train_regression(
    points: list[dict[str, float]],
    method: str = "gradient_descent",
    learning_rate: float = 0.05,
    epochs: int = 250,
) -> dict[str, object]:
    """Train either Gradient Descent or Closed-Form OLS in pure Python and return metrics."""
    if len(points) < 2:
        raise ValueError("Provide at least 2 points to train linear regression.")

    xs = [float(pt["x"]) for pt in points]
    ys = [float(pt["y"]) for pt in points]

    if method == "ols":
        model = LinearRegressionOLS().fit(xs, ys)
        mse, rmse, r2 = model.evaluate(xs, ys)
        loss_history = [{"epoch": 1, "mse": round(mse, 6)}]
        used_epochs = 1
        used_lr = 0.0
    else:
        model = LinearRegressionGD(learning_rate=learning_rate, epochs=epochs).fit(xs, ys)
        mse, rmse, r2 = model.evaluate(xs, ys)
        loss_history = model.loss_history
        used_epochs = epochs
        used_lr = learning_rate

    preds = [
        {"x": round(x, 4), "actual": round(y, 4), "predicted": round(model.predict_one(x), 4)}
        for x, y in zip(xs, ys)
    ]

    sign = "+" if model.intercept >= 0 else "-"
    equation = f"y = {model.slope:.4f}x {sign} {abs(model.intercept):.4f}"

    return {
        "method": method,
        "slope": round(model.slope, 6),
        "intercept": round(model.intercept, 6),
        "mse": round(mse, 6),
        "rmse": round(rmse, 6),
        "r2": round(r2, 6),
        "epochs": used_epochs,
        "learningRate": used_lr,
        "lossHistory": loss_history,
        "predictions": preds,
        "equation": equation,
    }
