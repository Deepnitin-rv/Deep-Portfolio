"""SQLite3 persistence layer managed completely in Python."""

from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DB_PATH = Path(__file__).resolve().parent / "portfolio.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS contact_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                subject TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS regression_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                dataset_name TEXT NOT NULL,
                method TEXT NOT NULL,
                slope REAL NOT NULL,
                intercept REAL NOT NULL,
                mse REAL NOT NULL,
                r2 REAL NOT NULL,
                point_count INTEGER NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


def save_contact_message(name: str, email: str, subject: str, message: str) -> dict[str, Any]:
    created_at = datetime.now(timezone.utc).isoformat()
    with get_connection() as conn:
        cur = conn.execute(
            """
            INSERT INTO contact_messages (name, email, subject, message, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (name.strip(), email.strip(), subject.strip(), message.strip(), created_at),
        )
        conn.commit()
        return {
            "id": cur.lastrowid,
            "name": name.strip(),
            "subject": subject.strip(),
            "createdAt": created_at,
        }


def get_contact_stats() -> dict[str, Any]:
    with get_connection() as conn:
        row = conn.execute("SELECT COUNT(*) AS count FROM contact_messages").fetchone()
        return {"totalInquiries": int(row["count"]) if row else 0}


def log_regression_run(
    dataset_name: str,
    method: str,
    slope: float,
    intercept: float,
    mse: float,
    r2: float,
    point_count: int,
) -> None:
    created_at = datetime.now(timezone.utc).isoformat()
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO regression_runs
                (dataset_name, method, slope, intercept, mse, r2, point_count, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (dataset_name, method, slope, intercept, mse, r2, point_count, created_at),
        )
        conn.commit()


def get_recent_regression_runs(limit: int = 5) -> list[dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT id, dataset_name, method, slope, intercept, mse, r2, point_count, created_at
            FROM regression_runs
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
        return [
            {
                "id": r["id"],
                "datasetName": r["dataset_name"],
                "method": r["method"],
                "slope": r["slope"],
                "intercept": r["intercept"],
                "mse": r["mse"],
                "r2": r["r2"],
                "pointCount": r["point_count"],
                "createdAt": r["created_at"],
            }
            for r in rows
        ]
