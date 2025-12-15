import os
from contextlib import asynccontextmanager

import pyodbc
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

# AS400 connection settings
AS400_DSN = os.getenv("AS400_DSN", "")
AS400_USER = os.getenv("AS400_USER", "")
AS400_PASSWORD = os.getenv("AS400_PASSWORD", "")


def get_connection():
    """Create AS400 database connection."""
    connection_string = f"DSN={AS400_DSN};UID={AS400_USER};PWD={AS400_PASSWORD}"
    return pyodbc.connect(connection_string)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown


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
    try:
        conn = get_connection()
        conn.close()
        return {"status": "connected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/tables")
async def get_tables(library: str):
    """Get table list from specified library."""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT TABLE_NAME, TABLE_TYPE
            FROM QSYS2.SYSTABLES
            WHERE TABLE_SCHEMA = ?
            ORDER BY TABLE_NAME
            """,
            (library.upper(),),
        )
        tables = [
            {"table_name": row[0], "table_type": row[1]} for row in cursor.fetchall()
        ]
        cursor.close()
        conn.close()
        return {"library": library.upper(), "tables": tables}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
