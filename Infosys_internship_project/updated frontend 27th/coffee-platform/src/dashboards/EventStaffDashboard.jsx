import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearActiveSession, getCurrentCafeId, getCurrentUser } from '../utils/session';
import {
  buildEventStaffChecklist,
  getEventBookingsForCafe,
  getEventStoreSignal,
  updateEventStaffOrderStatus,
} from '../utils/eventStore';
import './EventStaffDashboard.css';

const normalizeStatus = (status) => String(status || '').trim().toUpperCase();
const normalizeEventStaffStatus = (status) => normalizeStatus(status || 'EVENT_ORDER');

const getCafeId = (user) => {
  if (user?.cafeId) return String(user.cafeId);
  const storedCafeId = getCurrentCafeId();
  return storedCafeId ? String(storedCafeId) : '';
};

const EventStaffDashboard = () => {
  const navigate = useNavigate();
  const user = useMemo(() => getCurrentUser(), []);
  const cafeId = getCafeId(user);
  const staffName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.email || 'Event Staff';
  const cafeName = user?.cafeName || (cafeId ? `Cafe #${cafeId}` : 'Cafe not linked');
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('event_order');

  useEffect(() => {
    const loadBookings = () => {
      if (!cafeId) {
        setBookings([]);
        return;
      }

      setBookings(getEventBookingsForCafe(cafeId));
    };

    loadBookings();
    const signal = getEventStoreSignal();
    window.addEventListener(signal, loadBookings);
    window.addEventListener('storage', loadBookings);

    return () => {
      window.removeEventListener(signal, loadBookings);
      window.removeEventListener('storage', loadBookings);
    };
  }, [cafeId]);

  const approvedBookings = bookings.filter((booking) => normalizeStatus(booking.bookingStatus) === 'APPROVED');
  const pendingBookings = bookings.filter((booking) => normalizeStatus(booking.bookingStatus) === 'PENDING');
  const eventOrders = approvedBookings.filter((booking) => normalizeEventStaffStatus(booking.eventStaffStatus) === 'EVENT_ORDER');
  const inProgressOrders = approvedBookings.filter((booking) => normalizeEventStaffStatus(booking.eventStaffStatus) === 'IN_PROGRESS');
  const completedOrders = approvedBookings.filter((booking) => normalizeEventStaffStatus(booking.eventStaffStatus) === 'COMPLETED');

  const visibleBookings = activeTab === 'in_progress'
    ? inProgressOrders
    : activeTab === 'completed'
      ? completedOrders
      : eventOrders;

  const sectionTitle = activeTab === 'in_progress'
    ? 'In Progress'
    : activeTab === 'completed'
      ? 'Completed'
      : 'Event Orders';

  const updateOrderStatus = (bookingId, nextStatus) => {
    updateEventStaffOrderStatus(bookingId, nextStatus);
  };

  const logout = () => {
    clearActiveSession();
    navigate('/login');
  };

  return (
    <div className="event-staff-page">
      <aside className="event-staff-sidebar">
        <h2>Event Staff Panel</h2>
        <div className="event-staff-profile">
          <span>Logged In Staff</span>
          <strong>{staffName}</strong>
          <small>{cafeName}</small>
        </div>
        <nav className="event-staff-nav">
          <button
            type="button"
            className={activeTab === 'event_order' ? 'active' : ''}
            onClick={() => setActiveTab('event_order')}
          >
            Event Order
          </button>
          <button
            type="button"
            className={activeTab === 'in_progress' ? 'active' : ''}
            onClick={() => setActiveTab('in_progress')}
          >
            In Progress
          </button>
          <button
            type="button"
            className={activeTab === 'completed' ? 'active' : ''}
            onClick={() => setActiveTab('completed')}
          >
            Completed
          </button>
        </nav>
        <button type="button" className="event-staff-logout" onClick={logout}>
          Logout
        </button>
      </aside>

      <main className="event-staff-main">
        <section className="event-staff-header">
          <div>
            <p className="event-staff-eyebrow">Event Staff</p>
            <h1>Event Preparation Dashboard</h1>
            <p>Track approved event bookings, decoration themes, setup tasks, and customer requests.</p>
          </div>
          <div className="event-staff-stats">
            <div>
              <strong>{eventOrders.length}</strong>
              <span>Event Order</span>
            </div>
            <div>
              <strong>{inProgressOrders.length}</strong>
              <span>In Progress</span>
            </div>
            <div>
              <strong>{completedOrders.length}</strong>
              <span>Completed</span>
            </div>
            <div>
              <strong>{pendingBookings.length}</strong>
              <span>Pending</span>
            </div>
          </div>
        </section>

        <section className="event-staff-section">
          <h2>{sectionTitle}</h2>
          {visibleBookings.length === 0 ? (
            <p className="event-staff-empty">No {sectionTitle.toLowerCase()} found.</p>
          ) : (
            <div className="event-staff-grid">
              {visibleBookings.map((booking) => {
                const checklist = buildEventStaffChecklist(booking);
                const eventStaffStatus = normalizeEventStaffStatus(booking.eventStaffStatus);
                return (
                  <article key={booking.id} className="event-staff-card">
                    {booking.imageUrl && <img src={booking.imageUrl} alt={booking.eventTitle} />}
                    <div className="event-staff-card-body">
                      <div className="event-staff-card-top">
                        <div>
                          <h3>{booking.eventTitle || 'Event Booking'}</h3>
                          <p>{booking.customerName || 'Customer'}</p>
                        </div>
                        <span>{eventStaffStatus.replace('_', ' ')}</span>
                      </div>
                      <div className="event-staff-meta">
                        <span>Date: {booking.bookingDate || booking.eventDate || '-'}</span>
                        <span>Time: {booking.bookingTime || booking.eventTime || '-'}</span>
                        <span>Guests: {booking.guestCount || booking.seats || 0}</span>
                        <span>Theme: {booking.decorationTheme || '-'}</span>
                        <span>Tables: {Array.isArray(booking.tableLabels) && booking.tableLabels.length > 0 ? booking.tableLabels.join(', ') : '-'}</span>
                      </div>
                      <div className="event-staff-checklist">
                        <h4>Preparation Checklist</h4>
                        {checklist.length > 0 ? (
                          <ul>
                            {checklist.map((item, index) => (
                              <li key={`${booking.id}-task-${index}`}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>No setup tasks added.</p>
                        )}
                      </div>
                      <div className="event-staff-actions">
                        {eventStaffStatus === 'EVENT_ORDER' && (
                          <button type="button" onClick={() => updateOrderStatus(booking.id, 'IN_PROGRESS')}>
                            Start Progress
                          </button>
                        )}
                        {eventStaffStatus === 'IN_PROGRESS' && (
                          <button type="button" onClick={() => updateOrderStatus(booking.id, 'COMPLETED')}>
                            Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default EventStaffDashboard;
