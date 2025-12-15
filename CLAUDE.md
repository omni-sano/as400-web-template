# Claude Code 開発ガイド

このプロジェクトはas400-mcpと連携してClaude Codeで開発することを想定しています。

## プロジェクト構成

- `backend/`: FastAPI + pyodbc（Python仮想環境使用）
- `frontend/`: React + TypeScript（Vite）

## 開発フロー

### 1. AS400のテーブル情報を取得

as400-mcpのツールを使ってテーブル構造を確認:

```
# ライブラリ内のテーブル一覧
list_tables でライブラリ名を指定

# テーブルのカラム情報
describe_table でテーブル名を指定

# サンプルデータ確認
execute_query でSELECT文を実行
```

### 2. バックエンドAPIの生成

取得したテーブル情報を元に、`backend/`に以下を作成:

- Pydanticモデル（テーブル構造に対応）
- CRUDエンドポイント（GET/POST/PUT/DELETE）
- SQLクエリ（pyodbcで実行）

### 3. フロントエンド画面の生成

APIに対応するReactコンポーネントを`frontend/src/`に作成:

- 一覧画面（テーブル表示）
- 詳細/編集画面（フォーム）
- API呼び出しフック

## コマンド

### Backend

```bash
cd backend
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm run dev
```

## 注意事項

- AS400のテーブル名・カラム名は大文字で扱う
- 文字コードはEBCDIC→UTF-8変換に注意
- 接続情報は`.env`で管理（.gitignoreに追加済み前提）
