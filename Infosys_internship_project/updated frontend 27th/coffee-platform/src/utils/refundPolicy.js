const parseRefundDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getMinutesSince = (value) => {
  const parsed = parseRefundDate(value);
  if (!parsed) return null;
  return (Date.now() - parsed.getTime()) / (1000 * 60);
};

const getImmediateRefundRate = (createdAt) => {
  const minutesSinceCreated = getMinutesSince(createdAt);

  if (minutesSinceCreated == null || minutesSinceCreated < 0) return null;
  if (minutesSinceCreated <= 2) return 1;
  return null;
};

const getScheduledImmediateRefundRate = (createdAt) => {
  const minutesSinceCreated = getMinutesSince(createdAt);

  if (minutesSinceCreated == null || minutesSinceCreated < 0) return null;
  if (minutesSinceCreated <= 5) return 0.95;
  if (minutesSinceCreated <= 15) return 0.9;
  if (minutesSinceCreated <= 30) return 0.8;
  return null;
};

const getEventRefundRate = ({ createdAt = "", status = "" }) => {
  const normalizedStatus = String(status || "").trim().toLowerCase();
  if (["organizer_cancelled", "cancelled_by_organizer", "postponed"].includes(normalizedStatus)) return 1;

  const immediateRate = getImmediateRefundRate(createdAt);
  if (immediateRate != null) return immediateRate;

  if (["completed", "served", "delivered", "prepared", "ready", "event_completed"].includes(normalizedStatus)) return 0;
  if (["approved", "event_order", "in_progress", "preparing", "preparation_started", "menu_started"].includes(normalizedStatus)) return 0.5;
  return 0.8;
};

const getOrderRefundRate = ({ createdAt = "", status = "" }) => {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  if (["ready", "prepared", "served", "delivered", "completed", "cancelled"].includes(normalizedStatus)) return 0;

  const immediateRate = getImmediateRefundRate(createdAt);
  if (immediateRate != null) return immediateRate;

  if (["approved", "preparing", "in progress"].includes(normalizedStatus)) return 0.5;
  if (["pending", "new"].includes(normalizedStatus)) return 0.5;
  return 0.5;
};

const getTableRefundRate = ({ bookingDate = "", bookingTime = "", createdAt = "" }) => {
  const immediateRate = getImmediateRefundRate(createdAt);
  if (immediateRate != null) return immediateRate;

  const dateTime = bookingDate && bookingTime ? new Date(`${bookingDate}T${bookingTime}`) : null;

  if (!dateTime || Number.isNaN(dateTime.getTime())) return 0.8;

  const hoursLeft = (dateTime.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursLeft >= 24) return 0.8;
  if (hoursLeft >= 6) return 0.5;
  if (hoursLeft > 0) return 0.2;
  return 0;
};

const getScheduledRefundRate = ({ bookingDate = "", bookingTime = "", createdAt = "" }) => {
  const immediateRate = getScheduledImmediateRefundRate(createdAt);
  if (immediateRate != null) return immediateRate;

  const dateTime = bookingDate && bookingTime ? new Date(`${bookingDate}T${bookingTime}`) : null;

  if (!dateTime || Number.isNaN(dateTime.getTime())) return 0.8;

  const hoursLeft = (dateTime.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursLeft >= 24) return 0.8;
  if (hoursLeft >= 6) return 0.5;
  if (hoursLeft > 0) return 0.2;
  return 0;
};

export const getBookingRefund = ({ paidAmount = 0, bookingDate = "", bookingTime = "", createdAt = "", type = "BOOKING", status = "" }) => {
  const amount = Math.max(0, Number(paidAmount || 0));
  const normalizedType = String(type || "").toUpperCase();
  const refundRate = normalizedType === "ORDER"
    ? getOrderRefundRate({ createdAt, status })
    : normalizedType === "EVENT"
      ? getEventRefundRate({ bookingDate, bookingTime, createdAt, status })
    : normalizedType === "TABLE"
      ? getTableRefundRate({ bookingDate, bookingTime, createdAt })
      : getScheduledRefundRate({ bookingDate, bookingTime, createdAt });

  const refundAmount = Math.round(amount * refundRate);

  return {
    refundAmount,
    cancellationFee: amount - refundAmount,
    refundRate,
    refundPercentage: Math.round(refundRate * 100),
  };
};

export const recordRefund = (refund) => {
  try {
    const existing = JSON.parse(window.localStorage.getItem("customer_refund_records") || "[]");
    const nextRecord = {
      id: `refund-${Date.now()}`,
      refundStatus: "PROCESSED",
      processedAt: new Date().toISOString(),
      paymentMethod: "Razorpay Refund",
      ...refund,
    };
    window.localStorage.setItem("customer_refund_records", JSON.stringify([nextRecord, ...(Array.isArray(existing) ? existing : [])]));
    window.dispatchEvent(new Event("customerRefundRecordsChanged"));
    return nextRecord;
  } catch {
    return null;
  }
};
