"""AST-validated Python 3 sandbox for running Deepnitin's portfolio & ML snippets."""

from __future__ import annotations

import ast
import os
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

ALLOWED_IMPORTS = {
    "math",
    "statistics",
    "json",
    "random",
    "linear_regression",
    "portfolio_data",
}

FORBIDDEN_CALLS = {
    "open",
    "eval",
    "exec",
    "compile",
    "__import__",
    "getattr",
    "setattr",
    "delattr",
    "globals",
    "locals",
    "vars",
    "input",
    "breakpoint",
}

FORBIDDEN_ATTRS = {
    "__class__",
    "__bases__",
    "__subclasses__",
    "__globals__",
    "__builtins__",
    "__code__",
    "__import__",
}

PYTHON_DIR = str(Path(__file__).resolve().parent)


def _validate_ast(code: str) -> None:
    if len(code) > 4000:
        raise ValueError("Snippet exceeds 4,000 character limit.")

    tree = ast.parse(code, mode="exec")
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                root = alias.name.split(".")[0]
                if root not in ALLOWED_IMPORTS:
                    raise ValueError(
                        f"Import '{alias.name}' is not allowed in the portfolio sandbox. "
                        f"Allowed: {', '.join(sorted(ALLOWED_IMPORTS))}."
                    )
        elif isinstance(node, ast.ImportFrom):
            mod = (node.module or "").split(".")[0]
            if mod not in ALLOWED_IMPORTS:
                raise ValueError(
                    f"Import from '{node.module}' is not allowed in the portfolio sandbox."
                )
        elif isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
            if node.func.id in FORBIDDEN_CALLS:
                raise ValueError(f"Built-in call '{node.func.id}()' is restricted in the sandbox.")
        elif isinstance(node, ast.Attribute):
            if node.attr in FORBIDDEN_ATTRS:
                raise ValueError(f"Attribute '{node.attr}' is restricted in the sandbox.")


def execute_python_snippet(code: str) -> dict[str, Any]:
    """Validate AST and execute pure Python code in an isolated Python subprocess."""
    try:
        _validate_ast(code)
    except SyntaxError as exc:
        return {
            "ok": False,
            "stdout": "",
            "stderr": f"SyntaxError on line {exc.lineno}: {exc.msg}",
            "durationMs": 0.0,
        }
    except ValueError as exc:
        return {
            "ok": False,
            "stdout": "",
            "stderr": str(exc),
            "durationMs": 0.0,
        }

    env = {
        "PATH": os.environ.get("PATH", "/usr/bin:/bin"),
        "PYTHONPATH": PYTHON_DIR,
        "PYTHONDONTWRITEBYTECODE": "1",
    }

    started = time.perf_counter()
    try:
        proc = subprocess.run(
            [sys.executable, "-c", code],
            capture_output=True,
            text=True,
            timeout=2.5,
            cwd=PYTHON_DIR,
            env=env,
        )
        duration_ms = round((time.perf_counter() - started) * 1000.0, 2)
        return {
            "ok": proc.returncode == 0,
            "stdout": proc.stdout[:8000],
            "stderr": proc.stderr[:4000],
            "durationMs": duration_ms,
        }
    except subprocess.TimeoutExpired:
        duration_ms = round((time.perf_counter() - started) * 1000.0, 2)
        return {
            "ok": False,
            "stdout": "",
            "stderr": "Execution timed out after 2.5 seconds.",
            "durationMs": duration_ms,
        }
