const EVENT_FEEDBACK_KEY = "cafe_connect_event_feedback";
const EVENT_FEEDBACK_CHANGED = "cafe-event-feedback-changed";
const CUSTOMER_FEEDBACK_KEY = "cafe_connect_customer_feedback";
const CUSTOMER_FEEDBACK_CHANGED = "cafe-customer-feedback-changed";
const FEEDBACK_API_URL = "http://localhost:8081/api/feedback";

const readFeedback = (key = EVENT_FEEDBACK_KEY) => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeFeedback = (feedback, key = EVENT_FEEDBACK_KEY, signal = EVENT_FEEDBACK_CHANGED) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(feedback));
    window.dispatchEvent(new Event(signal));
  } catch {}
};

const saveFeedbackToApi = (feedbackPayload) => {
  const { id, createdAt, ...apiPayload } = feedbackPayload;

  fetch(FEEDBACK_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(apiPayload),
  }).catch(() => {});
};

const fetchFeedbackFromApi = async (path) => {
  const response = await fetch(`${FEEDBACK_API_URL}${path}`);
  if (!response.ok) {
    throw new Error("Unable to load feedback");
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

export const getEventFeedbackSignal = () => EVENT_FEEDBACK_CHANGED;

export const getEventFeedbackForCafe = (cafeId) =>
  readFeedback().filter((item) => String(item.cafeId) === String(cafeId));

export const fetchFeedbackForCafe = (cafeId) => fetchFeedbackFromApi(`/cafe/${cafeId}`);

export const getEventFeedbackForCustomer = (customerId) =>
  readFeedback().filter((item) => String(item.customerId) === String(customerId));

export const fetchFeedbackForCustomer = (customerId) => fetchFeedbackFromApi(`/customer/${customerId}`);

export const saveEventFeedback = (feedbackPayload) => {
  const feedback = readFeedback();
  const nextFeedback = {
    id: `event-feedback-${Date.now()}`,
    type: "EVENT",
    rating: Number(feedbackPayload.rating || 5),
    message: String(feedbackPayload.message || "").trim(),
    createdAt: new Date().toISOString(),
    ...feedbackPayload,
  };

  writeFeedback([nextFeedback, ...feedback]);
  saveFeedbackToApi(nextFeedback);
  return nextFeedback;
};

export const getCustomerFeedbackSignal = () => CUSTOMER_FEEDBACK_CHANGED;

export const getCustomerFeedbackForCustomer = (customerId) =>
  readFeedback(CUSTOMER_FEEDBACK_KEY).filter((item) => String(item.customerId) === String(customerId));

export const getCustomerFeedbackForCafe = (cafeId) =>
  readFeedback(CUSTOMER_FEEDBACK_KEY).filter((item) => String(item.cafeId) === String(cafeId));

export const saveCustomerFeedback = (feedbackPayload) => {
  const feedback = readFeedback(CUSTOMER_FEEDBACK_KEY);
  const nextFeedback = {
    id: `customer-feedback-${Date.now()}`,
    rating: Number(feedbackPayload.rating || 5),
    message: String(feedbackPayload.message || "").trim(),
    createdAt: new Date().toISOString(),
    ...feedbackPayload,
  };

  writeFeedback([nextFeedback, ...feedback], CUSTOMER_FEEDBACK_KEY, CUSTOMER_FEEDBACK_CHANGED);
  saveFeedbackToApi(nextFeedback);
  return nextFeedback;
};
