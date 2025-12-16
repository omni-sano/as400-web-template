import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Typography,
} from "@mui/material";
import SettingsInputComponentIcon from "@mui/icons-material/SettingsInputComponent";
import TableChartIcon from "@mui/icons-material/TableChart";
import InventoryIcon from "@mui/icons-material/Inventory";

const menuItems = [
  {
    path: "/connection",
    title: "接続テスト",
    description: "AS400データベースへの接続をテストします",
    icon: SettingsInputComponentIcon,
  },
  {
    path: "/tables",
    title: "テーブル一覧",
    description: "ライブラリ内のテーブルを表示します",
    icon: TableChartIcon,
  },
  {
    path: "/buhin",
    title: "部品マスタ",
    description: "部品の登録・変更・削除を行います",
    icon: InventoryIcon,
  },
];

function Home() {
  const navigate = useNavigate();

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        ダッシュボード
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        AS400データを操作する機能を選択してください。
      </Typography>
      <Grid container spacing={3}>
        {menuItems.map((item) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.path}>
            <Card>
              <CardActionArea onClick={() => navigate(item.path)}>
                <CardContent sx={{ textAlign: "center", py: 4 }}>
                  <item.icon sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
                  <Typography variant="h6" component="div">
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default Home;
