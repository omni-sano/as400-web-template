import { useState } from "react";

type ConnectionStatus = "idle" | "checking" | "connected" | "error";

interface TableInfo {
  table_name: string;
  table_type: string;
}

function Home() {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("idle");
  const [connectionError, setConnectionError] = useState<string>("");

  const [library, setLibrary] = useState<string>("");
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [tablesError, setTablesError] = useState<string>("");

  const testConnection = async () => {
    setConnectionStatus("checking");
    setConnectionError("");
    try {
      const res = await fetch("/api/test-connection");
      if (res.ok) {
        setConnectionStatus("connected");
      } else {
        const data = await res.json();
        setConnectionStatus("error");
        setConnectionError(data.detail || "Connection failed");
      }
    } catch {
      setConnectionStatus("error");
      setConnectionError("Failed to connect to API server");
    }
  };

  const fetchTables = async () => {
    if (!library.trim()) return;
    setTablesLoading(true);
    setTablesError("");
    setTables([]);
    try {
      const res = await fetch(
        `/api/tables?library=${encodeURIComponent(library.trim())}`
      );
      if (res.ok) {
        const data = await res.json();
        setTables(data.tables);
      } else {
        const data = await res.json();
        setTablesError(data.detail || "Failed to fetch tables");
      }
    } catch {
      setTablesError("Failed to connect to API server");
    } finally {
      setTablesLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: 800 }}>
      <h1>AS400 Web App</h1>

      {/* Connection Test Section */}
      <section style={{ marginBottom: "2rem" }}>
        <h2>Connection Test</h2>
        <button onClick={testConnection} disabled={connectionStatus === "checking"}>
          {connectionStatus === "checking" ? "Checking..." : "Test Connection"}
        </button>
        <div style={{ marginTop: "0.5rem" }}>
          {connectionStatus === "connected" && (
            <span style={{ color: "green" }}>Connected</span>
          )}
          {connectionStatus === "error" && (
            <span style={{ color: "red" }}>Error: {connectionError}</span>
          )}
        </div>
      </section>

      {/* Table List Section */}
      <section>
        <h2>Table List</h2>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <input
            type="text"
            placeholder="Library name (e.g. QIWS)"
            value={library}
            onChange={(e) => setLibrary(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchTables()}
            style={{ padding: "0.5rem", width: 200 }}
          />
          <button onClick={fetchTables} disabled={tablesLoading || !library.trim()}>
            {tablesLoading ? "Loading..." : "Get Tables"}
          </button>
        </div>
        {tablesError && <p style={{ color: "red" }}>{tablesError}</p>}
        {tables.length > 0 && (
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #333" }}>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Table Name</th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>Type</th>
              </tr>
            </thead>
            <tbody>
              {tables.map((t) => (
                <tr key={t.table_name} style={{ borderBottom: "1px solid #ccc" }}>
                  <td style={{ padding: "0.5rem" }}>{t.table_name}</td>
                  <td style={{ padding: "0.5rem" }}>{t.table_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default Home;
