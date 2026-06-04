import React, { useEffect, useMemo, useState } from "react";
import {
  fetchFeedbackForCafe,
  getCustomerFeedbackForCafe,
  getCustomerFeedbackSignal,
} from "../../utils/feedbackStore";
import "./OrderManagement.css";

const formatOrderTime = (value) => {
  if (!value) {
    return "Time unavailable";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Time unavailable";
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getOrderStatusClass = (status) => {
  const normalized = String(status || "UNKNOWN").toLowerCase();

  if (normalized.includes("pending")) return "pending";
  if (normalized.includes("approved")) return "approved";
  if (normalized.includes("preparing")) return "preparing";
  if (normalized.includes("served")) return "completed";
  if (normalized.includes("completed")) return "completed";
  if (normalized.includes("cancel")) return "cancelled";

  return "neutral";
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

const OrdersManagement = ({ cafeId }) => {
  const [orders, setOrders] = useState([]);
  const [orderFeedback, setOrderFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!cafeId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`http://localhost:8081/api/orders/cafe/${cafeId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch cafe orders");
        }

        const data = await response.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setOrders([]);
        setError("Could not load orders for this cafe.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [cafeId]);

  useEffect(() => {
    if (!cafeId) {
      setOrderFeedback([]);
      return;
    }

    const loadFeedback = () => {
      const localFeedback = getCustomerFeedbackForCafe(cafeId).filter((item) => item.type === "ORDER");
      setOrderFeedback(localFeedback);

      fetchFeedbackForCafe(cafeId)
        .then((feedback) => {
          const merged = new Map();
          [...localFeedback, ...feedback.filter((item) => item.type === "ORDER")].forEach((item) => {
            merged.set(String(item.targetId), item);
          });
          setOrderFeedback([...merged.values()]);
        })
        .catch(() => setOrderFeedback(localFeedback));
    };

    loadFeedback();
    window.addEventListener(getCustomerFeedbackSignal(), loadFeedback);
    window.addEventListener("storage", loadFeedback);

    return () => {
      window.removeEventListener(getCustomerFeedbackSignal(), loadFeedback);
      window.removeEventListener("storage", loadFeedback);
    };
  }, [cafeId]);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;

      if (rightTime !== leftTime) {
        return rightTime - leftTime;
      }

      return (right.id || 0) - (left.id || 0);
    });
  }, [orders]);

  return (
    <section className="order-management-section">
      <div className="orders-page-header">
        <div>
          <p className="orders-eyebrow">Orders</p>
          <h3 className="order-title">Latest orders for this cafe</h3>
          <p className="orders-subtitle">Newest orders are shown first.</p>
        </div>
        <div className="orders-count-chip">{sortedOrders.length} total</div>
      </div>

      {loading && <p className="orders-empty-state">Loading orders...</p>}
      {error && <p className="orders-empty-state orders-error">{error}</p>}
      {!loading && !error && sortedOrders.length === 0 && (
        <p className="orders-empty-state">No orders have been placed for this cafe yet.</p>
      )}

      {!loading && !error && sortedOrders.length > 0 && (
        <div className="orders-grid-wrap">
          <div className="orders-grid-header">
            <div>Customer</div>
            <div>Items Ordered</div>
            <div>Date</div>
            <div>Status</div>
          </div>

          {sortedOrders.map((order) => {
            const status = order.orderStatus || order.status || "Pending";
            const feedback = orderFeedback.find((item) => String(item.targetId) === String(order.id));

            return (
              <div key={order.id} className="orders-grid-row">
                <div className="orders-cell-customer">{order.customer || "Customer name unavailable"}</div>
                <div>
                  <div>{getOrderItemsText(order)}</div>
                  {feedback && (
                    <div className="order-feedback-note">
                      Feedback: {feedback.rating}/5 - {feedback.message}
                    </div>
                  )}
                </div>
                <div>{formatOrderTime(order.createdAt)}</div>
                <div>
                  <span className={`order-status-pill ${getOrderStatusClass(status)}`}>{status}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default OrdersManagement;

