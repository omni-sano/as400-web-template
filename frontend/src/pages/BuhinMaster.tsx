import { useState, useEffect, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";

interface Buhin {
  buno: number;
  bunm: string;
}

interface FormData {
  buno: string;
  bunm: string;
}

type DialogMode = "create" | "edit" | null;

function BuhinMaster() {
  const [items, setItems] = useState<Buhin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [searchBuno, setSearchBuno] = useState<string>("");

  // Dialog state
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [formData, setFormData] = useState<FormData>({ buno: "", bunm: "" });
  const [formError, setFormError] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Buhin | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = searchBuno ? `?buno=${encodeURIComponent(searchBuno)}` : "";
      const res = await fetch(`/api/buhin${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
      } else {
        const data = await res.json();
        setError(data.detail || "データの取得に失敗しました");
      }
    } catch {
      setError("APIサーバーに接続できません");
    } finally {
      setLoading(false);
    }
  }, [searchBuno]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSearch = () => {
    fetchItems();
  };

  const openCreateDialog = () => {
    setFormData({ buno: "", bunm: "" });
    setFormError("");
    setDialogMode("create");
  };

  const openEditDialog = (buhin: Buhin) => {
    setFormData({ buno: String(buhin.buno), bunm: buhin.bunm });
    setFormError("");
    setDialogMode("edit");
  };

  const closeDialog = () => {
    setDialogMode(null);
    setFormData({ buno: "", bunm: "" });
    setFormError("");
  };

  const handleSave = async () => {
    setFormError("");

    // Validation
    if (dialogMode === "create" && !formData.buno) {
      setFormError("部品№を入力してください");
      return;
    }
    if (!formData.bunm.trim()) {
      setFormError("部品名を入力してください");
      return;
    }

    setSaving(true);
    try {
      const isCreate = dialogMode === "create";
      const url = isCreate ? "/api/buhin" : `/api/buhin/${formData.buno}`;
      const method = isCreate ? "POST" : "PUT";
      const body = isCreate
        ? { buno: Number(formData.buno), bunm: formData.bunm.trim() }
        : { bunm: formData.bunm.trim() };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSnackbar({
          open: true,
          message: isCreate ? "登録しました" : "更新しました",
          severity: "success",
        });
        closeDialog();
        fetchItems();
      } else {
        const data = await res.json();
        setFormError(data.detail || "保存に失敗しました");
      }
    } catch {
      setFormError("APIサーバーに接続できません");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirm = (buhin: Buhin) => {
    setDeleteTarget(buhin);
  };

  const closeDeleteConfirm = () => {
    setDeleteTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/buhin/${deleteTarget.buno}`, {
        method: "DELETE",
      });

      if (res.ok || res.status === 204) {
        setSnackbar({
          open: true,
          message: "削除しました",
          severity: "success",
        });
        closeDeleteConfirm();
        fetchItems();
      } else {
        const data = await res.json();
        setSnackbar({
          open: true,
          message: data.detail || "削除に失敗しました",
          severity: "error",
        });
      }
    } catch {
      setSnackbar({
        open: true,
        message: "APIサーバーに接続できません",
        severity: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        部品マスタ
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        部品の登録・変更・削除を行います。
      </Typography>

      {/* 検索・登録エリア */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <TextField
              label="部品№（以上）"
              placeholder="例: 10"
              value={searchBuno}
              onChange={(e) => setSearchBuno(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              size="small"
              type="number"
              sx={{ width: 150 }}
            />
            <Button
              variant="outlined"
              onClick={handleSearch}
              disabled={loading}
              startIcon={<SearchIcon />}
            >
              検索
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="contained"
              onClick={openCreateDialog}
              startIcon={<AddIcon />}
            >
              新規登録
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* ローディング */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* データなし */}
      {!loading && !error && items.length === 0 && (
        <Alert severity="info">データがありません。</Alert>
      )}

      {/* データ一覧 */}
      {!loading && items.length > 0 && (
        <TableContainer component={Card}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 120 }}>
                  <strong>部品№</strong>
                </TableCell>
                <TableCell>
                  <strong>部品名</strong>
                </TableCell>
                <TableCell sx={{ width: 120 }} align="center">
                  <strong>操作</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.buno} hover>
                  <TableCell>{item.buno}</TableCell>
                  <TableCell>{item.bunm}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => openEditDialog(item)}
                      title="編集"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => openDeleteConfirm(item)}
                      title="削除"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 登録・編集ダイアログ */}
      <Dialog open={dialogMode !== null} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === "create" ? "部品マスタ - 登録" : "部品マスタ - 編集"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="部品№"
              value={formData.buno}
              onChange={(e) => setFormData({ ...formData, buno: e.target.value })}
              type="number"
              disabled={dialogMode === "edit"}
              required
              fullWidth
              inputProps={{ min: 1, max: 99999 }}
            />
            <TextField
              label="部品名"
              value={formData.bunm}
              onChange={(e) => setFormData({ ...formData, bunm: e.target.value })}
              required
              fullWidth
              inputProps={{ maxLength: 50 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={saving}>
            キャンセル
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} /> : dialogMode === "create" ? "登録" : "更新"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteTarget !== null} onClose={closeDeleteConfirm}>
        <DialogTitle>削除確認</DialogTitle>
        <DialogContent>
          <DialogContentText>
            以下の部品を削除してもよろしいですか？
            <br />
            <br />
            <strong>部品№:</strong> {deleteTarget?.buno}
            <br />
            <strong>部品名:</strong> {deleteTarget?.bunm}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteConfirm} disabled={deleting}>
            キャンセル
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : "削除"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default BuhinMaster;
