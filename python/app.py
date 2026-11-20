"""Pure Python 3.11 HTTP backend powering Deepnitin R V's portfolio application."""

from __future__ import annotations

import argparse
import json
import mimetypes
import platform
import subprocess
import sys
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

PYTHON_DIR = Path(__file__).resolve().parent
ROOT_DIR = PYTHON_DIR.parent
DIST_DIR = ROOT_DIR / "dist"
CACHE_DIR = PYTHON_DIR / "cache"
RESUME_PDF_PATH = ROOT_DIR / "public" / "assets" / "aistudio" / "rsd_f3b34301.pdf"

if str(PYTHON_DIR) not in sys.path:
    sys.path.insert(0, str(PYTHON_DIR))

import database  # noqa: E402
import linear_regression  # noqa: E402
import portfolio_data  # noqa: E402
import sandbox  # noqa: E402


DEFAULT_SNIPPETS = [
    {
        "id": "ols-fit",
        "title": "Train OLS & Predict",
        "code": (
            "from linear_regression import LinearRegressionOLS\n\n"
            "study_hours = [1, 2, 3, 4, 5, 6, 7, 8]\n"
            "exam_scores = [42, 49, 54, 63, 68, 74, 81, 87]\n\n"
            "model = LinearRegressionOLS().fit(study_hours, exam_scores)\n"
            "mse, rmse, r2 = model.evaluate(study_hours, exam_scores)\n\n"
            "print(f'Equation: y = {model.slope:.4f}x + {model.intercept:.4f}')\n"
            "print(f'MSE: {mse:.4f} | RMSE: {rmse:.4f} | R^2: {r2:.4f}')\n"
            "print(f'Prediction for 9.5 study hours: {model.predict_one(9.5):.2f}%')\n"
        ),
    },
    {
        "id": "gd-epochs",
        "title": "Gradient Descent Convergence",
        "code": (
            "from linear_regression import LinearRegressionGD\n\n"
            "x = [1, 2, 3, 4, 5, 6]\n"
            "y = [15, 22, 29, 37, 44, 51]\n\n"
            "gd = LinearRegressionGD(learning_rate=0.08, epochs=200).fit(x, y)\n"
            "mse, rmse, r2 = gd.evaluate(x, y)\n\n"
            "print(f'Slope: {gd.slope:.4f}, Intercept: {gd.intercept:.4f}')\n"
            "print(f'Initial MSE: {gd.loss_history[0][\"mse\"]:.4f}')\n"
            "print(f'Final MSE:   {gd.loss_history[-1][\"mse\"]:.4f}')\n"
            "print(f'R^2 Score:   {r2:.6f}')\n"
        ),
    },
    {
        "id": "resume-inspect",
        "title": "Inspect Portfolio Data",
        "code": (
            "from portfolio_data import get_portfolio_payload\n\n"
            "data = get_portfolio_payload()\n"
            "profile = data['profile']\n"
            "skills = [s['name'] for s in data['skills']]\n"
            "langs = [l['name'] for l in data['spokenLanguages']]\n\n"
            "print(f\"{profile['name']} — {profile['role']}\")\n"
            "print(f\"University: {profile['institution']} ({profile['year']})\")\n"
            "print(f\"Programming: {', '.join(skills)}\")\n"
            "print(f\"Languages:   {', '.join(langs)}\")\n"
        ),
    },
]


class PortfolioHandler(BaseHTTPRequestHandler):
    server_version = "DeepnitinPythonEngine/3.11"

    def log_message(self, format: str, *args: Any) -> None:
        # Keep stdout clean for structured startup logs
        sys.stderr.write(f"[python] {self.address_string()} - {format % args}\n")

    def _send_json(self, payload: Any, status: int = HTTPStatus.OK) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _send_text(self, text: str, content_type: str = "text/plain; charset=utf-8", filename: str | None = None) -> None:
        body = text.encode("utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        if filename:
            self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.end_headers()
        self.wfile.write(body)

    def _read_json_body(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0 or length > 1_000_000:
            raise ValueError("Invalid request body size.")
        raw = self.rfile.read(length)
        data = json.loads(raw.decode("utf-8"))
        if not isinstance(data, dict):
            raise ValueError("JSON body must be an object.")
        return data

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/health":
            self._send_json(
                {
                    "status": "ok",
                    "engine": "Python",
                    "pythonVersion": platform.python_version(),
                    "sqlite": True,
                }
            )
            return

        if path == "/api/portfolio":
            payload = portfolio_data.get_portfolio_payload()
            payload["pythonVersion"] = platform.python_version()
            payload["stats"] = database.get_contact_stats()
            payload["recentRuns"] = database.get_recent_regression_runs(5)
            payload["presets"] = list(linear_regression.PRESET_DATASETS.values())
            payload["snippets"] = DEFAULT_SNIPPETS
            self._send_json(payload)
            return

        if path == "/api/source":
            source_files = []
            for fname in ["linear_regression.py", "portfolio_data.py", "database.py", "app.py"]:
                fpath = PYTHON_DIR / fname
                if fpath.exists():
                    source_files.append(
                        {
                            "filename": f"python/{fname}",
                            "name": fname,
                            "lines": len(fpath.read_text(encoding="utf-8").splitlines()),
                            "code": fpath.read_text(encoding="utf-8"),
                        }
                    )
            self._send_json({"files": source_files})
            return

        if path == "/api/regression/presets":
            self._send_json({"presets": list(linear_regression.PRESET_DATASETS.values())})
            return

        if path == "/api/regression/runs":
            self._send_json({"runs": database.get_recent_regression_runs(10)})
            return

        if path == "/api/resume.txt":
            self._send_text(
                portfolio_data.format_resume_text(),
                content_type="text/plain; charset=utf-8",
                filename="Deepnitin_R_V_Resume.txt",
            )
            return

        if path == "/api/resume.json":
            self._send_text(
                json.dumps(portfolio_data.get_portfolio_payload(), indent=2),
                content_type="application/json; charset=utf-8",
                filename="Deepnitin_R_V_Resume.json",
            )
            return

        if path == "/api/resume.pdf":
            if not RESUME_PDF_PATH.exists():
                self._send_json({"error": "Resume PDF not found"}, status=HTTPStatus.NOT_FOUND)
                return
            data = RESUME_PDF_PATH.read_bytes()
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "application/pdf")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Content-Disposition", 'attachment; filename="Deepnitin_R_V_Resume.pdf"')
            self.end_headers()
            self.wfile.write(data)
            return

        if path == "/api/resume/preview.png":
            if not RESUME_PDF_PATH.exists():
                self._send_json({"error": "Resume PDF not found"}, status=HTTPStatus.NOT_FOUND)
                return
            CACHE_DIR.mkdir(parents=True, exist_ok=True)
            preview_path = CACHE_DIR / "resume_page_1.png"
            if not preview_path.exists():
                try:
                    subprocess.run(
                        [
                            "gs",
                            "-dSAFER",
                            "-dBATCH",
                            "-dNOPAUSE",
                            "-sDEVICE=png16m",
                            "-r200",
                            f"-sOutputFile={preview_path}",
                            str(RESUME_PDF_PATH),
                        ],
                        check=True,
                        capture_output=True,
                        timeout=15,
                    )
                except Exception as exc:
                    self._send_json(
                        {"error": f"Unable to render PDF preview: {exc}"},
                        status=HTTPStatus.INTERNAL_SERVER_ERROR,
                    )
                    return

            data = preview_path.read_bytes()
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "image/png")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "public, max-age=3600")
            self.end_headers()
            self.wfile.write(data)
            return

        # Standalone static serving when dist/ is built and app.py is run directly
        if DIST_DIR.exists() and not path.startswith("/api/"):
            rel = path.lstrip("/") or "index.html"
            candidate = (DIST_DIR / rel).resolve()
            if str(candidate).startswith(str(DIST_DIR.resolve())) and candidate.is_file():
                ctype, _ = mimetypes.guess_type(str(candidate))
                data = candidate.read_bytes()
                self.send_response(HTTPStatus.OK)
                self.send_header("Content-Type", ctype or "application/octet-stream")
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
                return

            index_file = DIST_DIR / "index.html"
            if index_file.is_file():
                data = index_file.read_bytes()
                self.send_response(HTTPStatus.OK)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
                return

        self._send_json({"error": "Not found"}, status=HTTPStatus.NOT_FOUND)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path

        try:
            body = self._read_json_body()
        except Exception as exc:
            self._send_json({"error": str(exc)}, status=HTTPStatus.BAD_REQUEST)
            return

        if path == "/api/regression/train":
            try:
                points = body.get("points", [])
                method = str(body.get("method", "gradient_descent"))
                learning_rate = float(body.get("learningRate", 0.05))
                epochs = int(body.get("epochs", 250))
                dataset_name = str(body.get("datasetName", "Custom Dataset"))[:80]

                result = linear_regression.train_regression(
                    points=points,
                    method=method,
                    learning_rate=learning_rate,
                    epochs=epochs,
                )
                database.log_regression_run(
                    dataset_name=dataset_name,
                    method=method,
                    slope=float(result["slope"]),
                    intercept=float(result["intercept"]),
                    mse=float(result["mse"]),
                    r2=float(result["r2"]),
                    point_count=len(points),
                )
                result["recentRuns"] = database.get_recent_regression_runs(5)
                self._send_json(result)
            except Exception as exc:
                self._send_json({"error": str(exc)}, status=HTTPStatus.BAD_REQUEST)
            return

        if path == "/api/regression/predict":
            try:
                slope = float(body["slope"])
                intercept = float(body["intercept"])
                x = float(body["x"])
                self._send_json({"x": x, "predictedY": round(slope * x + intercept, 4)})
            except Exception as exc:
                self._send_json({"error": str(exc)}, status=HTTPStatus.BAD_REQUEST)
            return

        if path == "/api/python/run":
            code = str(body.get("code", ""))
            result = sandbox.execute_python_snippet(code)
            self._send_json(result)
            return

        if path == "/api/contact":
            name = str(body.get("name", "")).strip()
            email = str(body.get("email", "")).strip()
            subject = str(body.get("subject", "")).strip() or "Portfolio Inquiry"
            message = str(body.get("message", "")).strip()

            if len(name) < 2 or "@" not in email or len(message) < 5:
                self._send_json(
                    {"error": "Please provide your name, a valid email, and a message (at least 5 characters)."},
                    status=HTTPStatus.BAD_REQUEST,
                )
                return

            saved = database.save_contact_message(name, email, subject, message)
            self._send_json(
                {
                    "ok": True,
                    "inquiry": saved,
                    "stats": database.get_contact_stats(),
                },
                status=HTTPStatus.CREATED,
            )
            return

        self._send_json({"error": "Not found"}, status=HTTPStatus.NOT_FOUND)


def main() -> None:
    parser = argparse.ArgumentParser(description="Deepnitin R V Python Portfolio Server")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()

    database.init_db()
    server = ThreadingHTTPServer((args.host, args.port), PortfolioHandler)
    print(f"Python portfolio backend listening on http://{args.host}:{args.port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()


if __name__ == "__main__":
    main()
