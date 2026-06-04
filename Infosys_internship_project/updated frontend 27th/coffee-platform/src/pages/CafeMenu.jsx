import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import "./CafeMenu.css";
import CheckoutBill from "../dashboards/CheckoutBill";
import { downloadReceiptPdf } from "../dashboards/OrderReceipt";
import { getCurrentUser } from "../utils/session";
import {
  createDetailedEventBooking,
  getCustomerEventBookings,
  getEventStoreSignal,
  getEventsForCafe,
  getReservedSeatsForEvent,
} from "../utils/eventStore";
import { resolveEventImage } from "../utils/eventImages";

const defaultMenuImage =
  "https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=900&auto=format&fit=crop";
const defaultTableImage =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=900&auto=format&fit=crop";
const MENU_OFFERS_CACHE_KEY = "menu_seasonal_offers_cache";

const menuSections = [
  { key: "all", label: "All Menu", matcher: () => true },
  {
    key: "coffee",
    label: "Coffee",
    matcher: (item) => {
      const text = `${item.itemName || ""} ${item.description || ""}`.toLowerCase();
      return /coffee|espresso|latte|cappuccino|americano|mocha/.test(text);
    },
  },
  {
    key: "tea",
    label: "Tea",
    matcher: (item) => {
      const text = `${item.itemName || ""} ${item.description || ""}`.toLowerCase();
      return /tea|chai|green tea|lemon tea|iced tea/.test(text);
    },
  },
  {
    key: "milkshakes",
    label: "Milkshakes",
    matcher: (item) => {
      const text = `${item.itemName || ""} ${item.description || ""}`.toLowerCase();
      return /shake|milkshake|smoothie/.test(text);
    },
  },
  {
    key: "cold-drinks",
    label: "Cold Drinks",
    matcher: (item) => {
      const text = `${item.itemName || ""} ${item.description || ""}`.toLowerCase();
      return /cold|soda|juice|mocktail|cooler|fizz/.test(text);
    },
  },
  {
    key: "snacks",
    label: "Snacks",
    matcher: (item) => {
      const text = `${item.itemName || ""} ${item.description || ""}`.toLowerCase();
      return /sandwich|burger|toast|snack|biscuit|fries|puff|wrap|cake|cookie/.test(text);
    },
  },
  { key: "tables", label: "Tables", matcher: () => false },
  { key: "events", label: "Event Booking", matcher: () => false },
];

const getCurrentSeason = () => {
  const month = new Date().getMonth() + 1;

  if (month >= 3 && month <= 5) return "SUMMER";
  if (month >= 6 && month <= 9) return "MONSOON";
  if (month >= 10 && month <= 11) return "FESTIVE";
  return "WINTER";
};

const readOffersCache = () => {
  try {
    const raw = localStorage.getItem(MENU_OFFERS_CACHE_KEY) || "{}";
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const mergeCachedOffer = (item, cafeId, cache) => {
  const cafeKey = String(cafeId ?? "");
  const itemKey = String(item?.id ?? "");
  const cached = cache?.[cafeKey]?.[itemKey];

  if (!cached) {
    return item;
  }

  return {
    ...item,
    seasonalOfferSeason: item?.seasonalOfferSeason || cached.seasonalOfferSeason || "",
    seasonalOfferPercentage:
      Number(item?.seasonalOfferPercentage || 0) > 0
        ? item.seasonalOfferPercentage
        : cached.seasonalOfferPercentage || 0,
  };
};

const resolveImage = (imageUrl, fallbackImage) => {
  if (!imageUrl) return fallbackImage;
  if (
    imageUrl.startsWith("data:") ||
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://")
  ) {
    return imageUrl;
  }
  if (imageUrl.startsWith("/")) {
    return `http://localhost:8081${imageUrl}`;
  }
  return fallbackImage;
};

const formatPrice = (value) => {
  const numericValue = Number(value || 0);
  return `Rs. ${numericValue.toFixed(2)}`;
};

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const createEventRequestDraft = (basePrice = 0) => ({
  requestedEventType: "Birthday",
  customEventType: "",
  bookingDate: "",
  guestCount: 2,
  tableIds: [],
  decorationTheme: "Classic",
  cakeOption: "Chocolate Cake",
  musicOption: "Soft Music",
  foodPackage: "Snacks + Drinks",
  balloons: false,
  photoCorner: false,
  candlelightSetup: false,
  welcomeBoard: false,
  customMessage: "",
  advanceAmount: Number(basePrice || 0),
});

const getSeasonalOfferDetails = (item, currentSeason) => {
  const season = String(item?.seasonalOfferSeason || "").trim().toUpperCase();
  const percentage = Number(item?.seasonalOfferPercentage || 0);
  const originalPrice = Number(item?.price || 0);
  const hasConfiguredOffer = percentage > 0 && originalPrice > 0;
  const offerLabel = season ? `${season} ${percentage}% OFF` : `${percentage}% OFF`;

  if (!hasConfiguredOffer) {
    return {
      hasOffer: false,
      hasConfiguredOffer: false,
      originalPrice,
      discountedPrice: originalPrice,
      offerLabel: "",
      configuredOfferLabel: "",
    };
  }

  if (season && season !== currentSeason) {
    return {
      hasOffer: false,
      hasConfiguredOffer: true,
      originalPrice,
      discountedPrice: originalPrice,
      offerLabel: "",
      configuredOfferLabel: offerLabel,
    };
  }

  const discountedPrice = Math.max(0, originalPrice - (originalPrice * percentage) / 100);

  return {
    hasOffer: true,
    hasConfiguredOffer: true,
    originalPrice,
    discountedPrice,
    offerLabel,
    configuredOfferLabel: offerLabel,
  };
};

const CafeMenu = () => {
  const { cafeId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = getCurrentUser();
  const currentSeason = useMemo(() => getCurrentSeason(), []);

  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [cafe, setCafe] = useState(null);
  const [activeSection, setActiveSection] = useState("all");
  const [budgetFilter, setBudgetFilter] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [favoriteItemIds, setFavoriteItemIds] = useState([]);
  const [cartToast, setCartToast] = useState("");
  const [cafeEvents, setCafeEvents] = useState([]);
  const [customerEventBookings, setCustomerEventBookings] = useState([]);
  const [eventRequestForms, setEventRequestForms] = useState({});
  const [eventPaymentRequest, setEventPaymentRequest] = useState(null);
  const [eventFeedback, setEventFeedback] = useState("");
  const [eventError, setEventError] = useState("");
  const todayDate = useMemo(() => getTodayDateString(), []);

  useEffect(() => {
    const section = searchParams.get("section");
    if (menuSections.some((item) => item.key === section)) {
      setActiveSection(section);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user?.id) {
      setCartCount(0);
      return;
    }

    axios
      .get(`http://localhost:8081/api/cart/user/${user.id}`)
      .then((res) => {
        const count = Array.isArray(res.data)
          ? res.data.reduce((sum, item) => sum + (item.quantity || 0), 0)
          : 0;
        setCartCount(count);
      })
      .catch((err) => console.error("Failed to fetch cart count", err));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setFavoriteItemIds([]);
      return;
    }

    axios
      .get(`http://localhost:8081/api/favorites/user/${user.id}`)
      .then((res) => {
        const ids = Array.isArray(res.data)
          ? res.data.map((item) => item.itemId).filter((itemId) => itemId != null)
          : [];
        setFavoriteItemIds(ids);
      })
      .catch((err) => console.error("Failed to fetch favourites", err));
  }, [user?.id]);

  useEffect(() => {
    if (!cartToast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setCartToast("");
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [cartToast]);

  useEffect(() => {
    axios
      .get(`http://localhost:8081/api/cafe/${cafeId}`)
      .then((res) => setCafe(res.data))
      .catch((err) => console.error("Failed to fetch cafe info", err));

    axios
      .get(`http://localhost:8081/api/cafe/${cafeId}/menu`)
      .then((res) => {
        const cache = readOffersCache();
        const items = Array.isArray(res.data) ? res.data.map((item) => mergeCachedOffer(item, cafeId, cache)) : [];
        setMenuItems(items);
      })
      .catch((err) => console.error("Failed to fetch menu items", err));

    axios
      .get(`http://localhost:8081/api/tables/cafe/${cafeId}`)
      .then((res) => setTables(Array.isArray(res.data) ? res.data : []))
      .catch((err) => {
        console.error("Failed to fetch cafe tables", err);
        setTables([]);
      });
  }, [cafeId]);

  useEffect(() => {
    const syncEvents = () => {
      setCafeEvents(getEventsForCafe(cafeId));
      if (user?.id) {
        setCustomerEventBookings(getCustomerEventBookings(user.id));
      } else {
        setCustomerEventBookings([]);
      }
    };

    syncEvents();
    const signal = getEventStoreSignal();
    window.addEventListener(signal, syncEvents);
    window.addEventListener("storage", syncEvents);

    return () => {
      window.removeEventListener(signal, syncEvents);
      window.removeEventListener("storage", syncEvents);
    };
  }, [cafeId, user?.id]);

  useEffect(() => {
    const syncOffers = () => {
      const cache = readOffersCache();
      setMenuItems((prev) => prev.map((item) => mergeCachedOffer(item, cafeId, cache)));
    };

    window.addEventListener("menuSeasonalOffersChanged", syncOffers);
    return () => window.removeEventListener("menuSeasonalOffersChanged", syncOffers);
  }, [cafeId]);

  const maxBudget = useMemo(() => {
    const parsed = Number(budgetFilter);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [budgetFilter]);

  const filterByBudget = (items, getPrice) => {
    if (maxBudget === null) {
      return items;
    }

    return items.filter((item) => Number(getPrice(item) || 0) <= maxBudget);
  };

  const budgetedMenuItems = useMemo(
    () => filterByBudget(menuItems, (item) => getSeasonalOfferDetails(item, currentSeason).discountedPrice),
    [menuItems, currentSeason, maxBudget]
  );

  const budgetedTables = useMemo(
    () => filterByBudget(tables, (table) => table.price),
    [tables, maxBudget]
  );

  const budgetedEvents = useMemo(
    () => filterByBudget(cafeEvents, (event) => event.price),
    [cafeEvents, maxBudget]
  );

  const sectionCounts = useMemo(() => {
    return menuSections.reduce((acc, section) => {
      if (section.key === "tables") {
        acc[section.key] = budgetedTables.length;
      } else if (section.key === "events") {
        acc[section.key] = budgetedEvents.length;
      } else {
        acc[section.key] = budgetedMenuItems.filter(section.matcher).length;
      }
      return acc;
    }, {});
  }, [budgetedMenuItems, budgetedTables, budgetedEvents]);

  const visibleMenuItems = useMemo(() => {
    if (activeSection === "tables" || activeSection === "events") {
      return [];
    }

    const currentSection = menuSections.find((section) => section.key === activeSection);
    if (!currentSection) {
      return budgetedMenuItems;
    }

    return budgetedMenuItems.filter(currentSection.matcher);
  }, [activeSection, budgetedMenuItems]);

  const addToCart = async (item) => {
    if (!user?.id) {
      alert("Please log in first.");
      return;
    }

    const itemName = item.itemName || item.name || "Menu Item";
    const offerDetails = getSeasonalOfferDetails(item, currentSeason);

    try {
      const response = await axios.post("http://localhost:8081/api/cart/add", {
        userId: user.id,
        cafeId: Number(cafeId),
        cafeName: cafe?.cafeName || "",
        itemId: item.id,
        itemName,
        price: offerDetails.discountedPrice,
        originalPrice: offerDetails.originalPrice,
        offerLabel: offerDetails.offerLabel,
        imageUrl: item.imageUrl,
      });

      if (response.data?.quantity) {
        setCartCount((prev) => prev + 1);
      }

      window.dispatchEvent(new Event("cart-updated"));
      setCartToast(`${itemName} added to cart`);
    } catch (error) {
      console.error("Failed to add item to cart", error);
      alert("Could not add item to cart");
    }
  };

  const handleBookTable = () => {
    navigate(`/booking/${cafeId}`, { state: { cafe } });
  };

  const handleEventFormChange = (eventId, field, value) => {
    setEventRequestForms((prev) => {
      const basePrice = cafeEvents.find((event) => Number(event.id) === Number(eventId))?.price || 0;
      const current = prev[eventId] || createEventRequestDraft(basePrice);
      return {
        ...prev,
        [eventId]: {
          ...current,
          [field]: value,
        },
      };
    });
    setEventFeedback("");
    setEventError("");
  };

  const handleEventTableToggle = (eventId, table) => {
    setEventRequestForms((prev) => {
      const basePrice = cafeEvents.find((event) => Number(event.id) === Number(eventId))?.price || 0;
      const current = prev[eventId] || createEventRequestDraft(basePrice);
      const selectedIds = Array.isArray(current.tableIds) ? current.tableIds : [];
      const nextIds = selectedIds.includes(table.id)
        ? selectedIds.filter((id) => id !== table.id)
        : [...selectedIds, table.id];
      return {
        ...prev,
        [eventId]: {
          ...current,
          tableIds: nextIds,
        },
      };
    });
    setEventFeedback("");
    setEventError("");
  };

  const handleBookEvent = (event) => {
    if (!user?.id) {
      alert("Please log in first.");
      return;
    }

    const form = eventRequestForms[event.id] || createEventRequestDraft(event.price);
    const selectedTables = tables.filter((table) => (form.tableIds || []).includes(table.id));

    if (!form.bookingDate || !form.guestCount) {
      setEventError("Select date and guest count before paying for the event booking.");
      return;
    }

    if (form.bookingDate > todayDate) {
      setEventError("Future dates are not allowed for event booking.");
      return;
    }

    setEventPaymentRequest({ event, form, selectedTables });
    setEventFeedback("");
    setEventError("");
  };

  const handleEventPaymentSuccess = async (billSummary) => {
    if (!eventPaymentRequest) return;

    const { event, form, selectedTables } = eventPaymentRequest;

    try {
      let backendBooking = null;
      try {
        const backendResponse = await axios.post("http://localhost:8081/api/bookings", {
          customerId: user.id,
          name:
            [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
            user?.email ||
            "Customer",
          email: user?.email || "",
          bookingDate: form.bookingDate,
          bookingTime: event.eventTime || "00:00",
          people: Number(form.guestCount || 1),
          cafeId: Number(cafeId),
          cafeName: event.cafeName || cafe?.cafeName || "",
          tableId: null,
          tableNumber: "",
          occasion: "event_booking",
          celebrationEvent: true,
          celebrationType: String(event.eventType || form.requestedEventType || "event").toLowerCase().replace(/\s+/g, "_"),
          customCelebrationType: event.title,
          decorationTheme: form.decorationTheme,
          cakeMessage: form.cakeOption,
          surpriseSetup: Boolean(form.balloons || form.photoCorner || form.candlelightSetup || form.welcomeBoard),
          seatingPreference: "Event Booking",
          notes: `Event Booking Request: ${event.title}. Music: ${form.musicOption}. Food: ${form.foodPackage}. Message: ${form.customMessage || "-"}`,
          advancePaymentAmount: billSummary.total,
          advancePaymentMethod: "Razorpay",
          advancePaymentStatus: "PAID",
        });
        backendBooking = backendResponse.data || null;
      } catch (backendError) {
        console.error("Failed to send event request to owner backend", backendError);
      }

      const savedBooking = createDetailedEventBooking({
        eventId: event.id,
        customerId: user.id,
        customerName:
          [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
          user?.email ||
          "Customer",
        customerEmail: user?.email || "",
        requestedEventType: event.eventType || form.requestedEventType,
        customEventType: "",
        bookingDate: form.bookingDate,
        bookingTime: event.eventTime || "",
        guestCount: form.guestCount,
        tableIds: selectedTables.map((table) => table.id),
        tableLabels: selectedTables.map((table) => `Table ${table.tableNumber || table.id}`),
        decorationTheme: form.decorationTheme,
        cakeOption: form.cakeOption,
        musicOption: form.musicOption,
        foodPackage: form.foodPackage,
        setupOptions: {
          balloons: form.balloons,
          photoCorner: form.photoCorner,
          candlelightSetup: form.candlelightSetup,
          welcomeBoard: form.welcomeBoard,
        },
        customMessage: form.customMessage,
        specialRequests: "",
        advanceAmount: billSummary.total,
        backendBookingId: backendBooking?.id || null,
      });
      downloadReceiptPdf({
        orderId: `EVT-${savedBooking.id}`,
        date: new Date().toLocaleString(),
        items: [
          {
            name: `${event.title} advance payment`,
            qty: 1,
            price: billSummary.total,
          },
        ],
        subtotal: billSummary.subtotal || billSummary.total || 0,
        discount: billSummary.discount || 0,
        tax: billSummary.tax || 0,
        total: billSummary.total || 0,
        cafeName: event.cafeName || cafe?.cafeName || "Cafe Event",
      });
      setCustomerEventBookings((prev) => [savedBooking, ...prev.filter((booking) => String(booking.id) !== String(savedBooking.id))]);
      setEventFeedback(`${event.title} event request submitted successfully. Advance payment of ${formatPrice(billSummary.total)} received via Razorpay.`);
      setEventRequestForms((prev) => ({
        ...prev,
        [event.id]: createEventRequestDraft(event.price),
      }));
      setEventPaymentRequest(null);
      setEventError("");
      navigate("/customer-account?tab=events");
    } catch (error) {
      setEventPaymentRequest(null);
      setEventError(error.message || "Could not submit event request.");
    }
  };

  const eventPaymentItems = eventPaymentRequest
    ? [
        {
          id: `event-advance-${eventPaymentRequest.event.id}`,
          name: `${eventPaymentRequest.event.title} Advance Payment`,
          price: Number(eventPaymentRequest.form.advanceAmount || eventPaymentRequest.event.price || 0),
          quantity: 1,
        },
      ]
    : [];

  const toggleFavorite = async (item) => {
    if (!user?.id) {
      alert("Please log in first.");
      return;
    }

    const itemName = item.itemName || item.name || "Menu Item";

    try {
      const response = await axios.post("http://localhost:8081/api/favorites/toggle", {
        userId: user.id,
        cafeId: Number(cafeId),
        cafeName: cafe?.cafeName || "",
        itemId: item.id,
        itemName,
        price: item.price,
        imageUrl: item.imageUrl,
      });

      const isFavorited = Boolean(response.data?.favorited);
      setFavoriteItemIds((prev) => {
        if (isFavorited) {
          return prev.includes(item.id) ? prev : [...prev, item.id];
        }
        return prev.filter((savedId) => savedId !== item.id);
      });
    } catch (error) {
      console.error("Failed to update favourite", error);
      alert("Could not update favourites");
    }
  };

  return (
    <div className="menu-page">
      {eventPaymentRequest && (
        <CheckoutBill
          cartItems={eventPaymentItems}
          onBack={() => setEventPaymentRequest(null)}
          onProceed={handleEventPaymentSuccess}
          exactPayment
        />
      )}
      {cartToast && <div className="cart-toast">{cartToast}</div>}
      <aside className="menu-sidebar">
        <div className="menu-sidebar-brand">
          <span className="menu-sidebar-label">Cafe Menu</span>
          <h1>{cafe?.cafeName || "Cafe"}</h1>
          <p>
            Browse the menu, explore table options, and place your order in the
            same warm coffee-house theme.
          </p>
        </div>

        <nav className="menu-sidebar-nav">
          {menuSections.map((section) => (
            <button
              key={section.key}
              type="button"
              className={`menu-nav-item ${activeSection === section.key ? "active" : ""}`}
              onClick={() => setActiveSection(section.key)}
            >
              <span>{section.label}</span>
              <span className="menu-nav-count">{sectionCounts[section.key] || 0}</span>
            </button>
          ))}
        </nav>

        <div className="menu-sidebar-note">
          <strong>Quick tip</strong>
          <p>
            Use the sidebar to jump between drinks, bites, and tables without
            losing your cart.
          </p>
        </div>
      </aside>

      <main className="menu-main">
        <div className="menu-topbar">
          <div className="menu-topbar-copy">
            <span className="menu-topbar-tag">
              {activeSection === "tables"
                ? "Table Selection"
                : activeSection === "events"
                  ? "Event Booking"
                  : "Fresh Picks"}
            </span>
            <h2>
              {activeSection === "tables"
                ? `Tables at ${cafe?.cafeName || "this cafe"}`
                : activeSection === "events"
                  ? `${cafe?.cafeName || "This cafe"} Events`
                : `${cafe?.cafeName || "Cafe"} Menu`}
            </h2>
          </div>

          <label className="budget-filter">
            <span>Budget Filter</span>
            <div className="budget-input-wrap">
              <span>Rs.</span>
              <input
                type="number"
                min="0"
                placeholder="Enter budget"
                value={budgetFilter}
                onChange={(e) => setBudgetFilter(e.target.value)}
              />
            </div>
          </label>

          <button className="cart-icon" type="button" onClick={() => navigate("/cart")}>
            Cart <span>{cartCount}</span>
          </button>
        </div>

        {activeSection === "tables" ? (
          <section className="tables-section">
            <div className="tables-section-header">
              <div>
                <h3>Available Tables</h3>
                <p>
                  Every table shown here belongs only to this cafe. Pick a spot
                  that fits your group and continue to booking when you are
                  ready.
                </p>
              </div>
              <button type="button" className="book-table-btn" onClick={handleBookTable}>
                Book a Table
              </button>
            </div>

            <div className="tables-grid">
              {budgetedTables.length > 0 ? (
                budgetedTables.map((table) => (
                  <article key={table.id} className="table-card">
                    <img
                      src={resolveImage(table.imageUrl, defaultTableImage)}
                      alt={`Table ${table.tableNumber || table.id}`}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = defaultTableImage;
                      }}
                    />
                    <div className="table-card-body">
                      <div className="table-card-top">
                        <h4>Table {table.tableNumber || table.id}</h4>
                        <span className="table-type-pill">
                          {table.tableType || "Standard"}
                        </span>
                      </div>
                      <div className="table-meta-row">
                        <span>Seats</span>
                        <strong>{table.seats || 0}</strong>
                      </div>
                      <div className="table-meta-row">
                        <span>Reservation Fee</span>
                        <strong>{formatPrice(table.price)}</strong>
                      </div>
                      <button
                        type="button"
                        className="table-book-inline-btn"
                        onClick={handleBookTable}
                      >
                        Continue to Booking
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="menu-empty-state">
                  <h4>No tables added yet</h4>
                  <p>
                    This cafe has not published any tables yet. Please check
                    back later.
                  </p>
                </div>
              )}
            </div>
          </section>
        ) : activeSection === "events" ? (
          <section className="tables-section">
            <div className="tables-section-header">
              <div>
                <h3>Event Booking</h3>
                <p>
                  Choose an event package, add your celebration details, pay the advance amount, and submit the request.
                </p>
                {eventFeedback && <p className="event-feedback-success">{eventFeedback}</p>}
                {eventError && <p className="event-feedback-error">{eventError}</p>}
              </div>
            </div>

            <div className="tables-grid event-booking-grid">
              {budgetedEvents.length > 0 ? (
                budgetedEvents.map((event) => {
                  const reservedSeats = getReservedSeatsForEvent(event.id);
                  const availableSeats = Math.max(0, Number(event.capacity || 0) - reservedSeats);
                  const requestForm = eventRequestForms[event.id] || createEventRequestDraft(event.price);

                  return (
                    <article key={event.id} className="table-card event-card">
                      <img
                        src={resolveEventImage(event.eventType, event.imageUrl)}
                        alt={event.title}
                      />
                      <div className="table-card-body">
                        <div className="table-card-top">
                          <h4>{event.title}</h4>
                          <span className="table-type-pill">{event.eventType}</span>
                        </div>
                        <div className="table-meta-row">
                          <span>Date</span>
                          <strong>{event.eventDate || "-"}</strong>
                        </div>
                        <div className="table-meta-row">
                          <span>Time</span>
                          <strong>{event.eventTime || "-"}{event.eventEndTime ? ` - ${event.eventEndTime}` : ""}</strong>
                        </div>
                        <div className="table-meta-row">
                          <span>Price</span>
                          <strong>{formatPrice(event.price)}</strong>
                        </div>
                        <div className="table-meta-row">
                          <span>Available Capacity</span>
                          <strong>{availableSeats}</strong>
                        </div>
                        {event.description && (
                          <p className="event-card-description">{event.description}</p>
                        )}
                        <div className="event-booking-controls">
                          <div className="event-grid-two">
                            <label className="event-field-label">
                              <span>Date</span>
                              <input
                                type="date"
                                max={todayDate}
                                value={requestForm.bookingDate}
                                onChange={(e) => handleEventFormChange(event.id, "bookingDate", e.target.value)}
                              />
                            </label>
                            <label className="event-field-label">
                              <span>Party Size</span>
                              <input
                                type="number"
                                min="1"
                                max={Math.max(1, availableSeats)}
                                placeholder="Guest count"
                                value={requestForm.guestCount}
                                onChange={(e) => handleEventFormChange(event.id, "guestCount", Math.max(1, Number(e.target.value || 1)))}
                              />
                            </label>
                            <label className="event-field-label">
                              <span>Advance Amount</span>
                              <input
                                type="number"
                                min="0"
                                placeholder="Advance amount"
                                value={requestForm.advanceAmount}
                                readOnly
                              />
                            </label>
                          </div>
                          <div className="event-grid-two">
                            <select
                              value={requestForm.decorationTheme}
                              onChange={(e) => handleEventFormChange(event.id, "decorationTheme", e.target.value)}
                            >
                              <option value="Classic">Classic Theme</option>
                              <option value="Romantic">Romantic Theme</option>
                              <option value="Elegant">Elegant Theme</option>
                              <option value="Kids">Kids Theme</option>
                              <option value="Floral">Floral Theme</option>
                              <option value="Balloon">Balloon Theme</option>
                              <option value="Royal">Royal Theme</option>
                              <option value="Vintage">Vintage Theme</option>
                              <option value="Bollywood">Bollywood Theme</option>
                            </select>
                            <select
                              value={requestForm.cakeOption}
                              onChange={(e) => handleEventFormChange(event.id, "cakeOption", e.target.value)}
                            >
                              <option value="Chocolate Cake">Chocolate Cake</option>
                              <option value="Vanilla Cake">Vanilla Cake</option>
                              <option value="Butterscotch Cake">Butterscotch Cake</option>
                              <option value="Black Forest Cake">Black Forest Cake</option>
                              <option value="Red Velvet Cake">Red Velvet Cake</option>
                              <option value="Pineapple Cake">Pineapple Cake</option>
                              <option value="Strawberry Cake">Strawberry Cake</option>
                              <option value="Photo Cake">Photo Cake</option>
                            </select>
                          </div>
                          <div className="event-grid-two">
                            <select
                              value={requestForm.musicOption}
                              onChange={(e) => handleEventFormChange(event.id, "musicOption", e.target.value)}
                            >
                              <option value="Soft Music">Soft Music</option>
                              <option value="Live Acoustic">Live Acoustic</option>
                              <option value="DJ Playlist">DJ Playlist</option>
                              <option value="No Music">No Music</option>
                              <option value="Birthday Songs">Birthday Songs</option>
                              <option value="Romantic Playlist">Romantic Playlist</option>
                              <option value="Bollywood Playlist">Bollywood Playlist</option>
                              <option value="Instrumental Music">Instrumental Music</option>
                              <option value="Live Singer">Live Singer</option>
                            </select>
                            <select
                              value={requestForm.foodPackage}
                              onChange={(e) => handleEventFormChange(event.id, "foodPackage", e.target.value)}
                            >
                              <option value="Snacks + Drinks">Snacks + Drinks</option>
                              <option value="Cake + Coffee Combo">Cake + Coffee Combo</option>
                              <option value="Premium Celebration Platter">Premium Celebration Platter</option>
                              <option value="Custom Food Package">Custom Food Package</option>
                              <option value="Starter Combo">Starter Combo</option>
                              <option value="Dessert Combo">Dessert Combo</option>
                              <option value="Family Celebration Combo">Family Celebration Combo</option>
                              <option value="Kids Party Combo">Kids Party Combo</option>
                              <option value="Full Meal Package">Full Meal Package</option>
                            </select>
                          </div>
                          <div className="event-table-selector">
                            <strong>Select Tables</strong>
                            <div className="event-table-options">
                              {tables.length > 0 ? (
                                tables.map((table) => (
                                  <label key={`event-table-${event.id}-${table.id}`} className="event-table-chip">
                                    <input
                                      type="checkbox"
                                      checked={(requestForm.tableIds || []).includes(table.id)}
                                      onChange={() => handleEventTableToggle(event.id, table)}
                                    />
                                    <span>{`Table ${table.tableNumber || table.id} (${table.seats || 0} seats)`}</span>
                                  </label>
                                ))
                              ) : (
                                <span>No tables available</span>
                              )}
                            </div>
                          </div>
                          <div className="event-table-selector">
                            <strong>Special Setup</strong>
                            <div className="event-table-options">
                              {[
                                ["balloons", "Balloons"],
                                ["photoCorner", "Photo Corner"],
                                ["candlelightSetup", "Candlelight Setup"],
                                ["welcomeBoard", "Welcome Board"],
                              ].map(([key, label]) => (
                                <label key={`${event.id}-${key}`} className="event-table-chip">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(requestForm[key])}
                                    onChange={(e) => handleEventFormChange(event.id, key, e.target.checked)}
                                  />
                                  <span>{label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <input
                            type="text"
                            placeholder="Custom message for board or cake"
                            value={requestForm.customMessage}
                            onChange={(e) => handleEventFormChange(event.id, "customMessage", e.target.value)}
                          />
                          <div className="event-action-row">
                            <button
                              type="button"
                              className="table-book-inline-btn"
                              onClick={() => handleBookEvent(event)}
                              disabled={availableSeats === 0}
                            >
                              {availableSeats === 0 ? "Sold Out" : "Add Event & Pay with Razorpay"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="menu-empty-state">
                  <h4>No events added yet</h4>
                  <p>
                    This cafe has not published any events yet. Please check back later.
                  </p>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="menu-section">
            <div className="menu-section-header">
              <div>
                <h3>{menuSections.find((section) => section.key === activeSection)?.label || "Menu"}</h3>
                <p>
                  {visibleMenuItems.length} item{visibleMenuItems.length === 1 ? "" : "s"} available in
                  this section.
                </p>
              </div>
            </div>

            <div className="menu-grid">
              {visibleMenuItems.length > 0 ? (
                visibleMenuItems.map((item) => {
                  const offerDetails = getSeasonalOfferDetails(item, currentSeason);

                  return (
                    <article key={item.id} className="menu-card">
                      <button
                        type="button"
                        className={`favorite-btn ${favoriteItemIds.includes(item.id) ? "active" : ""}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite(item);
                        }}
                        aria-label={
                          favoriteItemIds.includes(item.id)
                            ? "Remove from favourites"
                            : "Add to favourites"
                        }
                      >
                        {favoriteItemIds.includes(item.id) ? "\u2665" : "\u2661"}
                      </button>
                      {offerDetails.hasOffer && (
                        <div className="seasonal-offer-badge">{offerDetails.offerLabel}</div>
                      )}
                      <img
                        src={resolveImage(item.imageUrl, defaultMenuImage)}
                        alt={item.itemName || item.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = defaultMenuImage;
                        }}
                      />

                      <div className="menu-card-body">
                        <div className="menu-card-copy">
                          <h3>{item.itemName || item.name}</h3>
                          <p className="menu-description">{item.description}</p>
                          {offerDetails.hasOffer && (
                            <p className="menu-offer-copy">Offer active now: {offerDetails.offerLabel}</p>
                          )}
                          {!offerDetails.hasOffer && offerDetails.hasConfiguredOffer && (
                            <p className="menu-offer-copy muted-offer-copy">
                              Seasonal offer configured: {offerDetails.configuredOfferLabel}
                            </p>
                          )}
                        </div>

                        <div className="menu-footer">
                          <div className="price-wrap">
                            {offerDetails.hasOffer && (
                              <span className="original-price">{formatPrice(offerDetails.originalPrice)}</span>
                            )}
                            <span className="price">{formatPrice(offerDetails.discountedPrice)}</span>
                          </div>
                          <button
                            className="add-btn"
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              addToCart(item);
                            }}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="menu-empty-state">
                  <h4>No items in this section yet</h4>
                  <p>Try another category from the sidebar to keep browsing.</p>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default CafeMenu;
