import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import CheckoutBill from "../dashboards/CheckoutBill";
import OrderReceipt, { downloadReceiptPdf } from "../dashboards/OrderReceipt";
import { formatINR, toINR } from "../utils/currency";
import { getCurrentUser } from "../utils/session";
import "./CartPage.css";

const defaultCartImage = "https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=600&auto=format&fit=crop";
const CUSTOMER_PAYMENT_RECORDS_KEY = "customer_payment_records";

const resolveCartImage = (imageUrl) => {
  if (!imageUrl) return defaultCartImage;
  if (imageUrl.startsWith("data:") || imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  if (imageUrl.startsWith("/")) {
    return `http://localhost:8081${imageUrl}`;
  }
  return defaultCartImage;
};

const normalizePrice = (price) => {
  const numericPrice = Number(price || 0);
  return numericPrice > 0 && numericPrice < 20 ? toINR(numericPrice) : numericPrice;
};

const saveCustomerPaymentRecord = (record) => {
  try {
    const existing = JSON.parse(localStorage.getItem(CUSTOMER_PAYMENT_RECORDS_KEY) || "[]");
    const next = Array.isArray(existing) ? [record, ...existing] : [record];
    localStorage.setItem(CUSTOMER_PAYMENT_RECORDS_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("customerPaymentRecordsChanged"));
  } catch (error) {
    console.error("Failed to save payment record", error);
  }
};

const CartPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [showCheckoutBill, setShowCheckoutBill] = useState(false);
  const [receiptDetails, setReceiptDetails] = useState(null);

  const user = useMemo(() => {
    return getCurrentUser();
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    axios.get(`http://localhost:8081/api/cart/user/${user.id}`)
      .then((res) => setCart(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error(err));
  }, [user?.id]);

  const normalizedCartItems = useMemo(
    () =>
      cart.map((item) => ({
        ...item,
        name: item.itemName || item.name || "Menu Item",
        qty: item.quantity || 1,
        price: normalizePrice(item.price),
        originalPrice: normalizePrice(item.originalPrice ?? item.price),
        offerLabel: item.offerLabel || "",
      })),
    [cart]
  );

  const increaseQty = (index) => {
    const updated = [...cart];
    const nextQuantity = (updated[index].quantity || 1) + 1;
    updated[index].quantity = nextQuantity;
    setCart(updated);
    window.dispatchEvent(new Event("cart-updated"));
    axios.put("http://localhost:8081/api/cart/update", {
      ...updated[index],
      quantity: nextQuantity,
    }).catch((err) => console.error(err));
  };

  const decreaseQty = (index) => {
    const updated = [...cart];

    if ((updated[index].quantity || 1) > 1) {
      updated[index].quantity -= 1;
      axios.put("http://localhost:8081/api/cart/update", {
        ...updated[index],
        quantity: updated[index].quantity,
      }).catch((err) => console.error(err));
    } else {
      const itemToRemove = updated[index];
      updated.splice(index, 1);
      axios.delete(`http://localhost:8081/api/cart/${itemToRemove.id}`).catch((err) => console.error(err));
    }

    setCart(updated);
    window.dispatchEvent(new Event("cart-updated"));
  };

  const removeItem = async (id) => {
    try {
      await axios.delete(`http://localhost:8081/api/cart/${id}`);
      setCart((prev) => prev.filter((item) => item.id !== id));
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      console.error(err);
    }
  };

  const total = normalizedCartItems.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const sendOrderToChefQueue = (orderId, items, cafeId) => {
    try {
      const existing = JSON.parse(localStorage.getItem("kitchen_orders") || "[]");
      const kitchenOrder = {
        id: orderId,
        cafeId,
        table: (orderId % 12) + 1,
        items: items.flatMap((item) => Array(item.qty).fill(item.name)),
        status: "New",
        timestamp: Date.now(),
        priority: "medium",
        source: "customer-checkout",
      };
      localStorage.setItem("kitchen_orders", JSON.stringify([kitchenOrder, ...existing]));
    } catch (error) {
      console.error("Failed to send order to chef queue", error);
    }
  };

  const handleSuccessfulCheckout = async (billSummary) => {
    if (!user?.id || normalizedCartItems.length === 0) return;

    const firstItem = cart[0];
    const cafeId = firstItem?.cafeId ?? firstItem?.cafe?.id ?? null;
    const cafeName = firstItem?.cafeName || "Cafe";
    const customerName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.email || "Customer";

    try {
      const orderResponse = await axios.post("http://localhost:8081/api/orders", {
        customer: customerName,
        customerId: user.id,
        status: "Pending",
        cafeId,
        cafeName,
        itemsSummary: JSON.stringify(
          normalizedCartItems.map((item) => ({
            itemId: item.itemId || item.id || null,
            itemName: item.itemName || item.name || null,
            name: item.name,
            qty: item.qty,
            price: item.price,
            imageUrl: item.imageUrl,
          }))
        ),
        itemCount: normalizedCartItems.reduce((sum, item) => sum + item.qty, 0),
        totalAmount: billSummary.total,
      });

      const savedCafeId = orderResponse.data?.cafeId ?? cafeId;
      const savedCafeName = orderResponse.data?.cafeName || cafeName;
      const paymentRecord = {
        orderId: orderResponse.data.id,
        cafeId: savedCafeId,
        cafeName: savedCafeName,
        customerId: user.id,
        customerName,
        amount: billSummary.total,
        subtotal: billSummary.subtotal,
        discount: billSummary.discount,
        tax: billSummary.tax,
        paymentMethod: "Razorpay",
        paymentStatus: "Paid",
      };

      try {
        await axios.post("http://localhost:8081/api/payments", paymentRecord);
      } catch (paymentError) {
        console.error("Failed to save payment in database", paymentError);
      }

      saveCustomerPaymentRecord({
        id: `payment-${orderResponse.data.id}-${Date.now()}`,
        ...paymentRecord,
        paidAt: Date.now(),
      });

      sendOrderToChefQueue(orderResponse.data.id, normalizedCartItems, cafeId);
      await axios.delete(`http://localhost:8081/api/cart/clear/${user.id}`);

      setCart([]);
      window.dispatchEvent(new Event("cart-updated"));
      setShowCheckoutBill(false);
      const nextReceiptDetails = {
        orderId: `ORD-${orderResponse.data.id}`,
        date: new Date().toLocaleString(),
        items: normalizedCartItems,
        subtotal: billSummary.subtotal,
        discount: billSummary.discount,
        tax: billSummary.tax,
        total: billSummary.total,
        cafeName: savedCafeName,
      };
      downloadReceiptPdf(nextReceiptDetails);
      setReceiptDetails(nextReceiptDetails);
    } catch (error) {
      console.error("Checkout failed", error);
      alert("Checkout failed. Please try again.");
    }
  };

  const handleReceiptDone = () => {
    setReceiptDetails(null);
    navigate("/customer-account?tab=orders");
  };

  return (
    <div className="cart-page">
      {showCheckoutBill && (
        <CheckoutBill
          cartItems={normalizedCartItems}
          onBack={() => setShowCheckoutBill(false)}
          onProceed={handleSuccessfulCheckout}
        />
      )}

      {receiptDetails && (
        <OrderReceipt
          orderDetails={receiptDetails}
          onClose={handleReceiptDone}
        />
      )}

      <h2 className="cart-title">Your Cart</h2>

      {cart.length === 0 ? (
        <div className="empty-cart-state">
          <div className="empty-cart-illustration">
            <div className="empty-cup"></div>
            <div className="empty-plate"></div>
          </div>
          <div className="empty-cart-copy">
            <span className="empty-cart-tag">Nothing brewing yet</span>
            <h3>Your cart is waiting for something delicious</h3>
            <p>
              Browse nearby cafes, add your favorite drinks or bites, and come back
              here when you are ready to check out.
            </p>
          </div>
          <div className="empty-cart-actions">
            <button
              className="empty-cart-primary"
              type="button"
              onClick={() => navigate("/dashboard/customer")}
            >
              Browse Cafes
            </button>
            <button
              className="empty-cart-secondary"
              type="button"
              onClick={() => navigate("/customer-account?tab=orders")}
            >
              View Orders
            </button>
          </div>
        </div>
      ) : (
        <div className="cart-container">
          <div className="cart-items">
            {cart.map((item, index) => (
              <div key={item.id || index} className="cart-card">
                <img
                  src={resolveCartImage(item.imageUrl)}
                  alt={item.name || item.itemName}
                  className="cart-image"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = defaultCartImage;
                  }}
                />

                <div className="cart-details">
                  <h3>{item.name || item.itemName}</h3>
                  {item.offerLabel && <p className="cart-offer-label">{item.offerLabel}</p>}
                  {Number(item.originalPrice || item.price) > Number(item.price || 0) && (
                    <p className="cart-price-original">{formatINR(normalizePrice(item.originalPrice))}</p>
                  )}
                  <p className="cart-price">{formatINR(normalizePrice(item.price))}</p>

                  <div className="qty-controls">
                    <button onClick={() => decreaseQty(index)}>-</button>
                    <span>{item.quantity || 1}</span>
                    <button onClick={() => increaseQty(index)}>+</button>
                  </div>
                </div>

                <button
                  className="remove-btn"
                  onClick={() => removeItem(item.id)}
                >
                  X
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h3>Bill Details</h3>

            <div className="summary-row">
              <span>Item Total</span>
              <span>{formatINR(total)}</span>
            </div>

            <div className="summary-row">
              <span>Delivery Fee</span>
              <span>{formatINR(40)}</span>
            </div>

            <div className="summary-row total">
              <span>Total</span>
              <span>{formatINR(total + 40)}</span>
            </div>

            <button
              className="checkout-btn"
              onClick={() => setShowCheckoutBill(true)}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;

