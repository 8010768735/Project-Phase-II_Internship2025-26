import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CheckoutBill from '../dashboards/CheckoutBill';
import { formatINR } from '../utils/currency';
import { getCurrentUser } from '../utils/session';
import './TableBookingPage.css';

const defaultCafeImage =
  'https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80&w=900&auto=format&fit=crop';
const BOOKING_HOLD_MINUTES = 30;

const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const resolveImage = (imageUrl) => {
  if (!imageUrl) return defaultCafeImage;
  if (imageUrl.startsWith('data:') || imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  if (imageUrl.startsWith('/')) {
    return `http://localhost:8081${imageUrl}`;
  }
  return defaultCafeImage;
};

const formatCelebrationLabel = (value) => {
  if (!value) return '';
  return String(value)
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const TableBookingPage = () => {
  const { cafeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useMemo(() => {
    return getCurrentUser();
  }, []);

  const initialCafe = useMemo(() => {
    if (location.state?.cafe) return location.state.cafe;
    const raw = localStorage.getItem('selectedCafe');
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return String(parsed?.id) === String(cafeId) ? parsed : parsed;
    } catch {
      return null;
    }
  }, [location.state, cafeId]);

  const [cafe, setCafe] = useState(initialCafe);
  const [tables, setTables] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [guestName, setGuestName] = useState(user?.firstName ? `${user.firstName} ${user?.lastName || ''}`.trim() : '');
  const [guestPhone, setGuestPhone] = useState(user?.phone || '');
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [guestCount, setGuestCount] = useState(2);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [occasion, setOccasion] = useState('');
  const [celebrationEvent, setCelebrationEvent] = useState(false);
  const [celebrationType, setCelebrationType] = useState('');
  const [customCelebrationType, setCustomCelebrationType] = useState('');
  const [decorationTheme, setDecorationTheme] = useState('');
  const [cakeMessage, setCakeMessage] = useState('');
  const [surpriseSetup, setSurpriseSetup] = useState(false);
  const [seating, setSeating] = useState('');
  const [notes, setNotes] = useState('');
  const [agree, setAgree] = useState(false);
  const [advancePaid, setAdvancePaid] = useState(false);
  const [bookingPaymentSummary, setBookingPaymentSummary] = useState(null);
  const [showCheckoutBill, setShowCheckoutBill] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingTables, setLoadingTables] = useState(true);
  const today = useMemo(() => getLocalDateString(), []);

  useEffect(() => {
    axios
      .get(`http://localhost:8081/api/cafe/${cafeId}`)
      .then((res) => {
        setCafe(res.data);
        localStorage.setItem('selectedCafe', JSON.stringify(res.data));
      })
      .catch((err) => console.error('Failed to fetch cafe details', err));
  }, [cafeId]);

  useEffect(() => {
    setLoadingTables(true);
    Promise.all([
      axios.get(`http://localhost:8081/api/tables/cafe/${cafeId}`),
      axios.get(`http://localhost:8081/api/bookings/cafe/${cafeId}`),
    ])
      .then(([tablesRes, bookingsRes]) => {
        setTables(Array.isArray(tablesRes.data) ? tablesRes.data : []);
        setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
      })
      .catch((err) => {
        console.error('Failed to fetch booking data', err);
        setTables([]);
        setBookings([]);
      })
      .finally(() => setLoadingTables(false));
  }, [cafeId]);

  const availableTables = useMemo(() => {
    const selectedDate = String(date || '').trim();
    const selectedTime = String(time || '').trim();

    const blockedTableIds = new Set(
      bookings
        .filter((booking) => {
          const normalizedStatus = String(booking.status || 'PENDING').trim().toUpperCase();
          const isBlockedStatus = !['DECLINED', 'CANCELLED', 'COMPLETED', 'EXPIRED', 'NO_SHOW'].includes(normalizedStatus);

          if (!isBlockedStatus) {
            return false;
          }

          if (!selectedDate || !selectedTime) {
            return false;
          }

          return String(booking.bookingDate || '').trim() === selectedDate &&
            String(booking.bookingTime || '').trim() === selectedTime;
        })
        .map((booking) => Number(booking.tableId))
        .filter((tableId) => Number.isFinite(tableId))
    );

    return tables.filter((table) =>
      Number(table.seats || 0) >= Number(guestCount || 0) &&
      !blockedTableIds.has(Number(table.id))
    );
  }, [tables, bookings, guestCount, date, time]);

  const tableAvailability = useMemo(() => {
    const selectedDate = String(date || '').trim();
    const selectedTime = String(time || '').trim();

    return tables
      .filter((table) => Number(table.seats || 0) >= Number(guestCount || 0))
      .map((table) => {
        const matchingBooking = bookings.find((booking) => {
          const normalizedStatus = String(booking.status || 'PENDING').trim().toUpperCase();
          const isBlockedStatus = !['DECLINED', 'CANCELLED', 'COMPLETED', 'EXPIRED', 'NO_SHOW'].includes(normalizedStatus);

          if (!isBlockedStatus || !selectedDate || !selectedTime) {
            return false;
          }

          return Number(booking.tableId) === Number(table.id) &&
            String(booking.bookingDate || '').trim() === selectedDate &&
            String(booking.bookingTime || '').trim() === selectedTime;
        });

        if (!matchingBooking) {
          return { ...table, isBlocked: false, helperText: '' };
        }

        let helperText = 'Temporarily booked';

        try {
          const holdEnd = new Date(`${matchingBooking.bookingDate}T${matchingBooking.bookingTime}`);
          holdEnd.setMinutes(holdEnd.getMinutes() + BOOKING_HOLD_MINUTES);

          const remainingMinutes = Math.max(0, Math.ceil((holdEnd.getTime() - Date.now()) / 60000));
          const holdUntil = holdEnd.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

          helperText = remainingMinutes > 0
            ? `Available in ${remainingMinutes} min Â· held until ${holdUntil}`
            : `Held until ${holdUntil}`;
        } catch {
          helperText = 'Temporarily booked';
        }

        return { ...table, isBlocked: true, helperText };
      });
  }, [tables, bookings, guestCount, date, time]);

  useEffect(() => {
    if (selectedTable && !availableTables.some((table) => Number(table.id) === Number(selectedTable.id))) {
      setSelectedTable(null);
    }
  }, [availableTables, selectedTable]);

  const bookingAmount = Number(selectedTable?.price || 0);

  const bookingPaymentItems = useMemo(() => {
    if (!selectedTable) return [];

    return [
      {
        id: `table-booking-${selectedTable.id}`,
        name: `Table ${selectedTable.tableNumber || selectedTable.id} Booking`,
        price: bookingAmount,
        quantity: 1,
      },
    ];
  }, [selectedTable, bookingAmount]);

  useEffect(() => {
    setAdvancePaid(false);
    setBookingPaymentSummary(null);
  }, [selectedTable, date, time, guestCount]);

  const validate = ({ includePayment = true } = {}) => {
    const next = {};
    if (!guestName.trim()) next.name = 'Please enter your name';
    if (guestName.trim() && !/^[A-Za-z\s]+$/.test(guestName.trim())) next.name = 'Name should contain only letters';
    if (!guestPhone.trim()) next.phone = 'Please enter your phone';
    if (guestPhone && !/^\d{10}$/.test(guestPhone.replace(/\D/g, ''))) next.phone = 'Phone number must be exactly 10 digits';
    if (!guestEmail.trim()) next.email = 'Please enter your email';
    if (guestEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(guestEmail)) next.email = 'Enter a valid email';
    if (!guestCount || Number(guestCount) < 1) next.guests = 'Enter guest count';
    if (!date) next.date = 'Choose a date';
    if (date && date > today) next.date = 'Date cannot be in the future';
    if (!time) next.time = 'Choose a time';
    if (!selectedTable) next.table = 'Select a table';
    if (selectedTable && Number(selectedTable.seats || 0) < Number(guestCount || 0)) {
      next.table = 'Selected table cannot fit guests';
    }
    if (celebrationEvent && !celebrationType) next.celebrationType = 'Select the celebration type';
    if (celebrationEvent && celebrationType === 'other' && !customCelebrationType.trim()) {
      next.customCelebrationType = 'Enter your event name';
    }
    if (!agree) next.agree = 'You must accept the terms';
    if (includePayment && !advancePaid) next.advance = 'Pay the booking amount to confirm the booking';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleAdvancePayment = () => {
    if (!validate({ includePayment: false })) return;
    if (!selectedTable) {
      setErrors((prev) => ({ ...prev, table: 'Select a table' }));
      return;
    }
    setShowCheckoutBill(true);
  };

  const submitTableBooking = async (paymentSummary) => {
    setSubmitting(true);
    try {
      await axios.post('http://localhost:8081/api/bookings', {
        customerId: user?.id || null,
        name: guestName,
        phone: guestPhone,
        email: guestEmail,
        bookingDate: date,
        bookingTime: time,
        people: Number(guestCount),
        cafeId: Number(cafeId),
        cafeName: cafe?.cafeName || '',
        tableId: selectedTable?.id || null,
        tableNumber: selectedTable?.tableNumber || String(selectedTable?.id || ''),
        occasion,
        celebrationEvent,
        celebrationType: celebrationEvent ? celebrationType : '',
        customCelebrationType: celebrationEvent && celebrationType === 'other' ? customCelebrationType : '',
        decorationTheme: celebrationEvent ? decorationTheme : '',
        cakeMessage: celebrationEvent ? cakeMessage : '',
        surpriseSetup: celebrationEvent ? surpriseSetup : false,
        seatingPreference: seating,
        notes,
        advancePaymentAmount: paymentSummary?.total || bookingAmount,
        advancePaymentMethod: 'Razorpay',
        advancePaymentStatus: 'PAID',
      });

      alert(
        `Booking request sent for Table ${selectedTable?.tableNumber || selectedTable?.id} at ${cafe?.cafeName || 'the cafe'}. Payment of ${formatINR(paymentSummary?.total || bookingAmount)} received via Razorpay. The cafe owner can now approve it.`
      );
      navigate('/customer-account?tab=tables');
    } catch (error) {
      console.error('Failed to create booking', error);
      alert('Could not place the booking request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookingPaymentSuccess = async (billSummary) => {
    setBookingPaymentSummary(billSummary);
    setAdvancePaid(true);
    setShowCheckoutBill(false);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.advance;
      return next;
    });
    await submitTableBooking(billSummary);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate({ includePayment: true })) return;
    await submitTableBooking(bookingPaymentSummary);
  };

  return (
    <div className="booking-page">
      {showCheckoutBill && (
        <CheckoutBill
          cartItems={bookingPaymentItems}
          onBack={() => setShowCheckoutBill(false)}
          onProceed={handleBookingPaymentSuccess}
        />
      )}
      <Header />
      <main className="booking-container">
        <div className="booking-hero">
          <div className="hero-left">
            <h2 className="booking-title">Table Booking</h2>
            {cafe && (
              <div className="cafe-meta">
                <img src={resolveImage(cafe.imageUrl)} alt={cafe.cafeName} className="cafe-thumb" />
                <div className="cafe-meta-text">
                  <div className="cafe-name">{cafe.cafeName}</div>
                  <div className="cafe-location">
                    {[cafe.address, cafe.city, cafe.state].filter(Boolean).join(', ') || 'Cafe location'}
                  </div>
                  <div className="cafe-rating">
                    Working hours: {cafe.openingTime || '--'} to {cafe.closingTime || '--'}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="hero-right">
            <div className="steps">
              <div className="step active">1 Details</div>
              <div className="step">2 Table</div>
              <div className="step">3 Confirm</div>
            </div>
          </div>
        </div>

        <form className="booking-form-card" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="left-col">
              <div className="form-card">
                <h3 className="card-title">Your Details</h3>
                <div className="form-row">
                  <label>Name</label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value.replace(/[^A-Za-z\s]/g, ''))}
                  />
                  {errors.name && <div className="error">{errors.name}</div>}
                </div>
                <div className="form-row">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    inputMode="numeric"
                    maxLength={10}
                  />
                  {errors.phone && <div className="error">{errors.phone}</div>}
                </div>
                <div className="form-row">
                  <label>Email</label>
                  <input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
                  {errors.email && <div className="error">{errors.email}</div>}
                </div>
                <div className="form-row two">
                  <div>
                    <label>Guests</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={guestCount}
                      onChange={(e) => setGuestCount(Number(e.target.value))}
                    />
                    {errors.guests && <div className="error">{errors.guests}</div>}
                  </div>
                  <div>
                    <label>Date</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={today} />
                    {errors.date && <div className="error">{errors.date}</div>}
                  </div>
                  <div>
                    <label>Time</label>
                    <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                    {errors.time && <div className="error">{errors.time}</div>}
                  </div>
                </div>
                {errors.datetime && <div className="error">{errors.datetime}</div>}
                <div className="form-row two">
                  <div>
                    <label>Occasion</label>
                    <select value={occasion} onChange={(e) => setOccasion(e.target.value)}>
                      <option value="">Select</option>
                      <option value="casual">Casual</option>
                      <option value="celebration">Celebration</option>
                      <option value="birthday">Birthday</option>
                      <option value="anniversary">Anniversary</option>
                      <option value="business">Business</option>
                    </select>
                  </div>
                  <div>
                    <label>Seating Preference</label>
                    <select value={seating} onChange={(e) => setSeating(e.target.value)}>
                      <option value="">No preference</option>
                      <option value="indoor">Indoor</option>
                      <option value="outdoor">Outdoor</option>
                      <option value="window">Near window</option>
                    </select>
                  </div>
                </div>
                <div className="form-row checkbox-row full-row">
                  <label className="checkbox booking-consent">
                    <input
                      type="checkbox"
                      checked={celebrationEvent}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setCelebrationEvent(checked);
                        if (!checked) {
                          setCelebrationType('');
                          setCustomCelebrationType('');
                          setDecorationTheme('');
                          setCakeMessage('');
                          setSurpriseSetup(false);
                        } else if (!occasion) {
                          setOccasion('celebration');
                        }
                      }}
                    />
                    <span>Planning a birthday, anniversary, or other celebration event</span>
                  </label>
                </div>
                {celebrationEvent && (
                  <>
                    <div className="form-row two">
                      <div>
                        <label>Celebration Type</label>
                        <select value={celebrationType} onChange={(e) => setCelebrationType(e.target.value)}>
                          <option value="">Select event type</option>
                          <option value="birthday">Birthday</option>
                          <option value="anniversary">Anniversary</option>
                          <option value="baby_shower">Baby Shower</option>
                          <option value="farewell">Farewell</option>
                          <option value="proposal">Proposal</option>
                          <option value="other">Other</option>
                        </select>
                        {errors.celebrationType && <div className="error">{errors.celebrationType}</div>}
                      </div>
                      <div>
                        <label>Decoration Theme</label>
                        <select value={decorationTheme} onChange={(e) => setDecorationTheme(e.target.value)}>
                          <option value="">Select theme</option>
                          <option value="classic">Classic</option>
                          <option value="romantic">Romantic</option>
                          <option value="kids">Kids Party</option>
                          <option value="minimal">Minimal</option>
                          <option value="premium">Premium</option>
                        </select>
                      </div>
                    </div>
                    {celebrationType === 'other' && (
                      <div className="form-row">
                        <label>Event Name</label>
                        <input
                          type="text"
                          value={customCelebrationType}
                          onChange={(e) => setCustomCelebrationType(e.target.value)}
                          placeholder="Example: Farewell dinner"
                        />
                        {errors.customCelebrationType && <div className="error">{errors.customCelebrationType}</div>}
                      </div>
                    )}
                    <div className="form-row two">
                      <div>
                        <label>Cake Message</label>
                        <input
                          type="text"
                          value={cakeMessage}
                          onChange={(e) => setCakeMessage(e.target.value)}
                          placeholder="Happy Birthday Aarav"
                        />
                      </div>
                      <div className="checkbox-row">
                        <label className="checkbox booking-consent">
                          <input
                            type="checkbox"
                            checked={surpriseSetup}
                            onChange={(e) => setSurpriseSetup(e.target.checked)}
                          />
                          <span>Need a surprise setup</span>
                        </label>
                      </div>
                    </div>
                  </>
                )}
                <div className="form-row">
                  <label>Special Requests</label>
                  <textarea
                    rows="3"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={celebrationEvent ? 'Add decoration, cake, music, or welcome-board requests' : ''}
                  />
                </div>
                <div className="form-row checkbox-row full-row">
                  <label className="checkbox booking-consent">
                    <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                    <span>I agree to the booking policies</span>
                  </label>
                  {errors.agree && <div className="error">{errors.agree}</div>}
                </div>
                <div className="form-row">
                  <label>Booking Payment</label>
                  <div className="muted">
                    {selectedTable
                      ? `Pay ${formatINR(bookingAmount)} with Razorpay to reserve this table.`
                      : 'Select a table to see the booking price.'}
                  </div>
                  <button type="button" className="btn-secondary" onClick={handleAdvancePayment}>
                    {advancePaid
                      ? `Payment Done: ${formatINR(bookingPaymentSummary?.total || bookingAmount)}`
                      : `Pay with Razorpay${selectedTable ? ` ${formatINR(bookingAmount)}` : ''}`}
                  </button>
                  {errors.advance && <div className="error">{errors.advance}</div>}
                </div>
              </div>

              <div className="form-card">
                <h3 className="card-title">Choose a Table</h3>
                <div className="table-grid">
                  {loadingTables && <div className="muted">Loading tables...</div>}
                  {!loadingTables && tableAvailability.length > 0 && (
                    tableAvailability.map((table) => (
                      <button
                        key={table.id}
                        type="button"
                        className={`table-pill ${selectedTable?.id === table.id ? 'selected' : ''} ${table.isBlocked ? 'disabled' : ''}`}
                        onClick={() => !table.isBlocked && setSelectedTable(table)}
                        disabled={table.isBlocked}
                        title={table.helperText || undefined}
                      >
                        <span>Table {table.tableNumber || table.id} · {table.seats} seats · {formatINR(table.price || 0)}</span>
                        {table.helperText && <small>{table.helperText}</small>}
                      </button>
                    ))
                  )}
                  {!loadingTables && tableAvailability.length === 0 && (
                    <div className="muted">No tables available right now.</div>
                  )}
                  {errors.table && <div className="error">{errors.table}</div>}
                </div>
              </div>
            </div>

            <div className="form-card summary-card">
              <h3 className="card-title">Booking Summary</h3>
              <div className="summary-list">
                <div className="summary-row">
                  <span>Cafe</span>
                  <strong>{cafe?.cafeName || '-'}</strong>
                </div>
                <div className="summary-row">
                  <span>Date</span>
                  <strong>{date || '-'}</strong>
                </div>
                <div className="summary-row">
                  <span>Time</span>
                  <strong>{time || '-'}</strong>
                </div>
                <div className="summary-row">
                  <span>Guests</span>
                  <strong>{guestCount || '-'}</strong>
                </div>
                <div className="summary-row">
                  <span>Table</span>
                  <strong>{selectedTable ? `#${selectedTable.tableNumber || selectedTable.id} Â· ${selectedTable.seats} seats` : '-'}</strong>
                </div>
                <div className="summary-row">
                  <span>Table Price</span>
                  <strong>{selectedTable ? formatINR(bookingAmount) : '-'}</strong>
                </div>
                <div className="summary-row">
                  <span>Name</span>
                  <strong>{guestName || '-'}</strong>
                </div>
                <div className="summary-row">
                  <span>Phone</span>
                  <strong>{guestPhone || '-'}</strong>
                </div>
                <div className="summary-row">
                  <span>Email</span>
                  <strong>{guestEmail || '-'}</strong>
                </div>
                <div className="summary-row">
                  <span>Occasion</span>
                  <strong>{occasion || '-'}</strong>
                </div>
                <div className="summary-row">
                  <span>Celebration</span>
                  <strong>
                    {celebrationEvent
                      ? celebrationType === 'other'
                        ? customCelebrationType || 'Other'
                        : formatCelebrationLabel(celebrationType)
                      : '-'}
                  </strong>
                </div>
                <div className="summary-row">
                  <span>Theme</span>
                  <strong>{decorationTheme ? formatCelebrationLabel(decorationTheme) : '-'}</strong>
                </div>
                <div className="summary-row">
                  <span>Surprise Setup</span>
                  <strong>{celebrationEvent ? (surpriseSetup ? 'Yes' : 'No') : '-'}</strong>
                </div>
                <div className="summary-row">
                  <span>Cake Message</span>
                  <strong>{celebrationEvent ? cakeMessage || '-' : '-'}</strong>
                </div>
                <div className="summary-row">
                  <span>Payment</span>
                  <strong>{advancePaid ? 'Paid via Razorpay' : 'Pending'}</strong>
                </div>
                <div className="summary-notes">
                  <span>Requests</span>
                  <p>{notes || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="actions">
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
              Back
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default TableBookingPage;



