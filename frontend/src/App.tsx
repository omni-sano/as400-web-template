import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import ConnectionTest from "./pages/ConnectionTest";
import Tables from "./pages/Tables";
import BuhinMaster from "./pages/BuhinMaster";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/connection" element={<ConnectionTest />} />
            <Route path="/tables" element={<Tables />} />
            <Route path="/buhin" element={<BuhinMaster />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
