import React, { useState } from "react";
import StatementCard from "./StatementCard";
import Charts from "./Charts";
import { CreditCard, TrendingUp, Calendar, AlertCircle } from "lucide-react";

function Dashboard({ statements }) {
  const [selectedStatement, setSelectedStatement] = useState(null);

  // Calculate statistics
  const calculateStats = () => {
    const parseAmount = (amount) => {
      if (!amount || amount === "N/A") return 0;
      // Remove ₹, commas, and spaces, then parse
      return parseFloat(amount.toString().replace(/[₹,\s]/g, "")) || 0;
    };

    const parseNumber = (num) => {
      if (!num || num === "N/A") return 0;
      return parseFloat(num.toString().replace(/[,\s]/g, "")) || 0;
    };

    // Filter out statements with no data
    const validStatements = statements.filter(
      (s) =>
        s["Total Dues"] &&
        s["Total Dues"] !== "0.00" &&
        s["Total Dues"] !== "N/A"
    );

    const totalDues = validStatements.reduce(
      (sum, s) => sum + parseAmount(s["Total Dues"]),
      0
    );
    const totalMinDue = validStatements.reduce(
      (sum, s) => sum + parseAmount(s["Minimum Amount Due"]),
      0
    );
    const totalCreditLimit = validStatements.reduce(
      (sum, s) => sum + parseNumber(s["Credit Limit"]),
      0
    );
    const totalAvailableCredit = validStatements.reduce(
      (sum, s) => sum + parseNumber(s["Available Credit Limit"]),
      0
    );

    const avgUtilization =
      totalCreditLimit > 0
        ? (
            ((totalCreditLimit - totalAvailableCredit) / totalCreditLimit) *
            100
          ).toFixed(1)
        : 0;

    return {
      totalDues: totalDues.toLocaleString("en-IN"),
      totalMinDue: totalMinDue.toLocaleString("en-IN"),
      totalCreditLimit: totalCreditLimit.toLocaleString("en-IN"),
      totalAvailableCredit: totalAvailableCredit.toLocaleString("en-IN"),
      avgUtilization,
      statementCount: statements.length,
      validStatementCount: validStatements.length,
    };
  };

  const stats = calculateStats();

  // Get upcoming payment dates
  const getUpcomingPayments = () => {
    return statements
      .filter((s) => s["Payment Due Date"] && s["Payment Due Date"] !== "N/A") // Filter out N/A dates
      .map((s) => ({
        name: s.Name,
        card: s["Card Last 4 Digits"],
        dueDate: s["Payment Due Date"],
        amount: s["Total Dues"] || "0.00",
      }))
      .sort((a, b) => {
        // Parse DD/MM/YYYY format
        const parseDate = (dateStr) => {
          if (!dateStr || dateStr === "N/A") return new Date(0);
          const parts = dateStr.split("/");
          if (parts.length === 3) {
            return new Date(parts[2], parts[1] - 1, parts[0]); // year, month-1, day
          }
          return new Date(0);
        };
        return parseDate(a.dueDate) - parseDate(b.dueDate);
      });
  };

  return (
    <div className="dashboard">
      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: "#ff6b6b" }}>
            <CreditCard size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Statements</h3>
            <p className="stat-value">{stats.statementCount}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: "#4ecdc4" }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Dues</h3>
            <p className="stat-value">₹{stats.totalDues}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: "#95e1d3" }}>
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <h3>Min. Amount Due</h3>
            <p className="stat-value">₹{stats.totalMinDue}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: "#ffd93d" }}>
            <AlertCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Avg. Utilization</h3>
            <p className="stat-value">{stats.avgUtilization}%</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <Charts statements={statements} />

      {/* Upcoming Payments */}
      <div className="upcoming-payments">
        <h2>📅 Upcoming Payments</h2>
        <div className="payment-list">
          {getUpcomingPayments().map((payment, idx) => (
            <div key={idx} className="payment-item">
              <div className="payment-info">
                <strong>{payment.name}</strong>
                <span className="card-number">**** {payment.card}</span>
              </div>
              <div className="payment-details">
                <span className="due-date">Due: {payment.dueDate}</span>
                <span className="amount">{payment.amount}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statement Cards */}
      <div className="statements-section">
        <h2>📄 All Statements</h2>
        <div className="statements-grid">
          {statements.map((statement, index) => (
            <StatementCard
              key={index}
              statement={statement}
              onClick={() => setSelectedStatement(statement)}
            />
          ))}
        </div>
      </div>

      {/* Statement Details Modal */}
      {selectedStatement && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedStatement(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-button"
              onClick={() => setSelectedStatement(null)}>
              ×
            </button>
            <h2>Statement Details</h2>
            <div className="detail-grid">
              {Object.entries(selectedStatement).map(([key, value]) => (
                <div key={key} className="detail-item">
                  <strong>{key}:</strong>
                  <span>{value || "N/A"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
