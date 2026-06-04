import React, { useEffect, useMemo, useState } from "react";
import { formatINR } from "../../utils/currency";

const CUSTOMER_PAYMENT_RECORDS_KEY = "customer_payment_records";

const readPaymentRecords = () => {
  try {
    const raw = localStorage.getItem(CUSTOMER_PAYMENT_RECORDS_KEY) || "[]";
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const formatPaidAt = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN");
};

const PaymentsManagement = ({ cafeId }) => {
  const [paymentRecords, setPaymentRecords] = useState(() => readPaymentRecords());
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const syncPaymentRecords = () => {
      setPaymentRecords(readPaymentRecords());
    };

    syncPaymentRecords();
    window.addEventListener("customerPaymentRecordsChanged", syncPaymentRecords);
    window.addEventListener("storage", syncPaymentRecords);

    return () => {
      window.removeEventListener("customerPaymentRecordsChanged", syncPaymentRecords);
      window.removeEventListener("storage", syncPaymentRecords);
    };
  }, []);

  useEffect(() => {
    if (!cafeId) {
      setOrders([]);
      return;
    }

    fetch(`http://localhost:8081/api/orders/cafe/${cafeId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]));
  }, [cafeId]);

  const cafePayments = useMemo(
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
    <div className="recent-activity-card">
      <div className="recent-activity-header">
        <h3>Customer Payments</h3>
        <p>View customer payment details for the selected cafe.</p>
      </div>

      {cafePayments.length === 0 ? (
        <p className="overview-empty">No customer payments available for this cafe yet.</p>
      ) : (
        <div className="payment-records-grid">
          {cafePayments.map((payment) => (
            <article key={payment.id} className="payment-record-card">
              <div className="payment-record-top">
                <div>
                  <h4>Order #{payment.orderId}</h4>
                  <p>{payment.customerName || "Customer"}</p>
                </div>
                <span className="overview-status-pill approved">
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
                <strong>{formatPaidAt(payment.paidAt)}</strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentsManagement;
