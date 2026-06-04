import React, { useState, useEffect } from "react";
import { updateReservationStatus } from "../../api/api";
import {
  fetchFeedbackForCafe,
  getCustomerFeedbackForCafe,
  getCustomerFeedbackSignal,
} from "../../utils/feedbackStore";
import "./ReservationManagement.css";

const getReservationStatusClass = (status) => {
  const normalized = String(status || "UNKNOWN").toLowerCase();

  if (normalized.includes("pending")) return "pending";
  if (normalized.includes("approve")) return "approved";
  if (normalized.includes("cancel")) return "declined";
  if (normalized.includes("declin") || normalized.includes("reject")) return "declined";
  if (normalized.includes("complete")) return "completed";

  return "neutral";
};

const formatReservationLabel = (value) =>
  String(value || '')
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const getReservationDateTime = (reservation) => {
  if (reservation?.createdAt) {
    const createdAtDate = new Date(reservation.createdAt);
    if (!Number.isNaN(createdAtDate.getTime())) {
      return createdAtDate.toLocaleString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    }
  }

  return `${reservation?.bookingDate || '-'} ${reservation?.bookingTime || ''}`.trim();
};

const getReservationSortTime = (reservation) => {
  if (reservation?.createdAt) {
    const createdAtDate = new Date(reservation.createdAt);
    if (!Number.isNaN(createdAtDate.getTime())) {
      return createdAtDate.getTime();
    }
  }

  const bookingDate = String(reservation?.bookingDate || "").trim();
  const bookingTime = String(reservation?.bookingTime || "").trim();

  if (bookingDate && bookingTime) {
    const bookingDateTime = new Date(`${bookingDate}T${bookingTime}`);
    if (!Number.isNaN(bookingDateTime.getTime())) {
      return bookingDateTime.getTime();
    }
  }

  if (bookingDate) {
    const bookingOnlyDate = new Date(bookingDate);
    if (!Number.isNaN(bookingOnlyDate.getTime())) {
      return bookingOnlyDate.getTime();
    }
  }

  return Number(reservation?.id || 0);
};

const ReservationManagement = ({ cafeId: selectedCafeId, onSuccess }) => {
  const [reservations, setReservations] = useState([]);
  const [tableFeedback, setTableFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Fetch reservations whenever cafeId changes
  useEffect(() => {
    if (!selectedCafeId) {
      setReservations([]);
      setLoading(false);
      return;
    }

    const fetchReservations = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`http://localhost:8081/api/bookings/cafe/${selectedCafeId}`);
        if (!res.ok) throw new Error("Failed to fetch bookings");
        const data = await res.json();
        const normalizedData = Array.isArray(data) ? data : [];
        normalizedData.sort((a, b) => {
          const aTime = getReservationSortTime(a);
          const bTime = getReservationSortTime(b);

          if (aTime !== bTime) {
            return aTime - bTime;
          }

          return Number(a?.id || 0) - Number(b?.id || 0);
        });
        setReservations(normalizedData);
      } catch (err) {
        console.error(err);
        setError("Could not load booking requests");
        setReservations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();

    const refreshInterval = window.setInterval(fetchReservations, 10000);

    return () => window.clearInterval(refreshInterval);
  }, [selectedCafeId]);

  useEffect(() => {
    if (!selectedCafeId) {
      setTableFeedback([]);
      return;
    }

    const loadFeedback = () => {
      const localFeedback = getCustomerFeedbackForCafe(selectedCafeId).filter((item) => item.type === "TABLE");
      setTableFeedback(localFeedback);

      fetchFeedbackForCafe(selectedCafeId)
        .then((feedback) => {
          const merged = new Map();
          [...localFeedback, ...feedback.filter((item) => item.type === "TABLE")].forEach((item) => {
            merged.set(String(item.targetId), item);
          });
          setTableFeedback([...merged.values()]);
        })
        .catch(() => setTableFeedback(localFeedback));
    };

    loadFeedback();
    window.addEventListener(getCustomerFeedbackSignal(), loadFeedback);
    window.addEventListener("storage", loadFeedback);

    return () => {
      window.removeEventListener(getCustomerFeedbackSignal(), loadFeedback);
      window.removeEventListener("storage", loadFeedback);
    };
  }, [selectedCafeId]);

  const updateBooking = async (id, status) => {
    setActionLoadingId(id);
    setError("");
    try {
      const updated = await updateReservationStatus(id, status);
      setReservations((prev) =>
        prev.map((reservation) =>
          reservation.id === id ? { ...reservation, ...updated } : reservation
        )
      );
      onSuccess?.(`Reservation ${String(status).toLowerCase()} successfully.`);
    } catch (err) {
      console.error(err);
      setError("Could not update booking status");
    } finally {
      setActionLoadingId(null);
    }
  };

  const approve = async (id) => {
    await updateBooking(id, "APPROVED");
  };

  const decline = async (id) => {
    await updateBooking(id, "DECLINED");
  };

  return (
    <div className="reservation-management-section">
      <h3 className="reservation-title">Table Booking Requests</h3>

      {loading && <p>Loading booking requests...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && reservations.length === 0 && <p>No booking requests yet</p>}

      <div className="reservations-grid">
        <div className="reservations-header">
          <div>ID</div>
          <div>Customer</div>
          <div>Date & Time</div>
          <div>Status</div>
          <div>Approve</div>
          <div>Decline</div>
        </div>

        {reservations.map((r, index) => {
            const feedback = tableFeedback.find((item) => String(item.targetId) === String(r.id));

            return (
              <div key={r.id} className="reservation-row">
                <div>{index + 1}</div>
                <div>
                  <strong>{r.name}</strong>
                  <div>{r.phone}</div>
                  <div>{r.tableNumber ? `Table ${r.tableNumber}` : 'Table pending'}</div>
                  {r.celebrationEvent && (
                    <>
                      <div>
                        Event: {r.celebrationType === 'other'
                          ? r.customCelebrationType || 'Other Event'
                          : formatReservationLabel(r.celebrationType)}
                      </div>
                      {r.decorationTheme && <div>Theme: {formatReservationLabel(r.decorationTheme)}</div>}
                      {r.surpriseSetup && <div>Surprise setup requested</div>}
                      {r.cakeMessage && <div>Cake: {r.cakeMessage}</div>}
                    </>
                  )}
                  {feedback && (
                    <div className="reservation-feedback-note">
                      Feedback: {feedback.rating}/5 - {feedback.message}
                    </div>
                  )}
                </div>
                <div>{getReservationDateTime(r)}</div>
                <div>
                  <span className={`reservation-status-pill ${getReservationStatusClass(r.status)}`}>
                    {r.status || "Pending"}
                  </span>
                  {r.refundStatus && (
                    <div className="reservation-refund-note">
                      Refund {r.refundStatus}: Rs. {Number(r.refundAmount || 0).toFixed(2)}
                    </div>
                  )}
                </div>
                <button
                  className="reservation-btn reservation-approve"
                  onClick={() => approve(r.id)}
                  disabled={actionLoadingId === r.id || ["APPROVED", "CANCELLED", "DECLINED"].includes(String(r.status).toUpperCase())}
                >
                  {actionLoadingId === r.id ? "Updating..." : "Approve"}
                </button>
                <button
                  className="reservation-btn reservation-decline"
                  onClick={() => decline(r.id)}
                  disabled={actionLoadingId === r.id || ["CANCELLED", "DECLINED"].includes(String(r.status).toUpperCase())}
                >
                  {actionLoadingId === r.id ? "Updating..." : "Decline"}
                </button>
              </div>
            );
        })}
      </div>
    </div>
  );
};

export default ReservationManagement;




// import React, { useState, useEffect } from "react";
// import { updateReservationStatus } from "../../api/api";
// import "./ReservationManagement.css";

// const ReservationManagement = () => {

//   const [reservations, setReservations] = useState([]);
//   const [cafeId, setCafeId] = useState(localStorage.getItem("cafeId"));

// useEffect(() => {
//   const handleCafeChange = () => setCafeId(localStorage.getItem("cafeId"));
//   window.addEventListener("cafeChanged", handleCafeChange);
//   return () => window.removeEventListener("cafeChanged", handleCafeChange);
// }, []);

//   // ⭐ FETCH RESERVATIONS BASED ON SELECTED CAFE
//   const fetchReservations = async () => {

//     const cafeId = localStorage.getItem("cafeId");

//     if (!cafeId) return;

//     try {

//       const res = await fetch(`http://localhost:8081/api/reservations/cafe/${cafeId}`);
//       const data = await res.json();

//       setReservations(data);

//     } catch (err) {

//       console.error("Error fetching reservations:", err);

//     }

//   };

//   // ⭐ LOAD RESERVATIONS ON PAGE LOAD
//   // useEffect(() => {

//   //   fetchReservations();

//   // }, []);
//   useEffect(() => {
//   if (!cafeId) return;
//   fetchReservations();
// }, [cafeId]);


//   // ⭐ RELOAD WHEN CAFE CHANGES
//   useEffect(() => {

//     const handleCafeChange = () => {

//       fetchReservations();

//     };

//     window.addEventListener("cafeChanged", handleCafeChange);

//     return () => {

//       window.removeEventListener("cafeChanged", handleCafeChange);

//     };

//   }, []);

//   const approve = async (id) => {

//     await updateReservationStatus(id, "Approved");

//     // setReservations(
//     //   reservations.map((r) =>
//     //     r.id === id ? { ...r, status: "Approved" } : r
//     //   )
//     // );
//     setReservations(prev => prev.map(r => r.id === id ? { ...r, status: "Approved" } : r));


//   };

//   const decline = async (id) => {

//     await updateReservationStatus(id, "Declined");

//     setReservations(
//       reservations.map((r) =>
//         r.id === id ? { ...r, status: "Declined" } : r
//       )
//     );

//   };

//   return (

//     <div className="reservation-management-section">

//       <h3 className="reservation-title">Reservations</h3>

//       <div className="reservations-grid">

//         <div className="reservations-header">
//           <div>ID</div>
//           <div>Customer</div>
//           <div>Date</div>
//           <div>Status</div>
//           <div>Approve</div>
//           <div>Decline</div>
//         </div>

//         {reservations.map((r) => (

//           <div key={r.id} className="reservation-row">

//             <div>{r.id}</div>

//             <div>{r.customer}</div>

//             <div>{r.date}</div>

//             <div className="reservation-status">
//               {r.status}
//             </div>

//             <button
//               className="reservation-btn reservation-approve"
//               onClick={() => approve(r.id)}
//             >
//               Approve
//             </button>

//             <button
//               className="reservation-btn reservation-decline"
//               onClick={() => decline(r.id)}
//             >
//               Decline
//             </button>

//           </div>

//         ))}

//       </div>

//     </div>

//   );

// };

// export default ReservationManagement;

