import React, { useEffect, useMemo, useState } from "react";
import "./CustomerProfileInOwnerDb.css";

const getLatestTimestamp = (order, booking) => {
  const orderTime = order?.createdAt ? new Date(order.createdAt).getTime() : 0;
  const bookingTimeString =
    booking?.bookingDate && booking?.bookingTime
      ? `${booking.bookingDate}T${booking.bookingTime}`
      : booking?.bookingDate || null;
  const bookingTime = bookingTimeString ? new Date(bookingTimeString).getTime() : 0;

  return Math.max(orderTime || 0, bookingTime || 0);
};

const formatDateTime = (timestamp) => {
  if (!timestamp) {
    return "Activity time unavailable";
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "Activity time unavailable";
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const buildCustomerKey = (entry) =>
  entry.customerId || entry.email || entry.phone || entry.customer || entry.name || `guest-${entry.id}`;

const CustomerProfile = ({ cafeId }) => {
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!cafeId) {
      setOrders([]);
      setBookings([]);
      setLoading(false);
      return;
    }

    const fetchCustomersData = async () => {
      setLoading(true);
      setError("");

      try {
        const [ordersResponse, bookingsResponse] = await Promise.all([
          fetch(`http://localhost:8081/api/orders/cafe/${cafeId}`),
          fetch(`http://localhost:8081/api/bookings/cafe/${cafeId}`),
        ]);

        if (!ordersResponse.ok || !bookingsResponse.ok) {
          throw new Error("Failed to fetch customer activity");
        }

        const [ordersData, bookingsData] = await Promise.all([
          ordersResponse.json(),
          bookingsResponse.json(),
        ]);

        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      } catch (err) {
        console.error(err);
        setOrders([]);
        setBookings([]);
        setError("Could not load customer activity for this cafe.");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomersData();
  }, [cafeId]);

  const customers = useMemo(() => {
    const customerMap = new Map();

    orders.forEach((order) => {
      const key = buildCustomerKey(order);
      const existing = customerMap.get(key) || {
        id: key,
        name: order.customer || "Guest customer",
        email: "",
        phone: "",
        ordersCount: 0,
        bookingsCount: 0,
        latestOrder: null,
        latestBooking: null,
      };

      existing.name = existing.name || order.customer || "Guest customer";
      existing.ordersCount += 1;

      const currentLatest = existing.latestOrder?.createdAt
        ? new Date(existing.latestOrder.createdAt).getTime()
        : 0;
      const nextOrderTime = order.createdAt ? new Date(order.createdAt).getTime() : 0;
      if (nextOrderTime >= currentLatest) {
        existing.latestOrder = order;
      }

      customerMap.set(key, existing);
    });

    bookings.forEach((booking) => {
      const key = buildCustomerKey(booking);
      const existing = customerMap.get(key) || {
        id: key,
        name: booking.name || "Guest customer",
        email: "",
        phone: "",
        ordersCount: 0,
        bookingsCount: 0,
        latestOrder: null,
        latestBooking: null,
      };

      existing.name = existing.name || booking.name || "Guest customer";
      existing.email = existing.email || booking.email || "";
      existing.phone = existing.phone || booking.phone || "";
      existing.bookingsCount += 1;

      const bookingTimeString =
        booking.bookingDate && booking.bookingTime
          ? `${booking.bookingDate}T${booking.bookingTime}`
          : booking.bookingDate || null;
      const latestStoredString =
        existing.latestBooking?.bookingDate && existing.latestBooking?.bookingTime
          ? `${existing.latestBooking.bookingDate}T${existing.latestBooking.bookingTime}`
          : existing.latestBooking?.bookingDate || null;
      const currentLatest = latestStoredString ? new Date(latestStoredString).getTime() : 0;
      const nextTime = bookingTimeString ? new Date(bookingTimeString).getTime() : 0;
      if (nextTime >= currentLatest) {
        existing.latestBooking = booking;
      }

      customerMap.set(key, existing);
    });

    return Array.from(customerMap.values())
      .map((customer) => {
        const latestTimestamp = getLatestTimestamp(customer.latestOrder, customer.latestBooking);
        const latestSource =
          customer.latestOrder && latestTimestamp === new Date(customer.latestOrder.createdAt).getTime()
            ? "Order"
            : customer.latestBooking
              ? "Reservation"
              : "Visit";

        return {
          ...customer,
          latestTimestamp,
          latestSource,
        };
      })
      .sort((left, right) => {
        if (right.latestTimestamp !== left.latestTimestamp) {
          return right.latestTimestamp - left.latestTimestamp;
        }

        return String(left.name).localeCompare(String(right.name));
      });
  }, [orders, bookings]);

  const filteredCustomers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return customers;

    return customers.filter((customer) =>
      [customer.name, customer.email, customer.phone].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }, [customers, searchTerm]);

  return (
    <section className="customer-profile-section">
      <div className="customers-topbar">
        <div>
          <p className="customers-eyebrow">Customers</p>
          <h3>Recent visitors and regulars</h3>
          <p className="customers-description">
            This list combines cafe orders and table reservations, with the latest customer activity shown first.
          </p>
        </div>

        <div className="customers-controls">
          <input
            className="customers-search"
            type="text"
            placeholder="Search by name, email or phone"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <span className="customers-count-chip">{filteredCustomers.length} customers</span>
        </div>
      </div>

      {loading && <p className="customers-message">Loading customer activity...</p>}
      {error && <p className="customers-message customers-error">{error}</p>}
      {!loading && !error && filteredCustomers.length === 0 && (
        <p className="customers-message">No customers have placed orders or bookings for this cafe yet.</p>
      )}

      {!loading && !error && filteredCustomers.length > 0 && (
        <div className="customers-table-wrap">
          <div className="customers-header">
            <div>Customer</div>
            <div>Contact</div>
            <div>Orders</div>
            <div>Reservations</div>
            <div>Latest activity</div>
          </div>

          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="customer-row">
              <div className="customer-name-block">
                <div className="customer-avatar">{String(customer.name || "G").charAt(0).toUpperCase()}</div>
                <div>
                  <div className="customer-name">{customer.name || "Guest customer"}</div>
                  <div className="customer-meta">Source: {customer.latestSource}</div>
                </div>
              </div>

              <div className="customer-contact">
                <span>{customer.email || "Email unavailable"}</span>
                <span>{customer.phone || "Phone unavailable"}</span>
              </div>

              <div>
                <span className="customer-count-badge">{customer.ordersCount}</span>
              </div>

              <div>
                <span className="customer-count-badge secondary">{customer.bookingsCount}</span>
              </div>

              <div className="customer-activity">
                <span className="customer-activity-time">{formatDateTime(customer.latestTimestamp)}</span>
                <span className="customer-meta">
                  {customer.latestSource === "Order" ? "Latest order activity" : "Latest reservation activity"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default CustomerProfile;

