import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

interface TableInfo {
  table_name: string;
  table_type: string;
  table_text: string;
}

function Tables() {
  const [library, setLibrary] = useState<string>("");
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [searched, setSearched] = useState(false);

  const fetchTables = async () => {
    if (!library.trim()) return;
    setLoading(true);
    setError("");
    setTables([]);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/tables?library=${encodeURIComponent(library.trim())}`
      );
      if (res.ok) {
        const data = await res.json();
        setTables(data.tables);
      } else {
        const data = await res.json();
        setError(data.detail || "テーブル一覧の取得に失敗しました");
      }
    } catch {
      setError("APIサーバーに接続できません");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        テーブル一覧
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        ライブラリ名を入力してテーブルを表示します。
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
            <TextField
              label="ライブラリ名"
              placeholder="例: QIWS"
              value={library}
              onChange={(e) => setLibrary(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchTables()}
              size="small"
              sx={{ width: 250 }}
            />
            <Button
              variant="contained"
              onClick={fetchTables}
              disabled={loading || !library.trim()}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                  取得中...
                </>
              ) : (
                "取得"
              )}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {searched && !loading && !error && tables.length === 0 && (
        <Alert severity="info">指定されたライブラリにテーブルが見つかりませんでした。</Alert>
      )}

      {tables.length > 0 && (
        <TableContainer component={Card}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>テーブル名</strong>
                </TableCell>
                <TableCell>
                  <strong>タイプ</strong>
                </TableCell>
                <TableCell>
                  <strong>ラベル</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tables.map((t) => (
                <TableRow key={t.table_name} hover>
                  <TableCell>{t.table_name}</TableCell>
                  <TableCell>{t.table_type}</TableCell>
                  <TableCell>{t.table_text}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default Tables;
