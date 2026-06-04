import React, { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { formatINR } from "../../utils/currency";
import "./TotalIncome.css";

const chartColors = ["#6B4423", "#8B5E3C", "#C8943A", "#A1887F", "#5D4037"];
const menuTypeSections = [
  {
    key: "coffee",
    label: "Coffee",
    matcher: (itemName) => /coffee|espresso|latte|cappuccino|americano|mocha/.test(itemName),
  },
  {
    key: "tea",
    label: "Tea",
    matcher: (itemName) => /tea|chai|green tea|lemon tea|iced tea/.test(itemName),
  },
  {
    key: "milkshakes",
    label: "Milkshakes",
    matcher: (itemName) => /shake|milkshake|smoothie/.test(itemName),
  },
  {
    key: "cold-drinks",
    label: "Cold Drinks",
    matcher: (itemName) => /cold|soda|juice|mocktail|cooler|fizz/.test(itemName),
  },
  {
    key: "snacks",
    label: "Snacks",
    matcher: (itemName) => /sandwich|burger|toast|snack|biscuit|fries|puff|wrap|cake|cookie/.test(itemName),
  },
];

const parseOrderItems = (order) => {
  const rawItems = order?.itemsSummary || order?.items;
  if (!rawItems) return [];

  try {
    const parsed = typeof rawItems === "string" ? JSON.parse(rawItems) : rawItems;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getItemName = (item) => item?.name || item?.itemName || "Menu Item";
const getItemQty = (item) => Number(item?.qty ?? item?.quantity ?? 1) || 1;
const getItemPrice = (item) => Number(item?.price || 0) || 0;

const TotalIncome = ({ cafeId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cafeId) {
      setOrders([]);
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8081/api/orders/cafe/${cafeId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch cafe orders");
        }

        const data = await response.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch income data", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [cafeId]);

  const salesSummary = useMemo(() => {
    const itemMap = new Map();
    let totalIncome = 0;
    let totalOrders = 0;
    let totalItemsSold = 0;

    orders.forEach((order) => {
      totalOrders += 1;
      totalIncome += Number(order?.totalAmount ?? order?.price ?? 0) || 0;

      parseOrderItems(order).forEach((item) => {
        const itemName = getItemName(item);
        const normalizedItemName = itemName.toLowerCase();
        const quantity = getItemQty(item);
        const revenue = getItemPrice(item) * quantity;

        totalItemsSold += quantity;

        if (!itemMap.has(itemName)) {
          itemMap.set(itemName, {
            name: itemName,
            quantity: 0,
            revenue: 0,
          });
        }

        const existing = itemMap.get(itemName);
        existing.quantity += quantity;
        existing.revenue += revenue;
        existing.normalizedName = normalizedItemName;
      });
    });

    const rankedItems = [...itemMap.values()].sort((a, b) => {
      if (b.quantity !== a.quantity) return b.quantity - a.quantity;
      return b.revenue - a.revenue;
    });

    const menuTypeSummary = menuTypeSections.map((section) => {
      const matchingItems = rankedItems.filter((item) => section.matcher(item.normalizedName || item.name.toLowerCase()));
      return {
        key: section.key,
        label: section.label,
        quantity: matchingItems.reduce((sum, item) => sum + item.quantity, 0),
        revenue: matchingItems.reduce((sum, item) => sum + item.revenue, 0),
      };
    });

    return {
      totalIncome,
      totalOrders,
      totalItemsSold,
      bestSeller: rankedItems[0] || null,
      lowestSeller: rankedItems.length > 0 ? rankedItems[rankedItems.length - 1] : null,
      rankedItems,
      chartData: rankedItems.slice(0, 5),
      menuTypeSummary,
    };
  }, [orders]);

  if (!cafeId) {
    return (
      <div className="total-income-page">
        <div className="income-card">
          <h3>Total Income</h3>
          <p className="income-empty">Select a cafe to view sales and income details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="total-income-page">
      <div className="income-card">
        <div className="income-header">
          <div>
            <h3>Total Income</h3>
            <p>Track which menu items are selling best and which are selling less.</p>
          </div>
        </div>

        <div className="income-stats-grid">
          <div className="income-stat-box">
            <span>Total Income</span>
            <strong>{loading ? "..." : formatINR(salesSummary.totalIncome)}</strong>
          </div>
          <div className="income-stat-box">
            <span>Total Orders</span>
            <strong>{loading ? "..." : salesSummary.totalOrders}</strong>
          </div>
          <div className="income-stat-box">
            <span>Items Sold</span>
            <strong>{loading ? "..." : salesSummary.totalItemsSold}</strong>
          </div>
        </div>

        {!loading && salesSummary.rankedItems.length > 0 && (
          <div className="income-type-grid">
            {salesSummary.menuTypeSummary.map((type) => (
              <div key={type.key} className="income-type-card">
                <span>{type.label}</span>
                <strong>{formatINR(type.revenue)}</strong>
                <p>{type.quantity} item sold</p>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <p className="income-empty">Loading income details...</p>
        ) : salesSummary.rankedItems.length === 0 ? (
          <p className="income-empty">No sales data available for this cafe yet.</p>
        ) : (
          <>
            <div className="income-highlight-grid">
              <div className="income-highlight-card best">
                <span>Best Selling Item</span>
                <strong>{salesSummary.bestSeller?.name}</strong>
                <p>
                  Sold {salesSummary.bestSeller?.quantity} times
                  {" • "}
                  {formatINR(salesSummary.bestSeller?.revenue || 0)}
                </p>
              </div>
              <div className="income-highlight-card low">
                <span>Lowest Selling Item</span>
                <strong>{salesSummary.lowestSeller?.name}</strong>
                <p>
                  Sold {salesSummary.lowestSeller?.quantity} times
                  {" • "}
                  {formatINR(salesSummary.lowestSeller?.revenue || 0)}
                </p>
              </div>
            </div>

            <div className="income-chart-card">
              <h4>Top Selling Menu Items</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesSummary.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="quantity" radius={[8, 8, 0, 0]}>
                    {salesSummary.chartData.map((entry, index) => (
                      <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="income-list-card">
              <h4>Menu Sales Ranking</h4>
              <div className="income-list-header">
                <div>Item</div>
                <div>Quantity Sold</div>
                <div>Income</div>
              </div>
              {salesSummary.rankedItems.map((item) => (
                <div key={item.name} className="income-list-row">
                  <div>{item.name}</div>
                  <div>{item.quantity}</div>
                  <div>{formatINR(item.revenue)}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TotalIncome;
