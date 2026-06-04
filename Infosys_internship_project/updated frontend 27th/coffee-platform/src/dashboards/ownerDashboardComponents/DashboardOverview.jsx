import React, { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./DashboardOverview.css";
import { formatINR } from "../../utils/currency";

const CUSTOMER_PAYMENT_RECORDS_KEY = "customer_payment_records";
const initialStats = {
  cafes: 0,
  menu: 0,
  staff: 0,
  reservations: 0,
  orders: 0,
  tables: 0,
};

const chartColors = ["#6B4423", "#C8943A", "#2E7D32", "#C62828", "#8D6E63"];

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getOrderItemsText = (order) => {
  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items
      .map((item) => {
        const name = item.name || item.itemName || "Item";
        const quantity = item.quantity ?? item.qty ?? 1;
        return `${name} x${quantity}`;
      })
      .join(", ");
  }

  if (order.itemsSummary) {
    try {
      const parsedItems = JSON.parse(order.itemsSummary);
      if (Array.isArray(parsedItems) && parsedItems.length > 0) {
        return parsedItems
          .map((item) => {
            const name = item.name || item.itemName || "Item";
            const quantity = item.quantity ?? item.qty ?? 1;
            return `${name} x${quantity}`;
          })
          .join(", ");
      }
    } catch {
      return "-";
    }
  }

  return "-";
};

const getOverviewStatusClass = (status) => {
  const normalized = String(status || "pending").toLowerCase();
  if (normalized.includes("approve")) return "approved";
  if (normalized.includes("complete")) return "completed";
  if (normalized.includes("cancel")) return "cancelled";
  if (normalized.includes("prepar")) return "preparing";
  return "pending";
};

const DashboardOverview = ({ cafeId }) => {
  const [stats, setStats] = useState(initialStats);
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentRecords, setPaymentRecords] = useState(() => {
    try {
      const raw = localStorage.getItem(CUSTOMER_PAYMENT_RECORDS_KEY) || "[]";
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!cafeId) {
      setStats(initialStats);
      setOrders([]);
      setReservations([]);
      return;
    }

    const fetchOverviewData = async () => {
      try {
        setLoading(true);
        const [statsRes, ordersRes, reservationsRes] = await Promise.all([
          fetch(`http://localhost:8081/api/dashboard/${cafeId}`),
          fetch(`http://localhost:8081/api/orders/cafe/${cafeId}`),
          fetch(`http://localhost:8081/api/bookings/cafe/${cafeId}`),
        ]);

        if (!statsRes.ok) throw new Error("Failed to fetch dashboard stats");

        const statsData = await statsRes.json();
        const ordersData = ordersRes.ok ? await ordersRes.json() : [];
        const reservationsData = reservationsRes.ok ? await reservationsRes.json() : [];

        setStats({ ...initialStats, ...statsData });
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setReservations(Array.isArray(reservationsData) ? reservationsData : []);
      } catch (err) {
        console.error("Dashboard stats error:", err);
        setStats(initialStats);
        setOrders([]);
        setReservations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, [cafeId]);

  useEffect(() => {
    const syncPayments = () => {
      try {
        const raw = localStorage.getItem(CUSTOMER_PAYMENT_RECORDS_KEY) || "[]";
        const parsed = JSON.parse(raw);
        setPaymentRecords(Array.isArray(parsed) ? parsed : []);
      } catch {
        setPaymentRecords([]);
      }
    };

    syncPayments();
    window.addEventListener("customerPaymentRecordsChanged", syncPayments);
    window.addEventListener("storage", syncPayments);

    return () => {
      window.removeEventListener("customerPaymentRecordsChanged", syncPayments);
      window.removeEventListener("storage", syncPayments);
    };
  }, []);

  const operationsChartData = useMemo(
    () => [
      { name: "Menu", value: stats.menu },
      { name: "Staff", value: stats.staff },
      { name: "Orders", value: stats.orders },
      { name: "Bookings", value: stats.reservations },
      { name: "Tables", value: stats.tables },
    ],
    [stats]
  );

  const reservationStatusData = useMemo(() => {
    const counts = reservations.reduce((acc, reservation) => {
      const status = String(reservation.status || "PENDING").toUpperCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [reservations]);

  const recentOrders = useMemo(
    () =>
      [...orders]
        .filter((order) => {
          const status = String(order.status || order.orderStatus || "").trim().toLowerCase();
          return status !== "pending";
        })
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5),
    [orders]
  );
  const cafePaymentRecords = useMemo(
    () =>
      paymentRecords
        .map((payment) => {
          const matchingOrder = orders.find((order) => Number(order.id) === Number(payment.orderId));
          const resolvedCafeId = payment?.cafeId ?? matchingOrder?.cafeId ?? "";
          return {
            ...payment,
            cafeId: resolvedCafeId,
            orderStatus: matchingOrder?.status || "Pending",
            table: matchingOrder?.tableNumber ?? matchingOrder?.table ?? "-",
          };
        })
        .filter((payment) => String(payment.cafeId ?? "") === String(cafeId ?? ""))
        .sort((a, b) => Number(b.paidAt || 0) - Number(a.paidAt || 0)),
    [paymentRecords, orders, cafeId]
  );

  return (
    <div className="dashboard-overview">
      <div className="overview-header">
        <div>
          <h2>Dashboard Overview</h2>
          <p className="overview-subtitle">
            {cafeId ? "A quick view of your cafe's activity." : "Select a cafe to view its dashboard."}
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h4 className="stat-label">Menu Items</h4>
          <p className="stat-value">{loading ? "..." : stats.menu}</p>
        </div>

        <div className="stat-card">
          <h4 className="stat-label">Staff Members</h4>
          <p className="stat-value">{loading ? "..." : stats.staff}</p>
        </div>

        <div className="stat-card">
          <h4 className="stat-label">Reservations</h4>
          <p className="stat-value">{loading ? "..." : stats.reservations}</p>
        </div>

        <div className="stat-card">
          <h4 className="stat-label">Orders</h4>
          <p className="stat-value">{loading ? "..." : stats.orders}</p>
        </div>

        <div className="stat-card">
          <h4 className="stat-label">Tables</h4>
          <p className="stat-value">{loading ? "..." : stats.tables}</p>
        </div>

        <div className="stat-card stat-card-highlight">
          <h4 className="stat-label">My Cafes</h4>
          <p className="stat-value">{loading ? "..." : stats.cafes}</p>
        </div>
      </div>

      <div className="overview-chart-grid">
        <div className="overview-chart-card">
          <h3>Operational Snapshot</h3>
          <p className="chart-copy">A simple view of your key cafe numbers.</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={operationsChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {operationsChartData.map((entry, index) => (
                  <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="overview-chart-card">
          <h3>Reservation Status Mix</h3>
          <p className="chart-copy">Shows how your reservations are split by status.</p>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={reservationStatusData} dataKey="value" nameKey="name" outerRadius={90} label>
                {reservationStatusData.map((entry, index) => (
                  <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="recent-activity-card">
        <div className="recent-activity-header">
          <h3>Latest Orders</h3>
          <p>Your newest orders appear first.</p>
        </div>

        {recentOrders.length === 0 ? (
          <p className="overview-empty">No orders available for this cafe yet.</p>
        ) : (
          <div className="recent-orders-grid-wrap">
            <div className="recent-orders-grid-header">
              <div>Customer</div>
              <div>Items Ordered</div>
              <div>Date</div>
              <div>Status</div>
            </div>
            {recentOrders.map((order) => (
              <div key={order.id} className="recent-orders-grid-row">
                <div className="recent-orders-customer">{order.customer || "Customer"}</div>
                <div>{getOrderItemsText(order)}</div>
                <div>{formatDateTime(order.createdAt)}</div>
                <div>
                  <span className={`overview-status-pill ${getOverviewStatusClass(order.status || order.orderStatus || "pending")}`}>
                    {order.status || order.orderStatus || "Pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="recent-activity-card">
        <div className="recent-activity-header">
          <h3>Customer Payments</h3>
          <p>All paid customer transactions for this cafe are shown here.</p>
        </div>

        {cafePaymentRecords.length === 0 ? (
          <p className="overview-empty">No customer payments available for this cafe yet.</p>
        ) : (
          <div className="payment-records-grid">
            {cafePaymentRecords.map((payment) => (
              <article key={payment.id} className="payment-record-card">
                <div className="payment-record-top">
                  <div>
                    <h4>Order #{payment.orderId}</h4>
                    <p>{payment.customerName || "Customer"}</p>
                  </div>
                  <span className={`overview-status-pill ${getOverviewStatusClass(payment.paymentStatus || "paid")}`}>
                    {payment.paymentStatus || "Paid"}
                  </span>
                </div>
                <div className="payment-record-grid">
                  <div>
                    <span className="payment-record-label">Method</span>
                    <strong>{payment.paymentMethod || "Razorpay"}</strong>
                  </div>
                  <div>
                    <span className="payment-record-label">Amount</span>
                    <strong>{formatINR(payment.amount || 0)}</strong>
                  </div>
                  <div>
                    <span className="payment-record-label">Table</span>
                    <strong>{payment.table}</strong>
                  </div>
                  <div>
                    <span className="payment-record-label">Order Status</span>
                    <strong>{payment.orderStatus}</strong>
                  </div>
                </div>
                <div className="payment-record-footer">
                  <span>Paid At</span>
                  <strong>{formatDateTime(payment.paidAt)}</strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardOverview;

