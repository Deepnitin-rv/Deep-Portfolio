"""Single source of truth for Deepnitin R V's portfolio data, written in pure Python."""

from __future__ import annotations

from typing import Any


PORTFOLIO_DATA: dict[str, Any] = {
    "profile": {
        "name": "Deepnitin R V",
        "headline": "Building intelligent systems from first principles in Python.",
        "role": "B.Tech Computer Science (AI & ML) Student",
        "institution": "Jain University",
        "year": "2nd Year",
        "email": "deepnitinrv@gmail.com",
        "avatarUrl": "/assets/aistudio/WhatsApp_Image_2026-11-19_at_9.19.22_AM_00c6af36.jpeg",
        "resumePdfUrl": "/assets/aistudio/rsd_f3b34301.pdf",
        "resumePreviewUrl": "/api/resume/preview.png",
        "about": (
            "Second-year B.Tech Computer Science (AI & ML) student at Jain University "
            "with a strong interest in programming and artificial intelligence. "
            "Comfortable with Python, C, C++ and Java, and eager to learn new "
            "technologies, build practical projects and grow as a developer."
        ),
    },
    "education": [
        {
            "degree": "B.Tech in Computer Science and Engineering (AI & ML)",
            "institution": "Jain University",
            "status": "Currently in 2nd year",
            "focus": [
                "Artificial Intelligence & Machine Learning Foundations",
                "Data Structures & Algorithms",
                "Systems & Object-Oriented Programming",
            ],
        }
    ],
    "projects": [
        {
            "id": "linear-regression-scratch",
            "title": "Linear Regression Model from Scratch",
            "category": "Machine Learning · Pure Python",
            "summary": (
                "Built a linear regression model from scratch, implementing the core "
                "algorithm myself instead of relying on a ready-made library."
            ),
            "details": [
                "Implemented both Ordinary Least Squares (closed-form analytical solution) and iterative Gradient Descent optimization using only Python standard-library math.",
                "Derived and coded partial derivatives for slope (m) and intercept (b), Mean Squared Error (MSE) loss tracking across epochs, and R-squared evaluation.",
                "Built without NumPy, SciPy, or scikit-learn to master the mathematical mechanics behind supervised regression.",
            ],
            "stack": ["Python 3", "Mathematics", "Gradient Descent", "OLS"],
            "interactive": True,
        }
    ],
    "skills": [
        {
            "name": "Python",
            "group": "Programming Languages",
            "context": "Primary language for AI/ML algorithms from scratch, backend APIs, SQLite persistence, and tooling.",
        },
        {
            "name": "C",
            "group": "Programming Languages",
            "context": "Procedural programming, pointers, memory layout, and foundational algorithmic problem solving.",
        },
        {
            "name": "C++",
            "group": "Programming Languages",
            "context": "Object-oriented design, standard template library, and competitive/structured algorithm practice.",
        },
        {
            "name": "Java",
            "group": "Programming Languages",
            "context": "Strongly typed object-oriented software design and core data structure implementations.",
        },
    ],
    "spokenLanguages": [
        {"name": "Tamil", "proficiency": "Fluent"},
        {"name": "English", "proficiency": "Fluent"},
        {"name": "Hindi", "proficiency": "Fluent"},
    ],
    "architecture": {
        "runtime": "Python 3 Standard Library",
        "storage": "SQLite3 (python/portfolio.db)",
        "mlEngine": "Custom LinearRegressionOLS & LinearRegressionGD",
        "apiServer": "ThreadingHTTPServer",
    },
}


def get_portfolio_payload() -> dict[str, Any]:
    """Return a copy of the complete portfolio payload."""
    return PORTFOLIO_DATA


def format_resume_text() -> str:
    """Render a clean plain-text version of Deepnitin R V's resume in Python."""
    p = PORTFOLIO_DATA["profile"]
    edu = PORTFOLIO_DATA["education"][0]
    proj = PORTFOLIO_DATA["projects"][0]
    skills = ", ".join(s["name"] for s in PORTFOLIO_DATA["skills"])
    langs = "\n".join(f"  - {lang['name']}" for lang in PORTFOLIO_DATA["spokenLanguages"])

    return (
        f"{p['name']}\n"
        f"{p['email']}\n"
        f"{'=' * 48}\n\n"
        f"ABOUT ME\n"
        f"{p['about']}\n\n"
        f"EDUCATION\n"
        f"{edu['degree']}\n"
        f"{edu['institution']} | {edu['status']}\n\n"
        f"PROJECTS\n"
        f"{proj['title']}\n"
        f"{proj['summary']}\n\n"
        f"SKILLS\n"
        f"  - Programming Languages: {skills}\n\n"
        f"LANGUAGES\n"
        f"{langs}\n"
    )
