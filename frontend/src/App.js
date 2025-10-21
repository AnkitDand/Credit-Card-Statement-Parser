import React, { useState, useEffect, useCallback } from "react";
import Papa from "papaparse";
import Dashboard from "./components/Dashboard";
import "./App.css";

function App() {
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to clean and normalize data
  const cleanData = useCallback((data) => {
    return data
      .map((row) => ({
        ...row,
        Name: (row.Name || "").replace(/\s*Email\s*/gi, "").trim() || "N/A",
        Email: (row.Email || "").trim() || "N/A",
        Address: (row.Address || "").trim() || "N/A",
        "Statement Date": (row["Statement Date"] || "").trim() || "N/A",
        "Card Last 4 Digits": (row["Card Last 4 Digits"] || "").trim() || "N/A",
        "Payment Due Date": (row["Payment Due Date"] || "").trim() || "N/A",
        "Total Dues": (row["Total Dues"] || "0.00").trim(),
        "Minimum Amount Due": (row["Minimum Amount Due"] || "0.00").trim(),
        "Credit Limit": (row["Credit Limit"] || "0").trim(),
        "Available Credit Limit": (row["Available Credit Limit"] || "0").trim(),
        "File Name": row["File Name"] || "Unknown",
      }))
      .filter((row) => row["File Name"] !== "Unknown");
  }, []);

  // Function to trigger backend parsing and fetch CSV
  const loadBackendCSV = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Call /parse to generate CSV
      const parseResponse = await fetch("http://localhost:5000/parse");
      const parseData = await parseResponse.json();

      if (parseResponse.ok) {
        console.log("✅ Backend CSV generated:", parseData.csv_file);
      } else {
        throw new Error(parseData.error || "Failed to generate CSV");
      }

      // Step 2: Fetch the CSV
      const csvResponse = await fetch(
        "http://localhost:5000/parsed_credit_statements.csv"
      );
      if (!csvResponse.ok) throw new Error("Failed to fetch CSV from backend");

      const csvText = await csvResponse.text();
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const cleanedData = cleanData(results.data);
          if (cleanedData.length === 0) {
            setError("No valid data found in CSV.");
          } else {
            setStatements(cleanedData);
            console.log(
              `✅ Loaded ${cleanedData.length} statements from backend CSV`
            );
          }
          setLoading(false);
        },
        error: (error) => {
          setError("Error parsing CSV: " + error.message);
          setLoading(false);
        },
      });
    } catch (error) {
      setError("Could not load backend CSV: " + error.message);
      setLoading(false);
      console.error("CSV loading error:", error);
    }
  }, [cleanData]);

  // Load CSV on mount
  useEffect(() => {
    loadBackendCSV();
  }, [loadBackendCSV]);

  return (
    <div className="App">
      <header className="app-header">
        <h1>💳 Credit Card Statement Analyzer</h1>
        <p className="subtitle">
          Parse and visualize credit card statements from backend PDFs
        </p>
      </header>

      <div className="upload-section">
        <button onClick={loadBackendCSV} className="upload-button">
          🔄 Reload Backend CSV
        </button>
        <label htmlFor="csv-upload" className="sample-button">
          📂 Upload Different CSV
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => setStatements(cleanData(results.data)),
              });
            }}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {loading && <div className="loading">Loading statements...</div>}
      {error && <div className="error">{error}</div>}

      {statements.length > 0 && <Dashboard statements={statements} />}
    </div>
  );
}

export default App;
