# AS400 Web Template

AS400/IBM iのデータを使ったWebアプリケーション開発用テンプレート。

## 構成

```
as400-web-template/
├── backend/          # FastAPI + pyodbc
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example  # 環境変数サンプル
├── frontend/         # React + TypeScript (Vite)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── CLAUDE.md         # Claude Code用の指示
└── README.md
```

## セットアップ

### 前提条件

- Python 3.11+
- Node.js 20+
- IBM i Access ODBC Driver
- AS400への接続情報

### Backend

```bash
cd backend
cp .env.example .env
```

`.env`を編集してAS400の接続情報を設定:

```
AS400_CONNECTION_STRING=DRIVER={IBM i Access ODBC Driver};SYSTEM=YOUR_HOST;UID=YOUR_USER;PWD=YOUR_PASSWORD;CCSID=1208;EXTCOLINFO=1
```

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload
```

API: http://localhost:8000

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

## Claude Codeでの開発

### MCPサーバーの設定

[as400-mcp](https://github.com/your-repo/as400-mcp)をセットアップ後、プロジェクトルートに`.mcp.json`を作成:

```bash
cp .mcp.json.example .mcp.json
```

`.mcp.json`を編集してAS400の接続情報を設定。`command`はas400-mcpのvenv内Pythonパスを指定:

**Windows:**
```json
{
  "mcpServers": {
    "as400": {
      "command": "C:/path/to/as400-mcp/.venv/Scripts/python.exe",
      "args": ["-m", "as400_mcp.server"],
      "env": {
        "AS400_CONNECTION_STRING": "DRIVER={IBM i Access ODBC Driver};SYSTEM=YOUR_HOST;UID=YOUR_USER;PWD=YOUR_PASSWORD;CCSID=1208;EXTCOLINFO=1"
      }
    }
  }
}
```

**macOS / Linux:**
```json
{
  "mcpServers": {
    "as400": {
      "command": "/path/to/as400-mcp/.venv/bin/python",
      "args": ["-m", "as400_mcp.server"],
      "env": {
        "AS400_CONNECTION_STRING": "DRIVER={IBM i Access ODBC Driver};SYSTEM=YOUR_HOST;UID=YOUR_USER;PWD=YOUR_PASSWORD;CCSID=1208;EXTCOLINFO=1"
      }
    }
  }
}
```

### 開発の流れ

Claude Codeでこのプロジェクトを開くと、as400-mcpを通じてAS400のテーブル情報を取得し、Web画面を自動生成できます。

詳細は[CLAUDE.md](./CLAUDE.md)を参照。
