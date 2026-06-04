import { resolveEventImage } from "./eventImages";

const EVENTS_KEY = "cafe_connect_events";
const EVENT_BOOKINGS_KEY = "cafe_connect_event_bookings";
const OWNER_EVENT_REQUESTS_KEY = "cafe_connect_owner_event_requests";
const EVENTS_CHANGED = "cafe-events-changed";

const readJson = (key, fallback = []) => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

const emitEventsChanged = () => {
  try {
    window.dispatchEvent(new Event(EVENTS_CHANGED));
  } catch {}
};

const buildDateTime = (event) => `${event?.eventDate || ""}T${event?.eventTime || "00:00"}`;

const sortEvents = (events) =>
  [...events].sort((a, b) => buildDateTime(a).localeCompare(buildDateTime(b)));

const getBookingCreatedTime = (booking) => {
  const parsed = new Date(booking?.bookedAt || booking?.createdAt || booking?.cancelledAt || 0);
  const parsedTime = parsed.getTime();
  if (!Number.isNaN(parsedTime)) return parsedTime;
  return Number(booking?.id || 0);
};

const sortBookingsNewestFirst = (bookings) =>
  [...bookings].sort((a, b) => getBookingCreatedTime(b) - getBookingCreatedTime(a));

const mergeBookingsById = (...bookingLists) => {
  const merged = new Map();
  bookingLists.flat().filter(Boolean).forEach((booking) => {
    const key = String(booking.id || `${booking.eventId}-${booking.customerId}-${booking.bookedAt || booking.requestedAt || ""}`);
    merged.set(key, {
      ...(merged.get(key) || {}),
      ...booking,
    });
  });
  return sortBookingsNewestFirst([...merged.values()]);
};

const getAllEventBookings = () =>
  mergeBookingsById(readJson(EVENT_BOOKINGS_KEY), readJson(OWNER_EVENT_REQUESTS_KEY));

const saveEventBookingRequest = (nextBooking) => {
  const bookings = mergeBookingsById(readJson(EVENT_BOOKINGS_KEY), [nextBooking]);
  const ownerRequests = mergeBookingsById(readJson(OWNER_EVENT_REQUESTS_KEY), [nextBooking]);
  writeJson(EVENT_BOOKINGS_KEY, bookings);
  writeJson(OWNER_EVENT_REQUESTS_KEY, ownerRequests);
  emitEventsChanged();
};

const updateStoredEventBooking = (bookingId, updater) => {
  [EVENT_BOOKINGS_KEY, OWNER_EVENT_REQUESTS_KEY].forEach((key) => {
    const updatedBookings = readJson(key).map((booking) =>
      String(booking.id) === String(bookingId) ? updater(booking) : booking
    );
    writeJson(key, updatedBookings);
  });
  emitEventsChanged();
};

const getBookingReleaseDate = (booking) => {
  const date = booking?.bookingDate || booking?.eventDate;
  const time = booking?.eventEndTime || booking?.bookingTime || booking?.eventTime;

  if (!date || !time) return null;

  const releaseDate = new Date(`${date}T${time}`);
  return Number.isNaN(releaseDate.getTime()) ? null : releaseDate;
};

const isEventBookingActive = (booking, now = new Date()) => {
  const status = String(booking?.bookingStatus || "PENDING").toUpperCase();
  if (status === "REJECTED" || status === "CANCELLED") return false;

  const releaseDate = getBookingReleaseDate(booking);
  return !releaseDate || releaseDate > now;
};

export const getEventStoreSignal = () => EVENTS_CHANGED;

export const getStoredEvents = () => sortEvents(readJson(EVENTS_KEY));

export const getStoredEventBookings = () => getAllEventBookings();

export const getEventsForCafe = (cafeId) =>
  getStoredEvents().filter((event) => String(event.cafeId) === String(cafeId));

export const getCustomerEventBookings = (customerId) =>
  sortBookingsNewestFirst(
    getAllEventBookings().filter((booking) => String(booking.customerId) === String(customerId))
  );

export const getEventBookingsForCafe = (cafeId) =>
  sortBookingsNewestFirst(
    getAllEventBookings().filter((booking) => {
      if (String(booking.cafeId) === String(cafeId)) return true;
      const matchingEvent = getStoredEvents().find((event) => String(event.id) === String(booking.eventId));
      return matchingEvent && String(matchingEvent.cafeId) === String(cafeId);
    })
  );

export const getBookingsForEvent = (eventId) =>
  getAllEventBookings().filter((booking) => String(booking.eventId) === String(eventId));

export const cancelEventBooking = (bookingId, refundDetails = {}) => {
  updateStoredEventBooking(bookingId, (booking) => ({
    ...booking,
    ...refundDetails,
    bookingStatus: "CANCELLED",
    cancelledAt: new Date().toISOString(),
  })
  );
};

export const getReservedSeatsForEvent = (eventId) =>
  getBookingsForEvent(eventId)
    .filter((booking) => isEventBookingActive(booking))
    .reduce((sum, booking) => sum + Number(booking.guestCount || booking.seats || 0), 0);

export const createCafeEvent = (eventPayload) => {
  const events = getStoredEvents();
  const nextEvent = {
    id: Date.now(),
    ...eventPayload,
    price: Number(eventPayload.price || 0),
    capacity: Number(eventPayload.capacity || 0),
    imageUrl: eventPayload.imageUrl || resolveEventImage(eventPayload.eventType, ""),
    createdAt: new Date().toISOString(),
  };

  writeJson(EVENTS_KEY, [...events, nextEvent]);
  emitEventsChanged();
  return nextEvent;
};

export const updateCafeEvent = (eventId, eventPayload) => {
  const events = getStoredEvents();
  const updatedEvents = events.map((event) =>
    String(event.id) === String(eventId)
      ? {
          ...event,
          ...eventPayload,
          price: Number(eventPayload.price || 0),
          capacity: Number(eventPayload.capacity || 0),
          imageUrl: eventPayload.imageUrl || resolveEventImage(eventPayload.eventType, ""),
          updatedAt: new Date().toISOString(),
        }
      : event
  );

  writeJson(EVENTS_KEY, updatedEvents);
  emitEventsChanged();
};

export const deleteCafeEvent = (eventId) => {
  const events = getStoredEvents().filter((event) => String(event.id) !== String(eventId));
  writeJson(EVENTS_KEY, events);
  writeJson(EVENT_BOOKINGS_KEY, readJson(EVENT_BOOKINGS_KEY).filter((booking) => String(booking.eventId) !== String(eventId)));
  writeJson(OWNER_EVENT_REQUESTS_KEY, readJson(OWNER_EVENT_REQUESTS_KEY).filter((booking) => String(booking.eventId) !== String(eventId)));
  emitEventsChanged();
};

export const reserveEventBooking = ({ eventId, customerId, customerName, customerEmail, seats = 1, advanceAmount }) => {
  const events = getStoredEvents();
  const bookings = getAllEventBookings();
  const selectedEvent = events.find((event) => String(event.id) === String(eventId));

  if (!selectedEvent) {
    throw new Error("Event not found.");
  }

  const normalizedSeats = Math.max(1, Number(seats || 1));
  const reservedSeats = getReservedSeatsForEvent(eventId);
  const availableSeats = Math.max(0, Number(selectedEvent.capacity || 0) - reservedSeats);

  if (availableSeats < normalizedSeats) {
    throw new Error("Not enough seats available for this event.");
  }

  const bookingTotal = Number(selectedEvent.price || 0) * normalizedSeats;
  const paidAdvanceAmount = Number(advanceAmount || bookingTotal);

  const nextBooking = {
    id: Date.now(),
    eventId: selectedEvent.id,
    cafeId: selectedEvent.cafeId,
    cafeName: selectedEvent.cafeName,
    ownerId: selectedEvent.ownerId ?? null,
    eventTitle: selectedEvent.title,
    eventType: selectedEvent.eventType,
    imageUrl: selectedEvent.imageUrl,
    eventDate: selectedEvent.eventDate || "",
    eventTime: selectedEvent.eventTime || "",
    eventEndTime: selectedEvent.eventEndTime || "",
    customerId,
    customerName,
    customerEmail,
    backendBookingId: null,
    requestedEventType: selectedEvent.eventType,
    bookingDate: selectedEvent.eventDate || "",
    bookingTime: selectedEvent.eventTime || "",
    guestCount: normalizedSeats,
    seats: normalizedSeats,
    tableIds: [],
    tableLabels: [],
    decorationTheme: "",
    cakeOption: "",
    musicOption: "",
    foodPackage: "",
    setupOptions: {},
    customMessage: "",
    specialRequests: "",
    advanceAmount: paidAdvanceAmount,
    quotedPrice: bookingTotal,
    totalAmount: bookingTotal,
    bookingStatus: "PENDING",
    approvalStatus: "PENDING",
    requestSentToOwner: true,
    requestedAt: new Date().toISOString(),
    bookedAt: new Date().toISOString(),
  };

  saveEventBookingRequest(nextBooking);
  return nextBooking;
};

export const createDetailedEventBooking = (bookingPayload) => {
  const events = getStoredEvents();
  const bookings = getAllEventBookings();
  const selectedEvent = events.find((event) => String(event.id) === String(bookingPayload.eventId));

  if (!selectedEvent) {
    throw new Error("Event not found.");
  }

  const guestCount = Math.max(1, Number(bookingPayload.guestCount || 1));
  const reservedSeats = getReservedSeatsForEvent(selectedEvent.id);
  const availableSeats = Math.max(0, Number(selectedEvent.capacity || 0) - reservedSeats);

  if (availableSeats < guestCount) {
    throw new Error("Guest count exceeds remaining capacity for this event.");
  }

  const nextBooking = {
    id: Date.now(),
    eventId: selectedEvent.id,
    cafeId: selectedEvent.cafeId,
    cafeName: selectedEvent.cafeName,
    ownerId: selectedEvent.ownerId ?? null,
    eventTitle: selectedEvent.title,
    eventType: selectedEvent.eventType,
    imageUrl: selectedEvent.imageUrl,
    eventDate: selectedEvent.eventDate || "",
    eventTime: selectedEvent.eventTime || "",
    eventEndTime: selectedEvent.eventEndTime || "",
    customerId: bookingPayload.customerId,
    customerName: bookingPayload.customerName,
    customerEmail: bookingPayload.customerEmail,
    backendBookingId: bookingPayload.backendBookingId || null,
    requestedEventType: bookingPayload.requestedEventType || "Birthday",
    customEventType: bookingPayload.customEventType || "",
    bookingDate: bookingPayload.bookingDate || "",
    bookingTime: bookingPayload.bookingTime || "",
    guestCount,
    seats: guestCount,
    tableIds: Array.isArray(bookingPayload.tableIds) ? bookingPayload.tableIds : [],
    tableLabels: Array.isArray(bookingPayload.tableLabels) ? bookingPayload.tableLabels : [],
    decorationTheme: bookingPayload.decorationTheme || "",
    cakeOption: bookingPayload.cakeOption || "",
    musicOption: bookingPayload.musicOption || "",
    foodPackage: bookingPayload.foodPackage || "",
    setupOptions: bookingPayload.setupOptions || {},
    customMessage: bookingPayload.customMessage || "",
    specialRequests: bookingPayload.specialRequests || "",
    advanceAmount: Number(bookingPayload.advanceAmount || 0),
    quotedPrice: Number(selectedEvent.price || 0),
    totalAmount: Number(selectedEvent.price || 0),
    bookingStatus: "PENDING",
    approvalStatus: "PENDING",
    requestSentToOwner: true,
    requestedAt: new Date().toISOString(),
    bookedAt: new Date().toISOString(),
  };

  nextBooking.preparationChecklist = buildEventPreparationChecklist(nextBooking);

  saveEventBookingRequest(nextBooking);
  return nextBooking;
};

export const updateEventBookingStatus = (bookingId, bookingStatus, updates = {}) => {
  updateStoredEventBooking(bookingId, (booking) => ({
    ...booking,
    ...updates,
    bookingStatus: String(bookingStatus || "PENDING").toUpperCase(),
    approvalStatus: String(bookingStatus || "PENDING").toUpperCase(),
  }));
};

export const updateEventStaffOrderStatus = (bookingId, eventStaffStatus) => {
  updateStoredEventBooking(bookingId, (booking) => ({
    ...booking,
    eventStaffStatus: String(eventStaffStatus || "EVENT_ORDER").toUpperCase(),
    eventStaffUpdatedAt: new Date().toISOString(),
  }));
};

export const updateEventBookingQuotedPrice = (bookingId, quotedPrice) => {
  const nextPrice = Math.max(0, Number(quotedPrice || 0));
  updateStoredEventBooking(bookingId, (booking) => ({ ...booking, quotedPrice: nextPrice, totalAmount: nextPrice }));
};

export const getTodayApprovedEventBookingsForCafe = (cafeId, dateString) =>
  getEventBookingsForCafe(cafeId).filter((booking) => {
    const sameDay = String(booking.bookingDate || "") === String(dateString || "");
    const approved = String(booking.bookingStatus || "").toUpperCase() === "APPROVED";
    return sameDay && approved;
  });

export const buildEventPreparationChecklist = (booking) => {
  const items = [];

  if (booking.decorationTheme) items.push(`Set decoration theme: ${booking.decorationTheme}`);
  if (booking.cakeOption) items.push(`Arrange cake: ${booking.cakeOption}`);
  if (booking.musicOption) items.push(`Set music: ${booking.musicOption}`);
  if (booking.foodPackage) items.push(`Prepare food package: ${booking.foodPackage}`);
  if (booking.setupOptions?.balloons) items.push("Add balloons");
  if (booking.setupOptions?.photoCorner) items.push("Prepare photo corner");
  if (booking.setupOptions?.candlelightSetup) items.push("Arrange candlelight setup");
  if (booking.setupOptions?.welcomeBoard) items.push("Prepare welcome board");
  if (booking.customMessage) items.push(`Display custom message: ${booking.customMessage}`);
  if (booking.specialRequests) items.push(`Special request: ${booking.specialRequests}`);
  if (Array.isArray(booking.tableLabels) && booking.tableLabels.length > 0) {
    items.push(`Reserve tables: ${booking.tableLabels.join(", ")}`);
  }

  return items;
};

export const buildEventStaffChecklist = (booking) => {
  const items = [];

  if (booking.decorationTheme) items.push(`Set decoration theme: ${booking.decorationTheme}`);
  if (booking.musicOption) items.push(`Set music: ${booking.musicOption}`);
  if (booking.setupOptions?.balloons) items.push("Add balloons");
  if (booking.setupOptions?.photoCorner) items.push("Prepare photo corner");
  if (booking.setupOptions?.candlelightSetup) items.push("Arrange candlelight setup");
  if (booking.setupOptions?.welcomeBoard) items.push("Prepare welcome board");
  if (booking.customMessage) items.push(`Display custom message: ${booking.customMessage}`);
  if (booking.specialRequests) items.push(`Special request: ${booking.specialRequests}`);
  if (Array.isArray(booking.tableLabels) && booking.tableLabels.length > 0) {
    items.push(`Reserve tables: ${booking.tableLabels.join(", ")}`);
  }

  return items;
};

export const buildEventKitchenChecklist = (booking) => {
  const items = [];

  if (booking.cakeOption && booking.cakeOption !== "No Cake") {
    items.push(`Prepare cake: ${booking.cakeOption}`);
  }

  if (booking.foodPackage) {
    items.push(`Prepare food package: ${booking.foodPackage}`);
  }

  return items;
};
