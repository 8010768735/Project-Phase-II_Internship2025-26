import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./EventManagement.css";
import {
  buildEventKitchenChecklist,
  buildEventPreparationChecklist,
  createCafeEvent,
  deleteCafeEvent,
  getEventBookingsForCafe,
  getBookingsForEvent,
  getEventsForCafe,
  getEventStoreSignal,
  getReservedSeatsForEvent,
  updateCafeEvent,
  updateEventBookingQuotedPrice,
  updateEventBookingStatus,
} from "../../utils/eventStore";
import { resolveEventImage } from "../../utils/eventImages";
import { getEventFeedbackForCafe, getEventFeedbackSignal } from "../../utils/feedbackStore";

const eventTypeOptions = [
  "Birthday",
  "Anniversary",
  "Baby Shower",
  "Farewell",
];

const getTodayInputDate = () => new Date().toISOString().slice(0, 10);

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

const mapBackendEventRequest = (booking, cafeEvents = []) => {
  const eventTitle = booking.customCelebrationType || "Event Booking";
  const matchedEvent = cafeEvents.find((event) => event.title === eventTitle);
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
    tableIds: [],
    tableLabels: [],
    decorationTheme: booking.decorationTheme || "",
    cakeOption: booking.cakeMessage || "",
    musicOption: "",
    foodPackage: "",
    setupOptions: {},
    customMessage: booking.notes || "",
    specialRequests: booking.notes || "",
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

const mergeEventRequests = (localBookings, backendBookings) => {
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

const EventManagement = ({ cafeId, cafeName, user, onSuccess, mode = "events" }) => {
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [chefOrders, setChefOrders] = useState([]);
  const [customerFeedback, setCustomerFeedback] = useState([]);
  const [form, setForm] = useState({
    title: "",
    eventType: "Birthday",
    eventDate: "",
    eventTime: "",
    eventEndTime: "",
    price: "",
    capacity: "",
    description: "",
    imageUrl: "",
  });
  const [error, setError] = useState("");
  const [editingEventId, setEditingEventId] = useState(null);
  const [priceDrafts, setPriceDrafts] = useState({});

  useEffect(() => {
    const loadEvents = async () => {
      if (!cafeId) {
        setEvents([]);
        setBookings([]);
        return;
      }
      const nextEvents = getEventsForCafe(cafeId);
      setEvents(nextEvents);
      const localBookings = getEventBookingsForCafe(cafeId);
      let backendBookings = [];
      try {
        const response = await axios.get(`http://localhost:8081/api/bookings/cafe/${cafeId}`);
        backendBookings = (Array.isArray(response.data) ? response.data : [])
          .filter(isBackendEventRequest)
          .map((booking) => mapBackendEventRequest(booking, nextEvents));
      } catch {
        backendBookings = [];
      }
      const nextBookings = mergeEventRequests(localBookings, backendBookings);
      setBookings(nextBookings);
      setPriceDrafts(
        nextBookings.reduce((acc, booking) => {
          acc[booking.id] = booking.quotedPrice ?? booking.totalAmount ?? 0;
          return acc;
        }, {})
      );
    };

    loadEvents();
    const signal = getEventStoreSignal();
    window.addEventListener(signal, loadEvents);
    window.addEventListener("storage", loadEvents);

    return () => {
      window.removeEventListener(signal, loadEvents);
      window.removeEventListener("storage", loadEvents);
    };
  }, [cafeId]);

  useEffect(() => {
    const loadChefOrders = async () => {
      if (!cafeId) {
        setChefOrders([]);
        return;
      }

      try {
        const response = await axios.get(`http://localhost:8081/api/orders/cafe/${cafeId}`);
        setChefOrders(Array.isArray(response.data) ? response.data : []);
      } catch {
        setChefOrders([]);
      }
    };

    loadChefOrders();
    const intervalId = window.setInterval(loadChefOrders, 5000);
    return () => window.clearInterval(intervalId);
  }, [cafeId]);

  useEffect(() => {
    const loadFeedback = () => {
      setCustomerFeedback(cafeId ? getEventFeedbackForCafe(cafeId) : []);
    };

    loadFeedback();
    const signal = getEventFeedbackSignal();
    window.addEventListener(signal, loadFeedback);
    window.addEventListener("storage", loadFeedback);

    return () => {
      window.removeEventListener(signal, loadFeedback);
      window.removeEventListener("storage", loadFeedback);
    };
  }, [cafeId]);

  const eventCards = useMemo(
    () =>
      events.map((event) => {
        const bookedSeats = getReservedSeatsForEvent(event.id);
        const bookings = getBookingsForEvent(event.id);
        return {
          ...event,
          bookedSeats,
          availableSeats: Math.max(0, Number(event.capacity || 0) - bookedSeats),
          bookings,
        };
      }),
    [events]
  );

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      handleChange("imageUrl", "");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      handleChange("imageUrl", typeof reader.result === "string" ? reader.result : "");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!cafeId) {
      setError("Select a cafe first.");
      return;
    }

    if (!form.title.trim() || !form.eventDate || !form.eventTime || !form.capacity || !form.imageUrl) {
      setError("Fill in the title, date, time, capacity, and upload an event image.");
      return;
    }

    const eventPayload = {
      cafeId,
      cafeName: cafeName || `Cafe #${cafeId}`,
      ownerId: user?.id ?? null,
      title: form.title.trim(),
      eventType: form.eventType,
      eventDate: form.eventDate,
      eventTime: form.eventTime,
      eventEndTime: form.eventEndTime,
      price: Number(form.price || 0),
      capacity: Number(form.capacity || 0),
      description: form.description.trim(),
      imageUrl: form.imageUrl,
    };

    if (editingEventId) {
      updateCafeEvent(editingEventId, eventPayload);
    } else {
      createCafeEvent(eventPayload);
    }

    setForm({
      title: "",
      eventType: "Birthday",
      eventDate: "",
      eventTime: "",
      eventEndTime: "",
      price: "",
      capacity: "",
      description: "",
      imageUrl: "",
    });
    setEditingEventId(null);
    setError("");
    onSuccess?.(editingEventId ? "Event updated successfully." : "Event added successfully.");
  };

  const handleEdit = (event) => {
    setEditingEventId(event.id);
    setForm({
      title: event.title || "",
      eventType: event.eventType || "Birthday",
      eventDate: event.eventDate || "",
      eventTime: event.eventTime || "",
      eventEndTime: event.eventEndTime || "",
      price: event.price ?? "",
      capacity: event.capacity ?? "",
      description: event.description || "",
      imageUrl: event.imageUrl || "",
    });
    setError("");
  };

  const handleCancelEdit = () => {
    setEditingEventId(null);
    setForm({
      title: "",
      eventType: "Birthday",
      eventDate: "",
      eventTime: "",
      eventEndTime: "",
      price: "",
      capacity: "",
      description: "",
      imageUrl: "",
    });
    setError("");
  };

  const handleDelete = (eventId) => {
    if (!window.confirm("Delete this event?")) return;
    deleteCafeEvent(eventId);
    onSuccess?.("Event deleted successfully.");
  };

  const sendEventPreparationToChef = async (booking) => {
    if (booking.chefOrderId) {
      return booking.chefOrderId;
    }

    const preparationItems = buildEventKitchenChecklist(booking);
    if (preparationItems.length === 0) {
      return null;
    }

    const orderResponse = await axios.post("http://localhost:8081/api/orders", {
      customer: booking.customerName || "Customer",
      customerId: booking.customerId,
      status: "Pending",
      cafeId: booking.cafeId,
      cafeName: booking.cafeName,
      tableNumber: Number(Array.isArray(booking.tableIds) ? booking.tableIds[0] || 0 : 0) || null,
      itemsSummary: JSON.stringify(
        preparationItems.map((item, index) => ({
          itemId: `event-${booking.id}-${index}`,
          itemName: item,
          name: item,
          qty: 1,
          price: 0,
        }))
      ),
      itemCount: preparationItems.length,
      totalAmount: Number(booking.quotedPrice || booking.totalAmount || 0),
    });

    return orderResponse.data?.id || null;
  };

  const handleBookingAction = async (bookingId, nextStatus) => {
    const booking = bookings.find((item) => String(item.id) === String(bookingId));

    try {
      if (booking?.backendBookingId) {
        await axios.put(`http://localhost:8081/api/bookings/${booking.backendBookingId}?status=${encodeURIComponent(nextStatus)}`);
      }

      if (String(nextStatus).toUpperCase() === "APPROVED" && booking) {
        const chefOrderId = await sendEventPreparationToChef(booking);
        updateEventBookingStatus(bookingId, nextStatus, {
          chefOrderId,
          eventStaffStatus: "EVENT_ORDER",
        });
      } else if (String(nextStatus).toUpperCase() === "REJECTED" && booking) {
        const paidAmount = Number(booking.advanceAmount || booking.totalAmount || 0);
        updateEventBookingStatus(bookingId, nextStatus, {
          refundAmount: paidAmount,
          cancellationFee: 0,
          refundPercentage: 100,
          refundStatus: "PROCESSED",
        });
      } else {
        updateEventBookingStatus(bookingId, nextStatus);
      }

      setBookings((prev) =>
        prev.map((item) =>
          String(item.id) === String(bookingId)
            ? { ...item, bookingStatus: String(nextStatus).toUpperCase(), approvalStatus: String(nextStatus).toUpperCase() }
            : item
        )
      );
      onSuccess?.(`Event booking ${String(nextStatus).toLowerCase()} successfully.`);
    } catch (error) {
      console.error("Failed to send event preparation to chef", error);
      onSuccess?.("Could not send event preparation to chef. Please try again.");
    }
  };

  const getFoodStatus = (booking) => {
    if (!booking.chefOrderId) {
      return buildEventKitchenChecklist(booking).length > 0 ? "Not sent" : "No food order";
    }

    const matchingOrder = chefOrders.find((order) => String(order.id) === String(booking.chefOrderId));
    return matchingOrder?.orderStatus || matchingOrder?.status || "Pending";
  };

  const getEventStaffStatus = (booking) => {
    const status = String(booking.eventStaffStatus || "").toUpperCase();
    if (status === "COMPLETED") return "Served";
    if (status === "IN_PROGRESS") return "In Progress";
    if (status === "EVENT_ORDER") return "Event Order";
    return "-";
  };

  const renderEventRequests = () => (
    <div className="owner-event-requests-section">
      <div className="owner-events-header">
        <div>
          <h2>Event Booking Requests</h2>
          <p>Approve, reject, or customize pricing for customer event requests.</p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="owner-events-empty">No customer event requests yet.</div>
      ) : (
        <div className="owner-event-requests-grid">
          <div className="owner-event-requests-header">
            <div>ID</div>
            <div>Customer</div>
            <div>Event Details</div>
            <div>Preparation</div>
            <div>Payment</div>
            <div>Status</div>
            <div>Food Status</div>
            <div>Price</div>
            <div>Approve</div>
            <div>Reject</div>
          </div>

          {bookings.map((booking, index) => (
            <div key={booking.id} className="owner-event-request-row">
              <div>{index + 1}</div>
              <div>
                <strong>{booking.customerName || "Customer"}</strong>
                <span>{booking.customerEmail || "-"}</span>
              </div>
              <div>
                <strong>{booking.eventTitle}</strong>
                <span>{booking.bookingDate || "-"} {booking.bookingTime || ""}</span>
                <span>{booking.guestCount || 0} guest(s)</span>
              </div>
              <div>
                {(booking.preparationChecklist || buildEventPreparationChecklist(booking)).slice(0, 4).map((item) => (
                  <span key={`${booking.id}-${item}`}>{item}</span>
                ))}
              </div>
              <div>
                <strong>Rs. {Number(booking.advanceAmount || 0).toFixed(2)}</strong>
                <span>Razorpay</span>
                {booking.refundStatus && (
                  <span>Refund {booking.refundStatus}: Rs. {Number(booking.refundAmount || 0).toFixed(2)}</span>
                )}
              </div>
              <div>
                <span className={`owner-booking-status status-${String(booking.bookingStatus || "PENDING").toLowerCase()}`}>
                  {booking.bookingStatus || "PENDING"}
                </span>
              </div>
              <div>
                <span>{getFoodStatus(booking)}</span>
              </div>
              <div>
                <strong>Rs. {Number(booking.quotedPrice || booking.totalAmount || 0).toFixed(2)}</strong>
              </div>
              <button
                type="button"
                className="owner-events-primary"
                onClick={() => handleBookingAction(booking.id, "APPROVED")}
                disabled={["APPROVED", "CANCELLED", "REJECTED"].includes(String(booking.bookingStatus || "").toUpperCase())}
              >
                Approve
              </button>
              <button
                type="button"
                className="owner-event-delete"
                onClick={() => handleBookingAction(booking.id, "REJECTED")}
                disabled={["CANCELLED", "REJECTED"].includes(String(booking.bookingStatus || "").toUpperCase())}
              >
                Reject
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="owner-event-feedback-section">
        <h3>Customer Feedback</h3>
        {customerFeedback.length === 0 ? (
          <div className="owner-events-empty">No event feedback yet.</div>
        ) : (
          <div className="owner-event-feedback-list">
            {customerFeedback.map((item) => (
              <article key={item.id} className="owner-event-feedback-card">
                <strong>{item.eventTitle}</strong>
                <span>{item.customerName || "Customer"} | Rating {item.rating}/5</span>
                <p>{item.message}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <section className="owner-events-section">
      <div className="owner-events-header">
        <div>
          <h2>{mode === "requests" ? "Event Requests" : "Events"}</h2>
          <p>
            {mode === "requests"
              ? "Review customer event booking requests for this cafe."
              : "Create events for this cafe so customers can view and book them."}
          </p>
        </div>
      </div>

      {!cafeId ? (
        <div className="owner-events-empty">Select a cafe to add events.</div>
      ) : mode === "requests" ? (
        renderEventRequests()
      ) : (
        <>
          <form className="owner-events-form" onSubmit={handleSubmit}>
            <div className="owner-events-form-grid">
              <input
                type="text"
                placeholder="Event title"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
              />
              <select value={form.eventType} onChange={(e) => handleChange("eventType", e.target.value)}>
                {eventTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <input type="date" max={getTodayInputDate()} value={form.eventDate} onChange={(e) => handleChange("eventDate", e.target.value)} />
              <input type="time" value={form.eventTime} onChange={(e) => handleChange("eventTime", e.target.value)} />
              <input type="time" value={form.eventEndTime} onChange={(e) => handleChange("eventEndTime", e.target.value)} />
              <input
                type="number"
                min="0"
                placeholder="Price"
                value={form.price}
                onChange={(e) => handleChange("price", e.target.value)}
              />
              <input
                type="number"
                min="1"
                placeholder="Capacity"
                value={form.capacity}
                onChange={(e) => handleChange("capacity", e.target.value)}
              />
            </div>
            <div className="owner-events-upload-row">
              <label className="owner-events-upload">
                <span>Event Image</span>
                <input type="file" accept="image/*" onChange={handleImageChange} />
              </label>
              {form.imageUrl && (
                <img
                  className="owner-events-upload-preview"
                  src={resolveEventImage(form.eventType, form.imageUrl)}
                  alt="Event preview"
                />
              )}
            </div>
            <textarea
              rows="4"
              placeholder="Event description"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
            {error && <div className="owner-events-error">{error}</div>}
            <div className="owner-events-actions">
              {editingEventId && (
                <button type="button" className="owner-events-secondary" onClick={handleCancelEdit}>
                  Cancel
                </button>
              )}
              <button type="submit" className="owner-events-primary">
                {editingEventId ? "Update Event" : "Add Event"}
              </button>
            </div>
          </form>

          <div className="owner-events-list">
            {eventCards.length === 0 ? (
              <div className="owner-events-empty">No events added for this cafe yet.</div>
            ) : (
              eventCards.map((event) => (
                <article key={event.id} className="owner-event-card">
                  <img
                    className="owner-event-image"
                    src={resolveEventImage(event.eventType, event.imageUrl)}
                    alt={event.title}
                  />
                  <div className="owner-event-card-top">
                    <div>
                      <h3>{event.title}</h3>
                      <p>{event.eventType} | {event.eventDate} | {event.eventTime}{event.eventEndTime ? ` - ${event.eventEndTime}` : ""}</p>
                    </div>
                    <div className="owner-event-card-actions">
                      <button type="button" className="owner-event-edit" onClick={() => handleEdit(event)}>
                        Edit
                      </button>
                      <button type="button" className="owner-event-delete" onClick={() => handleDelete(event.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="owner-event-meta">
                    <span>Price: Rs. {Number(event.price || 0).toFixed(2)}</span>
                    <span>Capacity: {event.capacity}</span>
                    <span>Booked: {event.bookedSeats}</span>
                    <span>Seats Left: {event.availableSeats}</span>
                  </div>
                  {event.description && <p className="owner-event-description">{event.description}</p>}
                </article>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default EventManagement;
