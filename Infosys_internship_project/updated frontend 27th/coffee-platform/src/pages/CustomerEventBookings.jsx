import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CheckoutBill from "../dashboards/CheckoutBill";
import { downloadReceiptPdf } from "../dashboards/OrderReceipt";
import "./CustomerEventBookings.css";
import { formatINR } from "../utils/currency";
import { getBookingRefund, recordRefund } from "../utils/refundPolicy";
import { getEventFeedbackForCustomer, saveEventFeedback } from "../utils/feedbackStore";
import {
  cancelEventBooking,
  getCustomerEventBookings,
  getEventStoreSignal,
  getReservedSeatsForEvent,
  getStoredEvents,
  reserveEventBooking,
} from "../utils/eventStore";
import { resolveEventImage } from "../utils/eventImages";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

const isMoreThan24HoursOld = (value) => {
  if (!value) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && Date.now() - parsed.getTime() >= TWENTY_FOUR_HOURS_MS;
};

const isBackendEventRequest = (booking) =>
  String(booking?.occasion || "").toLowerCase() === "event_booking" ||
  String(booking?.seatingPreference || "").toLowerCase() === "event booking" ||
  String(booking?.notes || "").toLowerCase().includes("event booking request");

const formatBackendEventType = (value) =>
  String(value || "Event")
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const mapBackendEventRequest = (booking, events = []) => {
  const eventTitle = booking.customCelebrationType || "Event Booking";
  const matchedEvent = events.find((event) => event.title === eventTitle);
  return {
    id: `backend-${booking.id}`,
    backendBookingId: booking.id,
    eventId: matchedEvent?.id || `backend-${booking.id}`,
    cafeId: booking.cafeId,
    cafeName: booking.cafeName,
    eventTitle,
    eventType: matchedEvent?.eventType || formatBackendEventType(booking.celebrationType),
    imageUrl: matchedEvent?.imageUrl || "",
    eventDate: booking.bookingDate || "",
    eventTime: booking.bookingTime || "",
    customerId: booking.customerId,
    customerName: booking.name || "Customer",
    customerEmail: booking.email || "",
    requestedEventType: matchedEvent?.eventType || formatBackendEventType(booking.celebrationType),
    bookingDate: booking.bookingDate || "",
    bookingTime: booking.bookingTime || "",
    guestCount: booking.people || 1,
    seats: booking.people || 1,
    advanceAmount: Number(booking.advancePaymentAmount || 0),
    quotedPrice: Number(booking.advancePaymentAmount || 0),
    totalAmount: Number(booking.advancePaymentAmount || 0),
    bookingStatus: booking.status || "PENDING",
    approvalStatus: booking.status || "PENDING",
    refundAmount: booking.refundAmount,
    refundStatus: booking.refundStatus,
    bookedAt: booking.createdAt || "",
    requestedAt: booking.createdAt || "",
  };
};

const mergeEventBookings = (localBookings, backendBookings) => {
  const merged = new Map();
  [...localBookings, ...backendBookings].forEach((booking) => {
    const key = booking.backendBookingId ? `backend-${booking.backendBookingId}` : String(booking.id);
    merged.set(key, { ...(merged.get(key) || {}), ...booking });
  });
  return [...merged.values()].sort((a, b) => {
    const aTime = new Date(a.bookedAt || a.requestedAt || 0).getTime() || Number(String(a.id).replace(/\D/g, "") || 0);
    const bTime = new Date(b.bookedAt || b.requestedAt || 0).getTime() || Number(String(b.id).replace(/\D/g, "") || 0);
    return bTime - aTime;
  });
};

const CustomerEventBookings = ({ user }) => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [seatSelections, setSeatSelections] = useState({});
  const [paymentEvent, setPaymentEvent] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [feedbackDrafts, setFeedbackDrafts] = useState({});
  const [submittedFeedback, setSubmittedFeedback] = useState([]);
  const [chefOrders, setChefOrders] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const nextEvents = getStoredEvents();
      setEvents(nextEvents);
      if (user?.id) {
        let backendBookings = [];
        try {
          const response = await fetch(`http://localhost:8081/api/bookings/customer/${user.id}`);
          const data = response.ok ? await response.json() : [];
          backendBookings = (Array.isArray(data) ? data : [])
            .filter(isBackendEventRequest)
            .map((booking) => mapBackendEventRequest(booking, nextEvents));
        } catch {
          backendBookings = [];
        }
        setBookings(mergeEventBookings(getCustomerEventBookings(user.id), backendBookings));
        setSubmittedFeedback(getEventFeedbackForCustomer(user.id));
      } else {
        setBookings([]);
        setSubmittedFeedback([]);
      }
    };

    loadData();
    const signal = getEventStoreSignal();
    window.addEventListener(signal, loadData);
    window.addEventListener("storage", loadData);

    return () => {
      window.removeEventListener(signal, loadData);
      window.removeEventListener("storage", loadData);
    };
  }, [user?.id]);

  useEffect(() => {
    const cafeIds = [...new Set(bookings.map((booking) => booking.cafeId).filter(Boolean))];
    if (cafeIds.length === 0) {
      setChefOrders([]);
      return;
    }

    Promise.all(
      cafeIds.map((cafeId) =>
        fetch(`http://localhost:8081/api/orders/cafe/${cafeId}`)
          .then((res) => (res.ok ? res.json() : []))
          .catch(() => [])
      )
    ).then((responses) => {
      setChefOrders(responses.flat().filter(Boolean));
    });
  }, [bookings]);

  const isEventFoodServed = (booking) => {
    if (!booking?.chefOrderId) return false;
    const linkedOrder = chefOrders.find((order) => String(order.id) === String(booking.chefOrderId));
    const status = String(linkedOrder?.orderStatus || linkedOrder?.status || "").trim().toLowerCase();
    return ["served", "delivered", "completed"].includes(status);
  };

  const getEventPreparationRefundStatus = (booking) => {
    const staffStatus = String(booking?.eventStaffStatus || "").trim().toUpperCase();
    if (staffStatus === "COMPLETED") return "COMPLETED";
    if (staffStatus === "IN_PROGRESS") return "IN_PROGRESS";
    if (staffStatus === "EVENT_ORDER") return "EVENT_ORDER";

    if (!booking?.chefOrderId) return staffStatus || booking?.bookingStatus || "PENDING";

    const linkedOrder = chefOrders.find((order) => String(order.id) === String(booking.chefOrderId));
    const foodStatus = String(linkedOrder?.orderStatus || linkedOrder?.status || "").trim().toLowerCase();
    if (["served", "delivered", "completed", "ready", "prepared"].includes(foodStatus)) return "COMPLETED";
    if (["preparing", "in progress", "approved"].includes(foodStatus)) return "IN_PROGRESS";
    return staffStatus || booking?.bookingStatus || "PENDING";
  };

  const isEventCancellationBlocked = (booking) => {
    const status = String(booking?.bookingStatus || "").toUpperCase();
    if (["CANCELLED", "REJECTED"].includes(status)) return true;
    if (isMoreThan24HoursOld(booking?.bookedAt || booking?.requestedAt || booking?.createdAt)) return true;
    const preparationStatus = getEventPreparationRefundStatus(booking);
    return preparationStatus === "COMPLETED" || isEventFoodServed(booking);
  };

  const eventCards = useMemo(
    () =>
      events.map((event) => {
        const reservedSeats = getReservedSeatsForEvent(event.id);
        const availableSeats = Math.max(0, Number(event.capacity || 0) - reservedSeats);
        const existingBooking = bookings.find((booking) => String(booking.eventId) === String(event.id));
        return {
          ...event,
          reservedSeats,
          availableSeats,
          existingBooking,
        };
      }),
    [events, bookings]
  );

  const myBookings = useMemo(
    () =>
      bookings
        .map((booking) => {
          const matchedEvent = events.find((event) => String(event.id) === String(booking.eventId));
          return {
            ...booking,
            eventDate: matchedEvent?.eventDate || booking.eventDate || booking.bookingDate || "",
            eventTime: matchedEvent?.eventTime || booking.eventTime || booking.bookingTime || "",
            eventType: matchedEvent?.eventType || booking.eventType || booking.requestedEventType || "",
            imageUrl: matchedEvent?.imageUrl || booking.imageUrl || "",
          };
        })
        .sort((a, b) => {
          const aTime = new Date(a.bookedAt || a.createdAt || 0).getTime() || Number(a.id || 0);
          const bTime = new Date(b.bookedAt || b.createdAt || 0).getTime() || Number(b.id || 0);
          return bTime - aTime;
        }),
    [bookings, events]
  );

  const handleSeatChange = (eventId, value, availableSeats) => {
    const nextSeats = Math.max(1, Number(value || 1));
    setSeatSelections((prev) => ({
      ...prev,
      [eventId]: Math.min(nextSeats, Math.max(1, Number(availableSeats || 1))),
    }));
  };

  const handleBookEvent = (event) => {
    setFeedback("");
    setError("");

    if (!user?.id) {
      setError("Please login before booking an event.");
      return;
    }

    if (event.availableSeats === 0) {
      setError("This event is sold out.");
      return;
    }

    setPaymentEvent(event);
  };

  const handleResetEvent = (eventId) => {
    setFeedback("");
    setError("");
    setSeatSelections((prev) => ({
      ...prev,
      [eventId]: 1,
    }));
  };

  const handleCancelEvent = async (booking) => {
    setFeedback("");
    setError("");
    if (isEventCancellationBlocked(booking)) return;

    const confirmCancel = window.confirm("Are you sure you want to cancel this event booking?");
    if (!confirmCancel) return;

    const paidAmount = Number(booking.advanceAmount || booking.totalAmount || 0);
    const { refundAmount, cancellationFee, refundPercentage } = getBookingRefund({
      paidAmount,
      bookingDate: booking.bookingDate || booking.eventDate || "",
      bookingTime: booking.bookingTime || booking.eventTime || "",
      createdAt: booking.bookedAt || booking.createdAt || "",
      type: "EVENT",
      status: getEventPreparationRefundStatus(booking),
    });
    const refundRecord = recordRefund({
      type: "EVENT",
      bookingId: booking.id,
      customerId: booking.customerId,
      cafeId: booking.cafeId,
      cafeName: booking.cafeName,
      paidAmount,
      refundAmount,
      cancellationFee,
      refundPercentage,
    });
    if (booking.backendBookingId) {
      try {
        await fetch(`http://localhost:8081/api/bookings/${booking.backendBookingId}/cancel?reason=${encodeURIComponent("Cancelled by customer")}`, {
          method: "PUT",
        });
      } catch {
        // Local cancellation is still recorded below if the backend is unavailable.
      }
    }
    downloadReceiptPdf({
      orderId: `REF-${booking.id}`,
      date: refundRecord?.processedAt ? new Date(refundRecord.processedAt).toLocaleString() : new Date().toLocaleString(),
      items: [
        {
          name: "Event booking refund",
          qty: 1,
          price: refundAmount,
        },
        {
          name: "Cancellation fee deducted",
          qty: 1,
          price: cancellationFee,
        },
      ],
      subtotal: paidAmount,
      discount: cancellationFee,
      tax: 0,
      total: refundAmount,
      cafeName: booking.cafeName || `Cafe #${booking.cafeId}`,
    });
    cancelEventBooking(booking.id, {
      refundAmount,
      cancellationFee,
      refundPercentage,
      refundStatus: "PROCESSED",
    });
    setBookings((prev) =>
      prev.map((item) =>
        String(item.id) === String(booking.id)
          ? { ...item, bookingStatus: "CANCELLED", refundAmount, cancellationFee, refundPercentage, refundStatus: "PROCESSED" }
          : item
      )
    );
    alert(`${booking.eventTitle} event booking cancelled. ${formatINR(refundAmount)} has been refunded to your account. Cancellation fee: ${formatINR(cancellationFee)}.`);
  };

  const handleFeedbackDraftChange = (bookingId, field, value) => {
    setFeedbackDrafts((prev) => ({
      ...prev,
      [bookingId]: {
        rating: 5,
        message: "",
        ...(prev[bookingId] || {}),
        [field]: value,
      },
    }));
  };

  const handleSubmitFeedback = (booking) => {
    const draft = feedbackDrafts[booking.id] || {};
    const message = String(draft.message || "").trim();

    if (!message) {
      setError("Please write feedback before submitting.");
      return;
    }

    const saved = saveEventFeedback({
      bookingId: booking.id,
      eventId: booking.eventId,
      eventTitle: booking.eventTitle,
      cafeId: booking.cafeId,
      cafeName: booking.cafeName,
      customerId: booking.customerId,
      customerName: booking.customerName,
      rating: draft.rating || 5,
      message,
    });

    setSubmittedFeedback((prev) => [saved, ...prev]);
    setFeedbackDrafts((prev) => ({ ...prev, [booking.id]: { rating: 5, message: "" } }));
    setError("");
    setFeedback("Feedback submitted successfully.");
  };

  const handleEventPaymentSuccess = (billSummary) => {
    if (!paymentEvent) return;

    try {
      const savedBooking = reserveEventBooking({
        eventId: paymentEvent.id,
        customerId: user?.id,
        customerName:
          [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
          user?.email ||
          "Customer",
        customerEmail: user?.email || "",
        seats: seatSelections[paymentEvent.id] || 1,
        advanceAmount: billSummary.total,
      });
      setBookings((prev) => [savedBooking, ...prev.filter((booking) => String(booking.id) !== String(savedBooking.id))]);
      setPaymentEvent(null);
      setFeedback(`Booked ${paymentEvent.title} successfully. Advance payment of ${formatINR(billSummary.total)} received via Razorpay.`);
    } catch (bookingError) {
      setPaymentEvent(null);
      setError(bookingError.message || "Could not book this event.");
    }
  };

  const paymentItems = paymentEvent
    ? [
        {
          id: `event-booking-${paymentEvent.id}`,
          name: `${paymentEvent.title} Advance Payment`,
          price: Number(paymentEvent.price || 0) * (seatSelections[paymentEvent.id] || 1),
          quantity: 1,
        },
      ]
    : [];

  return (
    <div className="customer-events-page">
      {paymentEvent && (
        <CheckoutBill
          cartItems={paymentItems}
          onBack={() => setPaymentEvent(null)}
          onProceed={handleEventPaymentSuccess}
          exactPayment
        />
      )}

      <div className="card">
        <h3>My Event Bookings</h3>
        {feedback && <p className="customer-events-feedback success">{feedback}</p>}
        {error && <p className="customer-events-feedback error">{error}</p>}
        {myBookings.length === 0 ? (
          <p>No event bookings yet.</p>
        ) : (
          <div className="customer-events-grid">
            {myBookings.map((booking) => {
              const cancelled = String(booking.bookingStatus || "").toUpperCase() === "CANCELLED";
              const cancellationBlocked = isEventCancellationBlocked(booking);
              return (
              <article key={booking.id} className={`customer-event-card ${cancelled ? "cancelled" : ""}`}>
                <img
                  className="customer-event-image"
                  src={resolveEventImage(booking.eventType, booking.imageUrl)}
                  alt={booking.eventTitle}
                />
                <div className="customer-event-top">
                  <div>
                    <h4>{booking.eventTitle}</h4>
                    <p>{booking.cafeName}</p>
                  </div>
                </div>
                <div className="customer-event-meta">
                  <span>{booking.eventDate || "-"}</span>
                  <span>{booking.eventTime || "-"}</span>
                  <span>{booking.seats} seat(s)</span>
                  <span>Advance {formatINR(booking.advanceAmount || booking.totalAmount || 0)}</span>
                </div>
                <div className="customer-event-booked">
                  {booking.bookingStatus || "PENDING"} | Paid via Razorpay
                </div>
                {booking.refundStatus && (
                  <div className="customer-event-refund">
                    Refund {booking.refundStatus}: {formatINR(booking.refundAmount || 0)} | Fee {formatINR(booking.cancellationFee || 0)}
                  </div>
                )}
                <div className="customer-event-control-row">
                  <div className="customer-event-actions booking-actions">
                    <button
                      type="button"
                      className="btn secondary"
                      disabled={cancellationBlocked}
                      onClick={() => handleCancelEvent(booking)}
                    >
                      {cancelled ? "Cancelled" : "Cancel Event"}
                    </button>
                    <button
                      type="button"
                      className="btn secondary"
                      disabled={!booking.cafeId}
                      onClick={() => navigate(`/cafe/${booking.cafeId}?section=events`)}
                    >
                      Book Again
                    </button>
                  </div>
                  {!cancelled && (
                    <div className="customer-event-feedback-form">
                      <select
                        value={feedbackDrafts[booking.id]?.rating || 5}
                        onChange={(e) => handleFeedbackDraftChange(booking.id, "rating", e.target.value)}
                      >
                        <option value="5">5 - Excellent</option>
                        <option value="4">4 - Good</option>
                        <option value="3">3 - Average</option>
                        <option value="2">2 - Poor</option>
                        <option value="1">1 - Bad</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Share event feedback"
                        value={feedbackDrafts[booking.id]?.message || ""}
                        onChange={(e) => handleFeedbackDraftChange(booking.id, "message", e.target.value)}
                      />
                      <button type="button" className="btn primary" onClick={() => handleSubmitFeedback(booking)}>
                        Submit Feedback
                      </button>
                      {submittedFeedback.some((item) => String(item.bookingId) === String(booking.id)) && (
                        <span className="customer-event-feedback-saved">Feedback sent</span>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerEventBookings;
