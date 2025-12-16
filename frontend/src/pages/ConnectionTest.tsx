import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";

type ConnectionStatus = "idle" | "checking" | "connected" | "error";

function ConnectionTest() {
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const testConnection = async () => {
    setStatus("checking");
    setErrorMessage("");
    try {
      const res = await fetch("/api/test-connection");
      if (res.ok) {
        setStatus("connected");
      } else {
        const data = await res.json();
        setStatus("error");
        setErrorMessage(data.detail || "接続に失敗しました");
      }
    } catch {
      setStatus("error");
      setErrorMessage("APIサーバーに接続できません");
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        接続テスト
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        AS400データベースへの接続をテストします。
      </Typography>

      <Card sx={{ maxWidth: 500 }}>
        <CardContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Button
              variant="contained"
              onClick={testConnection}
              disabled={status === "checking"}
              size="large"
            >
              {status === "checking" ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                  テスト中...
                </>
              ) : (
                "接続テスト実行"
              )}
            </Button>

            {status === "connected" && (
              <Alert icon={<CheckCircleIcon />} severity="success">
                AS400データベースに正常に接続できました。
              </Alert>
            )}

            {status === "error" && (
              <Alert icon={<ErrorIcon />} severity="error">
                {errorMessage}
              </Alert>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default ConnectionTest;
