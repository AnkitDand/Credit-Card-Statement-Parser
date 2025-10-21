import React from "react";
import { CreditCard, User, Mail, Calendar } from "lucide-react";

function StatementCard({ statement, onClick }) {
  const parseAmount = (amount) => {
    if (!amount || amount === "N/A" || amount === "0.00") return "₹0.00";
    // Add ₹ symbol if not present
    const cleanAmount = amount.toString().replace(/₹?\s?/, "");
    return `₹${cleanAmount}`;
  };

  const getCardIssuer = (filename) => {
    const lower = (filename || "").toLowerCase();
    if (lower.includes("hdfc")) return "HDFC Bank";
    if (lower.includes("icici")) return "ICICI Bank";
    if (lower.includes("sbi")) return "SBI Card";
    if (lower.includes("axis")) return "Axis Bank";
    if (lower.includes("kotak")) return "Kotak Mahindra";
    if (lower.includes("canara")) return "Canara Bank";
    return "Credit Card";
  };

  const getCardColor = (filename) => {
    const lower = (filename || "").toLowerCase();
    if (lower.includes("hdfc")) return "#004C8F";
    if (lower.includes("icici")) return "#F37021";
    if (lower.includes("sbi")) return "#22409A";
    if (lower.includes("axis")) return "#800000";
    if (lower.includes("kotak")) return "#ED232A";
    if (lower.includes("canara")) return "#00703C";
    return "#6c757d";
  };

  const issuer = getCardIssuer(statement["File Name"]);
  const cardColor = getCardColor(statement["File Name"]);

  // Check if statement has missing data
  const hasIncompleteData =
    !statement["Statement Date"] ||
    statement["Statement Date"] === "N/A" ||
    !statement["Card Last 4 Digits"] ||
    statement["Card Last 4 Digits"] === "N/A";

  return (
    <div
      className="statement-card"
      onClick={onClick}
      style={{ borderLeftColor: cardColor }}>
      <div className="card-header" style={{ backgroundColor: cardColor }}>
        <CreditCard size={20} color="white" />
        <span className="issuer-name">{issuer}</span>
        {hasIncompleteData && (
          <span
            className="incomplete-badge"
            title="Some data could not be extracted">
            ⚠️
          </span>
        )}
      </div>

      <div className="card-body">
        <div className="card-info-row">
          <User size={16} />
          <span className="info-label">Name:</span>
          <span className="info-value">{statement.Name || "N/A"}</span>
        </div>

        <div className="card-info-row">
          <Mail size={16} />
          <span className="info-label">Email:</span>
          <span className="info-value email">{statement.Email || "N/A"}</span>
        </div>

        <div className="card-info-row">
          <Calendar size={16} />
          <span className="info-label">Statement Date:</span>
          <span className="info-value">
            {statement["Statement Date"] || "N/A"}
          </span>
        </div>

        <div className="card-number">
          <CreditCard size={16} />
          <span>
            Card: **** **** **** {statement["Card Last 4 Digits"] || "****"}
          </span>
        </div>

        <div className="card-amounts">
          <div className="amount-item">
            <span className="amount-label">Total Due</span>
            <span className="amount-value total-due">
              {parseAmount(statement["Total Dues"])}
            </span>
          </div>
          <div className="amount-item">
            <span className="amount-label">Minimum Due</span>
            <span className="amount-value min-due">
              {parseAmount(statement["Minimum Amount Due"])}
            </span>
          </div>
        </div>

        <div className="due-date-banner">
          <span>Payment Due: {statement["Payment Due Date"] || "N/A"}</span>
        </div>
      </div>
    </div>
  );
}

export default StatementCard;
