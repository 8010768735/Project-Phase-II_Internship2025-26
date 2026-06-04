import React, { useEffect, useMemo, useState } from "react";
import {
  fetchFeedbackForCafe,
  getCustomerFeedbackForCafe,
  getCustomerFeedbackSignal,
  getEventFeedbackForCafe,
  getEventFeedbackSignal,
} from "../../utils/feedbackStore";
import "./EventManagement.css";

const mergeFeedback = (...feedbackLists) => {
  const merged = new Map();
  feedbackLists.flat().forEach((item) => {
    const key = `${item.type || "EVENT"}-${item.targetId || item.bookingId || item.id}`;
    merged.set(key, { ...(merged.get(key) || {}), ...item });
  });
  return [...merged.values()];
};

const FeedbackManagement = ({ cafeId }) => {
  const [customerFeedback, setCustomerFeedback] = useState([]);
  const [eventFeedback, setEventFeedback] = useState([]);

  useEffect(() => {
    const loadFeedback = () => {
      if (!cafeId) {
        setCustomerFeedback([]);
        setEventFeedback([]);
        return;
      }

      const localCustomerFeedback = getCustomerFeedbackForCafe(cafeId);
      const localEventFeedback = getEventFeedbackForCafe(cafeId);

      setCustomerFeedback(localCustomerFeedback);
      setEventFeedback(localEventFeedback);

      fetchFeedbackForCafe(cafeId)
        .then((feedback) => {
          const backendCustomerFeedback = feedback.filter((item) => item.type !== "EVENT");
          const backendEventFeedback = feedback.filter((item) => item.type === "EVENT");
          setCustomerFeedback(mergeFeedback(localCustomerFeedback, backendCustomerFeedback));
          setEventFeedback(mergeFeedback(localEventFeedback, backendEventFeedback));
        })
        .catch(() => {
          setCustomerFeedback(localCustomerFeedback);
          setEventFeedback(localEventFeedback);
        });
    };

    loadFeedback();
    window.addEventListener(getCustomerFeedbackSignal(), loadFeedback);
    window.addEventListener(getEventFeedbackSignal(), loadFeedback);
    window.addEventListener("storage", loadFeedback);

    return () => {
      window.removeEventListener(getCustomerFeedbackSignal(), loadFeedback);
      window.removeEventListener(getEventFeedbackSignal(), loadFeedback);
      window.removeEventListener("storage", loadFeedback);
    };
  }, [cafeId]);

  const feedbackItems = useMemo(
    () =>
      [
        ...customerFeedback.map((item) => ({
          ...item,
          feedbackType: item.type === "TABLE" ? "Table Booking" : "Menu Order",
          displayTitle: item.title || (item.type === "TABLE" ? "Table booking" : "Menu order"),
        })),
        ...eventFeedback.map((item) => ({
          ...item,
          feedbackType: "Event Booking",
          displayTitle: item.eventTitle || item.title || "Event booking",
        })),
      ].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()),
    [customerFeedback, eventFeedback]
  );

  return (
    <section className="owner-events-section">
      <div className="owner-events-header">
        <div>
          <h2>Customer Feedback</h2>
          <p>View menu order, table booking, and event booking feedback for this cafe.</p>
        </div>
      </div>

      {!cafeId ? (
        <div className="owner-events-empty">Select a cafe to view feedback.</div>
      ) : feedbackItems.length === 0 ? (
        <div className="owner-events-empty">No customer feedback yet.</div>
      ) : (
        <div className="owner-event-feedback-list">
          {feedbackItems.map((item) => (
            <article key={`${item.feedbackType}-${item.id}`} className="owner-event-feedback-card">
              <strong>{item.displayTitle}</strong>
              <span>
                {item.feedbackType} | {item.customerName || "Customer"} | Rating {item.rating}/5
              </span>
              <p>{item.message}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default FeedbackManagement;
