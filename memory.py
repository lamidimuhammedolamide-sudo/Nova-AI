
import os
import sqlite3

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_PATH = os.path.join(BASE_DIR, "nova_memory.db")


def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_memory():
    """Create the memory database if it does not exist."""
    with get_connection() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS memories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL DEFAULT 'general',
                content TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)


def save_memory(content, category="general"):
    """Save a useful fact or preference."""
    content = content.strip()
    category = category.strip() or "general"

    if not content or len(content) > 1000:
        return False

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT OR IGNORE INTO memories (category, content)
            VALUES (?, ?)
            """,
            (category[:50], content)
        )
        return cursor.rowcount > 0


def get_memories(limit=30):
    """Return the most recently saved memories."""
    limit = max(1, min(int(limit), 100))

    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, category, content, created_at
            FROM memories
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,)
        ).fetchall()

    return [dict(row) for row in rows]


def search_memories(keyword, limit=10):
    """Search saved memories for a keyword."""
    keyword = keyword.strip()

    if not keyword:
        return []

    limit = max(1, min(int(limit), 50))

    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, category, content, created_at
            FROM memories
            WHERE content LIKE ? ESCAPE '\\'
            ORDER BY id DESC
            LIMIT ?
            """,
            (
                "%" + keyword.replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_") + "%",
                limit
            )
        ).fetchall()

    return [dict(row) for row in rows]


def delete_memory(memory_id):
    """Delete one saved memory by its ID."""
    with get_connection() as connection:
        cursor = connection.execute(
            "DELETE FROM memories WHERE id = ?",
            (int(memory_id),)
        )
        return cursor.rowcount > 0


def clear_memories():
    """Delete every saved memory."""
    with get_connection() as connection:
        connection.execute("DELETE FROM memories")


initialize_memory()

