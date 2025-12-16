import logging
import os
import re
from contextlib import asynccontextmanager
from typing import Optional

import pyodbc
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

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
    conn = pyodbc.connect(AS400_CONNECTION_STRING)
    conn.autocommit = True  # AS400ではジャーナリングなしのテーブルにはautocommitが必要
    return conn


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


# =============================================================================
# 部品マスタ（M@BUHNM）CRUD API
# =============================================================================

BUHIN_LIBRARY = "GOM"
BUHIN_TABLE = "M@BUHNM"


class BuhinCreate(BaseModel):
    """部品登録用モデル"""

    buno: int = Field(..., ge=1, le=99999, description="部品№（1-99999）")
    bunm: str = Field(..., min_length=1, max_length=50, description="部品名")


class BuhinUpdate(BaseModel):
    """部品更新用モデル"""

    bunm: str = Field(..., min_length=1, max_length=50, description="部品名")


class BuhinResponse(BaseModel):
    """部品レスポンスモデル"""

    buno: int
    bunm: str


@app.get("/api/buhin")
async def get_buhin_list(buno: Optional[int] = None):
    """部品一覧を取得"""
    logger.info(f"Fetching buhin list, filter buno: {buno}")
    try:
        conn = get_connection()
        cursor = conn.cursor()
        if buno is not None:
            cursor.execute(
                f"SELECT BUBUNO, BUBUNM FROM {BUHIN_LIBRARY}.{BUHIN_TABLE} WHERE BUBUNO >= ? ORDER BY BUBUNO",
                (buno,),
            )
        else:
            cursor.execute(
                f"SELECT BUBUNO, BUBUNM FROM {BUHIN_LIBRARY}.{BUHIN_TABLE} ORDER BY BUBUNO"
            )
        items = [{"buno": row[0], "bunm": row[1].strip()} for row in cursor.fetchall()]
        cursor.close()
        conn.close()
        logger.info(f"Found {len(items)} buhin items")
        return {"items": items, "count": len(items)}
    except Exception as e:
        logger.error(f"Failed to fetch buhin list: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/buhin/{buno}")
async def get_buhin(buno: int):
    """部品詳細を取得"""
    logger.info(f"Fetching buhin: {buno}")
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            f"SELECT BUBUNO, BUBUNM FROM {BUHIN_LIBRARY}.{BUHIN_TABLE} WHERE BUBUNO = ?",
            (buno,),
        )
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        if row is None:
            raise HTTPException(status_code=404, detail="部品が見つかりません")
        return {"buno": row[0], "bunm": row[1].strip()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch buhin {buno}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/buhin", status_code=201)
async def create_buhin(buhin: BuhinCreate):
    """部品を登録"""
    logger.info(f"Creating buhin: {buhin.buno}")
    try:
        conn = get_connection()
        cursor = conn.cursor()
        # 重複チェック
        cursor.execute(
            f"SELECT BUBUNO FROM {BUHIN_LIBRARY}.{BUHIN_TABLE} WHERE BUBUNO = ?",
            (buhin.buno,),
        )
        if cursor.fetchone() is not None:
            cursor.close()
            conn.close()
            raise HTTPException(status_code=409, detail="この部品№は既に登録されています")
        # 登録
        cursor.execute(
            f"INSERT INTO {BUHIN_LIBRARY}.{BUHIN_TABLE} (BUBUNO, BUBUNM) VALUES (?, ?)",
            (buhin.buno, buhin.bunm),
        )
        conn.commit()
        cursor.close()
        conn.close()
        logger.info(f"Created buhin: {buhin.buno}")
        return {"buno": buhin.buno, "bunm": buhin.bunm}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create buhin: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/buhin/{buno}")
async def update_buhin(buno: int, buhin: BuhinUpdate):
    """部品を更新"""
    logger.info(f"Updating buhin: {buno}")
    try:
        conn = get_connection()
        cursor = conn.cursor()
        # 存在チェック
        cursor.execute(
            f"SELECT BUBUNO FROM {BUHIN_LIBRARY}.{BUHIN_TABLE} WHERE BUBUNO = ?",
            (buno,),
        )
        if cursor.fetchone() is None:
            cursor.close()
            conn.close()
            raise HTTPException(status_code=404, detail="部品が見つかりません")
        # 更新
        cursor.execute(
            f"UPDATE {BUHIN_LIBRARY}.{BUHIN_TABLE} SET BUBUNM = ? WHERE BUBUNO = ?",
            (buhin.bunm, buno),
        )
        conn.commit()
        cursor.close()
        conn.close()
        logger.info(f"Updated buhin: {buno}")
        return {"buno": buno, "bunm": buhin.bunm}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update buhin {buno}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/buhin/{buno}", status_code=204)
async def delete_buhin(buno: int):
    """部品を削除"""
    logger.info(f"Deleting buhin: {buno}")
    try:
        conn = get_connection()
        cursor = conn.cursor()
        # 存在チェック
        cursor.execute(
            f"SELECT BUBUNO FROM {BUHIN_LIBRARY}.{BUHIN_TABLE} WHERE BUBUNO = ?",
            (buno,),
        )
        if cursor.fetchone() is None:
            cursor.close()
            conn.close()
            raise HTTPException(status_code=404, detail="部品が見つかりません")
        # 削除
        cursor.execute(
            f"DELETE FROM {BUHIN_LIBRARY}.{BUHIN_TABLE} WHERE BUBUNO = ?",
            (buno,),
        )
        conn.commit()
        cursor.close()
        conn.close()
        logger.info(f"Deleted buhin: {buno}")
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete buhin {buno}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
