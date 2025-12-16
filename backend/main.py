import logging
import os
import re
from contextlib import asynccontextmanager

import pyodbc
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# AS400 connection settings
AS400_CONNECTION_STRING = os.getenv("AS400_CONNECTION_STRING", "")


def mask_connection_string(conn_str: str) -> str:
    """Mask password in connection string for logging."""
    return re.sub(r"(PWD=)[^;]*", r"\1****", conn_str, flags=re.IGNORECASE)


# Log connection string on startup (masked)
logger.info(f"AS400_CONNECTION_STRING: {mask_connection_string(AS400_CONNECTION_STRING)}")


def get_connection():
    """Create AS400 database connection."""
    return pyodbc.connect(AS400_CONNECTION_STRING)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting AS400 Web API server...")
    logger.info(f"Connection string configured: {bool(AS400_CONNECTION_STRING)}")
    yield
    # Shutdown
    logger.info("Shutting down AS400 Web API server...")


app = FastAPI(
    title="AS400 Web API",
    description="API for AS400/IBM i data access",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "AS400 Web API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/api/test-connection")
async def test_connection():
    """Test AS400 database connection."""
    logger.info("Testing connection...")
    logger.info(f"Connection string: {mask_connection_string(AS400_CONNECTION_STRING)}")
    if not AS400_CONNECTION_STRING:
        logger.error("AS400_CONNECTION_STRING is empty!")
        raise HTTPException(status_code=500, detail="AS400_CONNECTION_STRING is not set")
    try:
        conn = get_connection()
        conn.close()
        logger.info("Connection successful")
        return {"status": "connected"}
    except Exception as e:
        logger.error(f"Connection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/tables")
async def get_tables(library: str):
    """Get table list from specified library."""
    logger.info(f"Fetching tables for library: {library.upper()}")
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT TABLE_NAME, TABLE_TYPE, TABLE_TEXT
            FROM QSYS2.SYSTABLES
            WHERE TABLE_SCHEMA = ?
            ORDER BY TABLE_NAME
            """,
            (library.upper(),),
        )
        tables = [
            {"table_name": row[0], "table_type": row[1], "table_text": row[2] or ""}
            for row in cursor.fetchall()
        ]
        cursor.close()
        conn.close()
        logger.info(f"Found {len(tables)} tables in library {library.upper()}")
        return {"library": library.upper(), "tables": tables}
    except Exception as e:
        logger.error(f"Failed to fetch tables from {library.upper()}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
