import React from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function Charts({ statements }) {
  const COLORS = ["#004C8F", "#F37021", "#22409A", "#800000", "#ED232A"];

  // Prepare data for charts
  const prepareBarChartData = () => {
    return statements
      .filter(
        (s) =>
          s["Total Dues"] &&
          s["Total Dues"] !== "0.00" &&
          s["Total Dues"] !== "N/A"
      )
      .map((s) => {
        const parseAmount = (amount) => {
          if (!amount || amount === "N/A") return 0;
          return parseFloat(amount.toString().replace(/[₹,\s]/g, "")) || 0;
        };

        return {
          name: (s.Name || "N/A").split(" ")[0],
          card: `****${s["Card Last 4 Digits"] || "****"}`,
          totalDue: parseAmount(s["Total Dues"]),
          minDue: parseAmount(s["Minimum Amount Due"]),
        };
      });
  };

  const preparePieChartData = () => {
    const dataMap = new Map();

    statements
      .filter(
        (s) =>
          s["Total Dues"] &&
          s["Total Dues"] !== "0.00" &&
          s["Total Dues"] !== "N/A"
      )
      .forEach((s) => {
        const parseAmount = (amount) => {
          if (!amount || amount === "N/A") return 0;
          return parseFloat(amount.toString().replace(/[₹,\s]/g, "")) || 0;
        };

        const issuer = (s["File Name"] || "").toLowerCase();
        let name = "Other";
        if (issuer.includes("hdfc")) name = "HDFC";
        else if (issuer.includes("icici")) name = "ICICI";
        else if (issuer.includes("sbi")) name = "SBI";
        else if (issuer.includes("axis")) name = "Axis";
        else if (issuer.includes("kotak")) name = "Kotak";
        else if (issuer.includes("canara")) name = "Canara";

        const currentValue = dataMap.get(name) || 0;
        dataMap.set(name, currentValue + parseAmount(s["Total Dues"]));
      });

    return Array.from(dataMap, ([name, value]) => ({ name, value }));
  };

  const prepareCreditUtilizationData = () => {
    return statements
      .filter(
        (s) =>
          s["Credit Limit"] &&
          s["Credit Limit"] !== "0" &&
          s["Credit Limit"] !== "N/A"
      )
      .map((s) => {
        const parseNumber = (num) => {
          if (!num || num === "N/A") return 0;
          return parseFloat(num.toString().replace(/[,\s]/g, "")) || 0;
        };

        const creditLimit = parseNumber(s["Credit Limit"]);
        const availableCredit = parseNumber(s["Available Credit Limit"]);
        const utilization =
          creditLimit > 0
            ? ((creditLimit - availableCredit) / creditLimit) * 100
            : 0;

        const issuer = (s["File Name"] || "").toLowerCase();
        let name = "Other";
        if (issuer.includes("hdfc")) name = "HDFC";
        else if (issuer.includes("icici")) name = "ICICI";
        else if (issuer.includes("sbi")) name = "SBI";
        else if (issuer.includes("axis")) name = "Axis";
        else if (issuer.includes("kotak")) name = "Kotak";
        else if (issuer.includes("canara")) name = "Canara";

        return {
          name,
          utilization: parseFloat(utilization.toFixed(1)),
          creditLimit: creditLimit / 1000, // in thousands
          availableCredit: availableCredit / 1000,
        };
      });
  };

  const barChartData = prepareBarChartData();
  const pieChartData = preparePieChartData();
  const utilizationData = prepareCreditUtilizationData();

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: "white",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "5px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          }}>
          <p style={{ margin: 0, fontWeight: "bold" }}>
            {payload[0].payload.name}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ margin: "5px 0", color: entry.color }}>
              {entry.name}: ₹{entry.value.toLocaleString("en-IN")}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="charts-section">
      <h2>📊 Analytics Dashboard</h2>

      <div className="charts-grid">
        {/* Bar Chart - Total vs Minimum Due */}
        <div className="chart-container">
          <h3>Total Due vs Minimum Due by Card</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="card" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="totalDue" fill="#ff6b6b" name="Total Due" />
              <Bar dataKey="minDue" fill="#4ecdc4" name="Minimum Due" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Total Dues Distribution */}
        <div className="chart-container">
          <h3>Total Dues Distribution by Issuer</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value">
                {pieChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart - Credit Utilization */}
        <div className="chart-container full-width">
          <h3>Credit Utilization by Issuer</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={utilizationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis
                yAxisId="left"
                label={{
                  value: "Utilization %",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{
                  value: "Amount (₹ thousands)",
                  angle: 90,
                  position: "insideRight",
                }}
              />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="utilization"
                stroke="#ff6b6b"
                strokeWidth={2}
                name="Utilization %"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="creditLimit"
                stroke="#4ecdc4"
                strokeWidth={2}
                name="Credit Limit (₹K)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="availableCredit"
                stroke="#95e1d3"
                strokeWidth={2}
                name="Available Credit (₹K)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Charts;
