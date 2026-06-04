import React, { useState, useEffect } from "react";
import "./AnalyticsDashboard.css";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { getCurrentCafeId } from "../../utils/session";

const AnalyticsDashboard = () => {
  const [cafeId, setCafeId] = useState(getCurrentCafeId());
  const [salesData, setSalesData] = useState([]);

  // Update cafeId when it changes globally
  useEffect(() => {
    const handler = () => setCafeId(getCurrentCafeId());
    window.addEventListener("cafeChanged", handler);
    return () => window.removeEventListener("cafeChanged", handler);
  }, []);

  // Fetch sales data whenever cafeId changes
  useEffect(() => {
    if (!cafeId) return;

    // For now, using static data; replace this with your API call
    setSalesData([
      { date: "Mon", revenue: 400 },
      { date: "Tue", revenue: 600 },
      { date: "Wed", revenue: 300 },
      { date: "Thu", revenue: 800 },
      { date: "Fri", revenue: 700 }
    ]);

    // Example for API fetch:
    // fetch(`http://localhost:8081/api/sales/${cafeId}`)
    //   .then(res => res.json())
    //   .then(data => setSalesData(data))
    //   .catch(err => console.error(err));
  }, [cafeId]);

  return (
    <div className="sales-analytics-section">
      <h3>Analytics</h3>

      {salesData.length === 0 ? (
        <p>No sales data available for this cafe.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#6B4423" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default AnalyticsDashboard;



// import React from "react";
// import "./AnalyticsDashboard.css";
// import {
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   CartesianGrid,
//   XAxis,
//   YAxis,
//   Tooltip
// } from "recharts";

// const cafeId = localStorage.getItem("cafeId");

// const AnalyticsDashboard = () => {

//   const salesData = [
//     { date: "Mon", revenue: 400 },
//     { date: "Tue", revenue: 600 },
//     { date: "Wed", revenue: 300 },
//     { date: "Thu", revenue: 800 },
//     { date: "Fri", revenue: 700 }
//   ];

//   return (

//     <div className="sales-analytics-section">

//       <h3>Analytics</h3>

//       <ResponsiveContainer width="100%" height={300}>

//         <LineChart data={salesData}>

//           <CartesianGrid strokeDasharray="3 3" />

//           <XAxis dataKey="date" />

//           <YAxis />

//           <Tooltip />

//           <Line type="monotone" dataKey="revenue" stroke="#6B4423" />

//         </LineChart>

//       </ResponsiveContainer>

//     </div>

//   );
// };

// export default AnalyticsDashboard;

