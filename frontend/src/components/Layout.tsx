import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Box,
  Container,
  Toolbar,
  Typography,
  Button,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/", label: "ホーム" },
    { path: "/connection", label: "接続テスト" },
    { path: "/tables", label: "テーブル一覧" },
    { path: "/buhin", label: "部品マスタ" },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar position="static">
        <Toolbar>
          <HomeIcon sx={{ mr: 1 }} />
          <Typography
            variant="h6"
            component="div"
            sx={{ cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            AS400 Web App
          </Typography>
          <Box sx={{ ml: 4, display: "flex", gap: 1 }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                color="inherit"
                onClick={() => navigate(item.path)}
                sx={{
                  borderBottom:
                    location.pathname === item.path
                      ? "2px solid white"
                      : "2px solid transparent",
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ flex: 1, py: 4 }}>
        {children}
      </Container>
    </Box>
  );
}

export default Layout;
