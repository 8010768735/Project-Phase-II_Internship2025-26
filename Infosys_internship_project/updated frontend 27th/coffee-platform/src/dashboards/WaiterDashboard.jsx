import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './WaiterDashboard.css';
import { clearActiveSession, getCurrentCafeId, getCurrentUser } from '../utils/session';
import { buildEventPreparationChecklist, getEventBookingsForCafe, getEventStoreSignal } from '../utils/eventStore';

const API_BASE_URL = 'http://localhost:8081';
const STAFF_HELP_ALERTS_KEY = 'staff_help_alerts';
const CUSTOMER_PAYMENT_RECORDS_KEY = 'customer_payment_records';
const SUMMARY_REFRESH_INTERVAL_MS = 15000;
const DEFAULT_SUMMARY = {
  totalOrders: 0,
  activeOrders: 0,
  readyOrders: 0,
  servedOrders: 0,
  totalTables: 0,
  totalReservations: 0,
  pendingReservations: 0,
  totalWaiters: 0
};

const normalizeWaiterOrderStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (['new', 'approved', 'pending'].includes(normalized)) return 'Pending';
  if (['preparing', 'in progress', 'in_progress'].includes(normalized)) return 'Preparing';
  if (['ready', 'prepared', 'completed'].includes(normalized)) return 'Ready';
  if (normalized === 'served') return 'Served';
  return status || 'Pending';
};

const normalizeStaffRole = (role) => String(role || '').trim().toLowerCase();
const formatOrderTable = (value, orderId) =>
  value === null || value === undefined || value === '' || Number(value) === 0
    ? 'Menu Order'
    : value;

const formatOrderTableLabel = (value) =>
  String(value) === 'Menu Order' ? 'Menu Order' : `Table ${value}`;

const createPlaceholderImage = (label, backgroundColor) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="16" fill="${backgroundColor}" />
      <text x="32" y="37" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="#fffaf4">
        ${label}
      </text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const FOOD_PLACEHOLDER_IMAGE = createPlaceholderImage('Food', '#8b5e34');
const PHOTO_PLACEHOLDER_IMAGE = createPlaceholderImage('Photo', '#6b7280');

const resolveCafeId = () => {
  try {
    const parsedUser = getCurrentUser();
    if (parsedUser?.cafeId) {
      return String(parsedUser.cafeId);
    }
  } catch {}

  const storedCafeId = getCurrentCafeId();
  return storedCafeId ? String(storedCafeId) : '';
};

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const readCustomerPaymentRecords = () => {
  try {
    const raw = localStorage.getItem(CUSTOMER_PAYMENT_RECORDS_KEY) || '[]';
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const WaiterDashboard = () => {
  const ENABLE_DEMO_REQUEST_SIMULATION = false;
  const currentUser = getCurrentUser();
  const waiterId = currentUser?.id ? Number(currentUser.id) : null;
  const staffName = [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ').trim() || currentUser?.email || 'Waiter';
  /* ==========================================================
     LOCAL STORAGE & INITIAL STATE (TABLES & MENU)
     ========================================================== */
  const readKitchenOrders = () => {
    try {
      const raw = localStorage.getItem('kitchen_orders') || '[]';
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };
  const loadKitchenOrders = (targetCafeId = resolveCafeId()) => {
    const arr = readKitchenOrders();
    if (!targetCafeId) return arr;
    return arr.filter((order) => String(order.cafeId ?? '') === String(targetCafeId));
  };
  const saveKitchenOrders = (arr, targetCafeId = resolveCafeId()) => {
    try {
      if (!targetCafeId) {
        localStorage.setItem('kitchen_orders', JSON.stringify(arr));
        return;
      }

      const allOrders = readKitchenOrders();
      const remainingOrders = allOrders.filter(
        (order) => String(order.cafeId ?? '') !== String(targetCafeId)
      );
      const scopedOrders = arr.map((order) => ({
        ...order,
        cafeId: order.cafeId ?? Number(targetCafeId),
      }));
      localStorage.setItem('kitchen_orders', JSON.stringify([...remainingOrders, ...scopedOrders]));
    } catch {}
  };
  const [tables, setTables] = useState([
    { id: 1, status: 'Empty', capacity: 4, x: 50, y: 50, shape: 'square' },
    { id: 2, status: 'Occupied', capacity: 2, customer: 'Alice', seatingTime: Date.now() - (60 * 60 * 1000), currentOrder: { id: 101, items: [{ name: 'Latte', quantity: 1, price: 4.00 }, { name: 'Croissant', quantity: 1, price: 3.50 }], status: 'Preparing' }, x: 200, y: 50, shape: 'circle' },
    { id: 3, status: 'Reserved', capacity: 6, customer: 'Bob', reservationTime: '12:00 PM', x: 350, y: 50, shape: 'rectangle' },
    { id: 4, status: 'Empty', capacity: 4, x: 50, y: 200, shape: 'square' },
    { id: 5, status: 'Occupied', capacity: 3, customer: 'Charlie', seatingTime: Date.now() - (30 * 60 * 1000), currentOrder: { id: 102, items: [{ name: 'Espresso', quantity: 1, price: 2.50 }, { name: 'Muffin', quantity: 1, price: 3.00 }], status: 'Ready' }, x: 200, y: 200, shape: 'circle' },
    { id: 6, status: 'Empty', capacity: 2, x: 350, y: 200, shape: 'square' },
    { id: 7, status: 'Occupied', capacity: 4, customer: 'David', seatingTime: Date.now() - (15 * 60 * 1000), currentOrder: { id: 103, items: [{ name: 'Cappuccino', quantity: 2, price: 4.00 }], status: 'Served' }, x: 500, y: 125, shape: 'rectangle' },
  ]);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [menu, setMenu] = useState([
    { id: 'm1', name: 'Espresso', price: 2.50, category: 'Coffee' },
    { id: 'm2', name: 'Latte', price: 4.00, category: 'Coffee' },
    { id: 'm3', name: 'Cappuccino', price: 4.00, category: 'Coffee' },
    { id: 'm4', name: 'Americano', price: 3.00, category: 'Coffee' },
    { id: 'm5', name: 'Croissant', price: 3.50, category: 'Pastry' },
    { id: 'm6', name: 'Muffin', price: 3.00, category: 'Pastry' },
    { id: 'm7', name: 'Orange Juice', price: 3.00, category: 'Beverage' },
    { id: 'm8', name: 'Still Water', price: 2.00, category: 'Beverage' },
  ]);
  const [selectedItems, setSelectedItems] = useState({}); // {itemId: quantity}
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentTableId, setPaymentTableId] = useState(null);
  const [amountReceived, setAmountReceived] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  /* ==========================================================
     CUSTOMER REQUEST MANAGEMENT
     ========================================================== */
  const [customerRequests, setCustomerRequests] = useState([]);
  const [showRequestManagement, setShowRequestManagement] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [requestFilterStatus, setRequestFilterStatus] = useState('All');
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [requestNotice, setRequestNotice] = useState('');

  useEffect(() => {
    const requestsForSelectedTable = customerRequests.filter(req => req.tableId === selectedTable);
    if (requestFilterStatus === 'All') {
      setFilteredRequests(requestsForSelectedTable);
    } else {
      setFilteredRequests(requestsForSelectedTable.filter(req => req.status === requestFilterStatus));
    }
  }, [customerRequests, selectedTable, requestFilterStatus]);

  const handleAddRequest = useCallback((tableId, requestType, options = {}) => {
    const { notify = true } = options;

    const newRequest = {
      id: Date.now(),
      tableId,
      requestType,
      status: 'Pending',
      timestamp: Date.now(),
    };

    setCustomerRequests((prevRequests) => [...prevRequests, newRequest]);

    if (notify) {
      setRequestNotice(`New request from Table ${tableId}: ${requestType}`);
    }
  }, []);

  useEffect(() => {
    if (!requestNotice) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setRequestNotice('');
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [requestNotice]);

  // Function to update the status of a customer request
  const handleUpdateRequestStatus = (requestId, newStatus) => {
    setCustomerRequests((prevRequests) =>
      prevRequests.map((req) =>
        req.id === requestId ? { ...req, status: newStatus } : req
      )
    );
  };

  useEffect(() => {
    if (!ENABLE_DEMO_REQUEST_SIMULATION) {
      return undefined;
    }

    const interval = setInterval(() => {
      const randomTableId = Math.floor(Math.random() * tables.length) + 1;
      const requestTypes = ['Water', 'Bill', 'Assistance', 'Order'];
      const randomRequestType = requestTypes[Math.floor(Math.random() * requestTypes.length)];
      if (Math.random() < 0.3) {
        handleAddRequest(randomTableId, randomRequestType, { notify: false });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [ENABLE_DEMO_REQUEST_SIMULATION, tables.length, handleAddRequest]);

  /* ==========================================================
     TABLE & CUSTOMER ASSIGNMENT HANDLERS
     ========================================================== */
  const handleAssignCustomer = (e) => {
    e.preventDefault();
    if (selectedTableId && customerName) {
      setTables(tables.map((table) =>
        table.id === selectedTableId
          ? { ...table, status: 'Occupied', customer: customerName, seatingTime: Date.now(), currentOrder: null } // No order initially
          : table
      ));
      // Keep selectedTableId for immediate order taking
      setCustomerName('');
      setSelectedItems({}); // Clear selected items for the new customer
    }
  };

  const handleClearTable = (id) => {
    setTables(tables.map((table) =>
      table.id === id
        ? { ...table, status: 'Empty', customer: undefined, seatingTime: undefined, currentOrder: undefined }
        : table
    ));
  };

  const handleServeOrder = (tableId) => {
    setTables(prev =>
      prev.map((table) => {
        if (table.id === tableId && table.currentOrder) {
          const served = { ...table.currentOrder, status: 'Served' };
          const orders = loadKitchenOrders();
          const updated = orders.map(o => o.id === served.id ? { ...o, status: 'Served', timestamp: Date.now() } : o);
          saveKitchenOrders(updated);
          return { ...table, currentOrder: served };
        }
        return table;
      })
    );
  };

  const handleProcessPayment = (e) => {
    e.preventDefault();
    if (paymentTableId && amountReceived) {
      const tableToPay = tables.find(table => table.id === paymentTableId);
      if (tableToPay && tableToPay.currentOrder) {
        const totalAmount = tableToPay.currentOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (parseFloat(amountReceived) >= totalAmount) {
          alert(`Payment of $${amountReceived} received for Table ${paymentTableId} via ${paymentMethod}. Change: $${(parseFloat(amountReceived) - totalAmount).toFixed(2)}`);
          setTables(tables.map((table) =>
            table.id === paymentTableId
              ? { ...table, status: 'Empty', customer: undefined, seatingTime: undefined, currentOrder: undefined }
              : table
          ));
          setShowPaymentForm(false);
          setPaymentTableId(null);
          setAmountReceived('');
          setPaymentMethod('Cash');
        } else {
          alert(`Amount received ($${amountReceived}) is less than total amount ($${totalAmount.toFixed(2)}).`);
        }
      }
    }
  };

  const handleInitiatePayment = (tableId) => {
    setPaymentTableId(tableId);
    setShowPaymentForm(true);
    const tableToPay = tables.find(table => table.id === tableId);
    if (tableToPay && tableToPay.currentOrder) {
      const totalAmount = tableToPay.currentOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      setAmountReceived(totalAmount.toFixed(2)); // Pre-fill with total amount
    }
  };

  const handleSelectTable = (id) => {
    setSelectedTableId(id);
    setCustomerName('');
    setSelectedItems({}); // Clear selected items when a new table is selected
  };

  /* ==========================================================
     ORDER TAKING & QUANTITY HANDLERS
     ========================================================== */
  const handleQuantityChange = (itemId, change) => {
    setSelectedItems((prevSelectedItems) => {
      const newQuantity = (prevSelectedItems[itemId] || 0) + change;
      if (newQuantity < 0) return prevSelectedItems; // Quantity cannot be negative
      if (newQuantity === 0) {
        const newItems = { ...prevSelectedItems };
        delete newItems[itemId];
        return newItems;
      }
      return {
        ...prevSelectedItems,
        [itemId]: newQuantity,
      };
    });
  };

  const formatSeatingTime = (timestamp) => {
    const now = Date.now();
    const elapsed = now - timestamp; // milliseconds
    const minutes = Math.floor(elapsed / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    } else {
      return `${remainingMinutes}m`;
    }
  };

  const scrollTo = (id) => {
    try {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {}
  };
  const [activeTab, setActiveTab] = useState('orders');
  const handleSidebarTabChange = useCallback((tabName) => {
    setActiveTab(tabName);
    window.requestAnimationFrame(() => {
      scrollTo(`waiter-tab-${tabName}`);
    });
  }, []);
  const [orders, setOrders] = useState(() => loadKitchenOrders(resolveCafeId()));
  const [alerts, setAlerts] = useState([]);
  const [toast, setToast] = useState(null);
  const [lastNotifId, setLastNotifId] = useState(null);
  const [cafeId, setCafeId] = useState(() => resolveCafeId());
  const [cafeName, setCafeName] = useState(currentUser?.cafeName || '');
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');
  const [customerPayments, setCustomerPayments] = useState(() => readCustomerPaymentRecords());
  const [todayEventBookings, setTodayEventBookings] = useState([]);

  useEffect(() => {
    const loadTodayEvents = () => {
      if (!cafeId) {
        setTodayEventBookings([]);
        return;
      }

      const today = getTodayDateString();
      setTodayEventBookings(
        getEventBookingsForCafe(cafeId).filter((booking) => {
          const approved = String(booking.bookingStatus || "").toUpperCase() === "APPROVED";
          const bookingDate = String(booking.bookingDate || booking.eventDate || "");
          return approved && bookingDate && bookingDate <= today;
        })
      );
    };

    loadTodayEvents();
    const signal = getEventStoreSignal();
    window.addEventListener(signal, loadTodayEvents);
    window.addEventListener('storage', loadTodayEvents);
    return () => {
      window.removeEventListener(signal, loadTodayEvents);
      window.removeEventListener('storage', loadTodayEvents);
    };
  }, [cafeId]);

  const parseBackendOrderItems = useCallback((order) => {
    const tryParse = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    };

    const parsedItems = tryParse(order.itemsSummary) || tryParse(order.items);
    if (parsedItems.length > 0) {
      return parsedItems.map((item, index) => {
        if (typeof item === 'string') {
          return { name: item, quantity: 1 };
        }

        return {
          name: item.name || item.itemName || `Item ${index + 1}`,
          quantity: item.quantity ?? item.qty ?? 1,
          price: item.price ?? 0,
        };
      });
    }

    const plainText = [order.itemsSummary, order.items]
      .find((value) => typeof value === 'string' && value.trim() && !value.trim().startsWith('['));

    if (!plainText) {
      return [];
    }

    return plainText
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((name) => ({ name, quantity: 1, price: 0 }));
  }, []);

  const mapBackendOrder = useCallback((order) => ({
    ...order,
    table: formatOrderTable(order.table ?? order.tableNumber, order.id),
    items: parseBackendOrderItems(order),
    status: normalizeWaiterOrderStatus(order.status || order.orderStatus),
    timestamp: order.createdAt ? new Date(order.createdAt).getTime() : Date.now(),
    assignedWaiterId: order.assignedWaiterId ?? null,
    assignedWaiterName: order.assignedWaiterName ?? '',
  }), [parseBackendOrderItems]);
  const itemImageMap = {
    'Espresso': 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=300&q=60',
    'Latte': 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=300&q=60',
    'Cappuccino': 'https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=300&q=60',
    'Americano': 'https://images.unsplash.com/photo-1461988091159-192b6df7054f?auto=format&fit=crop&w=300&q=60',
    'Croissant': 'https://images.unsplash.com/photo-1546263667-ccb7ee7dfa6a?auto=format&fit=crop&w=300&q=60',
    'Muffin': 'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?auto=format&fit=crop&w=300&q=60',
    'Orange Juice': 'https://images.unsplash.com/photo-1571078321249-cd7bcb9c05b0?auto=format&fit=crop&w=300&q=60',
    'Still Water': 'https://images.unsplash.com/photo-1517940310602-115e9d6c3b8a?auto=format&fit=crop&w=300&q=60'
  };
  /* ==========================================================
     WAITER TEAM MANAGEMENT STATE & HANDLERS
     ========================================================== */
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [mName, setMName] = useState('');
  const [mEmail, setMEmail] = useState('');
  const [mPhone, setMPhone] = useState('');
  const [mGender, setMGender] = useState('');
  const [mAddress, setMAddress] = useState('');
  const [mQualification, setMQualification] = useState('');
  const [mPassword, setMPassword] = useState('');
  const openManage = (member) => {
    setEditMember(member || null);
    setMName(member ? member.name : '');
    setMEmail(member ? member.email : '');
    setMPhone(member ? member.phone : '');
    setMGender(member ? member.gender || '' : '');
    setMAddress(member ? member.address || '' : '');
    setMQualification(member ? member.qualifications || '' : '');
    setMPassword('');
    setShowManage(true);
  };
  const fetchWaiterTeam = useCallback(async () => {
    if (!cafeId) {
      setTeamMembers([]);
      return;
    }

    try {
      setTeamLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/staff/cafe/${cafeId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch waiter team');
      }

      const data = await response.json();
      const waiters = Array.isArray(data)
        ? data.filter((member) => normalizeStaffRole(member.role) === 'waiter')
        : [];
      setTeamMembers(waiters);
    } catch (error) {
      console.error('Failed to fetch waiter team:', error);
      setTeamMembers([]);
    } finally {
      setTeamLoading(false);
    }
  }, [cafeId]);
  const loadWaiterAlerts = useCallback(() => {
    try {
      const notifRaw = localStorage.getItem('waiter_notifications') || '[]';
      const helpRaw = localStorage.getItem(STAFF_HELP_ALERTS_KEY) || '[]';
      const legacyAlerts = JSON.parse(notifRaw);
      const helpAlerts = JSON.parse(helpRaw);
      const currentOrdersById = new Map(
        (Array.isArray(orders) ? orders : []).map((order) => [Number(order.id), order])
      );

      const normalizedLegacyAlerts = Array.isArray(legacyAlerts)
        ? legacyAlerts
            .map((alert) => {
              const matchingOrder = currentOrdersById.get(Number(alert?.orderId));
              if (!matchingOrder) {
                return null;
              }

              return {
                ...alert,
                id: alert.id ?? Date.now(),
                type: alert.type || 'order_ready',
                cafeId: matchingOrder.cafeId ?? alert.cafeId ?? (cafeId ? Number(cafeId) : undefined),
                table: matchingOrder.table ?? alert.table ?? '-',
              };
            })
            .filter(Boolean)
        : [];

      const normalizedHelpAlerts = Array.isArray(helpAlerts)
        ? helpAlerts.filter((alert) => {
            if (alert?.recipientRole !== 'waiter') return false;
            if (String(alert?.cafeId ?? '') !== String(cafeId ?? '')) return false;
            if (alert?.targetStaffId != null && waiterId != null) {
              return Number(alert.targetStaffId) === Number(waiterId);
            }
            return true;
          })
        : [];

      const list = [...normalizedLegacyAlerts, ...normalizedHelpAlerts]
        .sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));
      setAlerts(list);

      if (list.length > 0) {
        const latest = list[0];
        if (!lastNotifId || latest.id !== lastNotifId) {
          setLastNotifId(latest.id);
          setToast({
            id: latest.id,
            text: latest.type === 'customer_help'
              ? `Customer requested ${latest.recipientRole === 'waiter' ? 'waiter help' : 'help'} for Order #${latest.orderId}`
              : `Order #${latest.orderId} for Table ${latest.table} is Ready`,
          });
          setTimeout(() => setToast(null), 4000);
        }
      }
    } catch {
      setAlerts([]);
    }
  }, [cafeId, lastNotifId, orders, waiterId]);
  const saveMember = async () => {
    const nm = mName.trim();
    if (!nm) return;
    if (!editMember && !mPassword.trim()) return;

    const payload = {
      name: nm,
      email: mEmail.trim(),
      phone: mPhone.trim(),
      role: 'Waiter',
      gender: mGender.trim(),
      address: mAddress.trim(),
      qualifications: mQualification.trim(),
      password: mPassword.trim(),
    };

    const url = editMember
      ? `${API_BASE_URL}/api/staff/${editMember.id}`
      : `${API_BASE_URL}/api/staff/cafe/${cafeId}`;
    const method = editMember ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return;
    }

    await fetchWaiterTeam();
    setShowManage(false);
    setEditMember(null);
  };
  const deleteMember = async (id) => {
    await fetch(`${API_BASE_URL}/api/staff/${id}`, { method: 'DELETE' });
    await fetchWaiterTeam();
    setShowManage(false);
    setEditMember(null);
  };

  /* ==========================================================
     SYNC WITH KITCHEN ORDERS (POLLING)
     ========================================================== */
  useEffect(() => {
    if (!cafeId) {
      setCafeName(currentUser?.cafeName || '');
      return undefined;
    }

    let cancelled = false;
    fetch(`${API_BASE_URL}/api/cafe/${cafeId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) {
          setCafeName(data?.cafeName || currentUser?.cafeName || `Cafe #${cafeId}`);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCafeName(currentUser?.cafeName || `Cafe #${cafeId}`);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [cafeId, currentUser?.cafeName]);

  useEffect(() => {
    fetchWaiterTeam();
  }, [fetchWaiterTeam]);

  useEffect(() => {
    let cancelled = false;

    const fetchWaiterOrders = async () => {
      if (!cafeId) {
        if (!cancelled) setOrders([]);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/orders/cafe/${cafeId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch waiter orders');
        }

        const data = await response.json();
        if (!cancelled) {
          const latest = (Array.isArray(data) ? data : []).map(mapBackendOrder);
          setOrders(latest);
        }
      } catch (error) {
        console.error('Failed to fetch waiter orders:', error);
        if (!cancelled) {
          setOrders([]);
        }
      }
    };

    fetchWaiterOrders();
    const interval = setInterval(fetchWaiterOrders, 4000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [cafeId, mapBackendOrder]);

  useEffect(() => {
    loadWaiterAlerts();
    const handleAlertsChanged = () => loadWaiterAlerts();
    window.addEventListener('staffHelpAlertsChanged', handleAlertsChanged);
    return () => window.removeEventListener('staffHelpAlertsChanged', handleAlertsChanged);
  }, [orders, loadWaiterAlerts]);

  useEffect(() => {
    const syncCustomerPayments = () => {
      setCustomerPayments(readCustomerPaymentRecords());
    };

    syncCustomerPayments();
    window.addEventListener('customerPaymentRecordsChanged', syncCustomerPayments);
    window.addEventListener('storage', syncCustomerPayments);

    return () => {
      window.removeEventListener('customerPaymentRecordsChanged', syncCustomerPayments);
      window.removeEventListener('storage', syncCustomerPayments);
    };
  }, []);

  const availableOrders = orders.filter((order) =>
    ['Pending', 'Preparing', 'Ready'].includes(order.status) && !order.assignedWaiterId
  );
  const myOrders = orders.filter((order) =>
    ['Pending', 'Preparing', 'Ready'].includes(order.status) &&
    waiterId != null &&
    Number(order.assignedWaiterId) === Number(waiterId)
  );
  const completedOrders = orders.filter((order) =>
    order.status === 'Served' && waiterId != null && Number(order.assignedWaiterId) === waiterId
  );
  const paymentStatuses = customerPayments
    .map((payment) => {
      const matchingOrder = orders.find((order) => Number(order.id) === Number(payment.orderId));
      const resolvedCafeId = payment?.cafeId ?? matchingOrder?.cafeId ?? '';

      return {
        ...payment,
        cafeId: resolvedCafeId,
        table: matchingOrder?.table ?? '-',
        orderStatus: matchingOrder?.status || 'Pending',
      };
    })
    .filter((payment) => String(payment?.cafeId ?? '') === String(cafeId ?? ''))
    .sort((a, b) => Number(b?.paidAt || 0) - Number(a?.paidAt || 0));

  const formatOrderItems = useCallback((items) => {
    if (!Array.isArray(items) || items.length === 0) {
      return 'Order details unavailable';
    }

    return items
      .map((item) => {
        const itemName = typeof item === 'string' ? item : item?.name || 'Item';
        const quantity = typeof item === 'string' ? 1 : item?.quantity ?? 1;
        return `${itemName}${quantity > 1 ? ` x${quantity}` : ''}`;
      })
      .join(', ');
  }, []);

  const handleServe = async (orderId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status?status=Served`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Failed to mark order as served');
      }

      const updatedOrder = mapBackendOrder(await response.json());
      setOrders((prev) => prev.map((order) => (order.id === orderId ? updatedOrder : order)));

      try {
        const notifRaw = localStorage.getItem('waiter_notifications') || '[]';
        const notifs = JSON.parse(notifRaw);
        const next = Array.isArray(notifs) ? notifs.filter((notif) => notif.orderId !== orderId) : [];
        localStorage.setItem('waiter_notifications', JSON.stringify(next));
        loadWaiterAlerts();
      } catch {}
    } catch (error) {
      console.error('Failed to serve waiter order:', error);
    }
  };

  const handlePickOrder = async (orderId) => {
    if (!waiterId) {
      return;
    }

    try {
      const params = new URLSearchParams({
        status: 'Ready',
        assignedWaiterId: String(waiterId),
        assignedWaiterName: staffName,
      });

      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status?${params.toString()}`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Failed to pick order');
      }

      const updatedOrder = mapBackendOrder(await response.json());
      setOrders((prev) => prev.map((order) => (order.id === orderId ? updatedOrder : order)));
    } catch (error) {
      console.error('Failed to pick waiter order:', error);
    }
  };

  const seedDemoOrders = () => {
    try {
      const flag = localStorage.getItem('waiter_demo_seeded');
      if (flag) return;
      const now = Date.now();
      const demo = [
        { id: now - 30000, cafeId: cafeId ? Number(cafeId) : undefined, table: 2, items: ['Latte', 'Croissant'], status: 'Preparing', timestamp: now - (8 * 60 * 1000) },
        { id: now - 20000, cafeId: cafeId ? Number(cafeId) : undefined, table: 5, items: ['Espresso', 'Muffin'], status: 'Ready', timestamp: now - (5 * 60 * 1000) },
        { id: now - 10000, cafeId: cafeId ? Number(cafeId) : undefined, table: 1, items: ['Cappuccino'], status: 'New', timestamp: now - (2 * 60 * 1000) },
      ];
      saveKitchenOrders(demo, cafeId);
      localStorage.setItem('waiter_demo_seeded', '1');
    } catch {}
  };

  const handleSendOrder = () => {
    if (selectedTableId && Object.keys(selectedItems).length > 0) {
      const orderItems = Object.entries(selectedItems)
        .filter(([, quantity]) => quantity > 0)
        .map(([itemId, quantity]) => {
          const item = menu.find(m => m.id === itemId);
          return item ? { name: item.name, quantity, price: item.price } : null;
        })
        .filter(Boolean);

      if (orderItems.length > 0) {
        const newOrder = {
          id: Date.now(),
          items: orderItems,
          status: 'New',
          timestamp: Date.now(),
          table: selectedTableId,
          priority: 'medium'
        };

        setTables(prev =>
          prev.map((table) =>
            table.id === selectedTableId ? { ...table, currentOrder: newOrder } : table
          )
        );
        const existing = loadKitchenOrders();
        const payload = {
          id: newOrder.id,
          cafeId: cafeId ? Number(cafeId) : undefined,
          table: newOrder.table,
          items: newOrder.items.map(i => i.name),
          status: 'New',
          timestamp: newOrder.timestamp,
          priority: 'medium'
        };
        saveKitchenOrders([...existing, payload], cafeId);
        setSelectedItems({});
      }
    }
  };

  useEffect(() => {
    const syncInterval = setInterval(() => {
      const kitchen = loadKitchenOrders(cafeId);
      setTables(prev =>
        prev.map(table => {
          if (!table.currentOrder) return table;
          const ko = kitchen.find(o => o.id === table.currentOrder.id);
          if (!ko) return table;
          if (table.currentOrder.status !== ko.status) {
            return { ...table, currentOrder: { ...table.currentOrder, status: ko.status } };
          }
          return table;
        })
      );
    }, 1000);
    return () => clearInterval(syncInterval);
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      setCafeId(resolveCafeId());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchSummary = async () => {
      if (!cafeId) {
        if (!cancelled) {
          setSummary(DEFAULT_SUMMARY);
          setSummaryError('Waiter cafe is not linked to this session yet. Please log in again.');
          setSummaryLoading(false);
        }
        return;
      }

      try {
        if (!cancelled) {
          setSummaryError('');
        }
        const response = await fetch(`${API_BASE_URL}/api/waiter/summary/${cafeId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch waiter summary');
        }
        const data = await response.json();
        if (!cancelled) {
          setSummary({
            ...DEFAULT_SUMMARY,
            ...data
          });
          setSummaryLoading(false);
        }
      } catch (error) {
        console.error('Waiter summary error:', error);
        if (!cancelled) {
          setSummaryError('Live summary is unavailable right now.');
          setSummaryLoading(false);
        }
      }
    };

    setSummaryLoading(true);
    fetchSummary();

    const intervalId = window.setInterval(fetchSummary, SUMMARY_REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [cafeId]);

  const waiterEndpoints = {
    base: '/api',
    summary: '/api/waiter/summary/:cafeId',
    orders: '/api/waiter/orders',
    serveOrder: '/api/waiter/orders/:id/serve',
    alerts: '/api/waiter/alerts',
    team: '/api/waiter/team',
    teamMemberById: '/api/waiter/team/:id'
  };

  const overviewSummary = useMemo(() => {
    const totalOrders = orders.length;
    const activeOrders = orders.filter((order) => ['Pending', 'Preparing', 'Ready'].includes(order.status)).length;
    const readyOrders = orders.filter((order) => order.status === 'Ready').length;
    const servedOrders = orders.filter((order) => order.status === 'Served').length;
    const totalTables = tables.length;
    const totalReservations = tables.filter((table) => table.status === 'Reserved').length;
    const pendingReservations = totalReservations;
    const totalWaiters = teamMembers.length;

    return {
      totalOrders,
      activeOrders,
      readyOrders,
      servedOrders,
      totalTables,
      totalReservations,
      pendingReservations,
      totalWaiters
    };
  }, [orders, tables, teamMembers]);

  const renderWaiterOrderCards = (list, actionLabel, actionHandler, emptyText) => {
    if (list.length === 0) {
      return <p>{emptyText}</p>;
    }

    return (
      <div className="waiter-order-grid">
        {list.map((order) => {
          const firstItem = (order.items || [])[0];
          const firstName = firstItem ? (typeof firstItem === 'string' ? firstItem : firstItem.name) : 'Order';
          const img = itemImageMap[firstName] || FOOD_PLACEHOLDER_IMAGE;

          return (
            <article key={`card-${order.id}`} className="waiter-order-card">
              <div className="waiter-order-card-top">
                <img className="waiter-order-card-thumb" src={img} alt={firstName} />
                <div>
                  <h5>Order #{order.id}</h5>
                <p>{formatOrderTableLabel(order.table)}</p>
                </div>
              </div>
              <div className="waiter-order-card-body">
                <p><strong>Items:</strong> {formatOrderItems(order.items)}</p>
                <p><strong>Total Items:</strong> {(order.items || []).reduce((sum, item) => sum + Number(item?.quantity ?? 1), 0)}</p>
                <p><strong>Status:</strong> {order.status}</p>
                <p><strong>Placed:</strong> {new Date(order.timestamp).toLocaleTimeString()}</p>
                {order.assignedWaiterName && <p><strong>Picked By:</strong> {order.assignedWaiterName}</p>}
              </div>
              <div className="waiter-order-card-actions">
                <button className="serve-order-button" onClick={() => actionHandler(order.id)}>
                  {actionLabel}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className="waiter-layout"
      style={{
        paddingLeft: '250px',
        backgroundImage:
          'url(\"https://static.vecteezy.com/system/resources/previews/023/010/450/non_2x/the-cup-of-latte-coffee-with-heart-shaped-latte-art-and-ai-generated-free-photo.jpg\")',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="waiter-sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="waiter-topbar" />
        <h2 style={{ margin: '8px 0 12px 2px', color: '#fff' }}>☕ Waiter Panel</h2>
        <div className="waiter-user-card">
          <p className="waiter-user-label">Logged In Staff</p>
          <h3>{staffName}</h3>
          <span>{cafeName || (cafeId ? `Cafe #${cafeId}` : 'Cafe not linked')}</span>
        </div>
        <div className="waiter-nav" style={{ gap: '0.6rem' }}>
          <button className={`waiter-nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => handleSidebarTabChange('orders')}>
            <span className="waiter-nav-icon">🍽</span>
            <span>Orders</span>
          </button>
          <button className={`waiter-nav-item ${activeTab === 'my_orders' ? 'active' : ''}`} onClick={() => handleSidebarTabChange('my_orders')}>
            <span className="waiter-nav-icon">ðŸ“‹</span>
            <span>My Orders</span>
          </button>
          <button className={`waiter-nav-item ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => handleSidebarTabChange('completed')}>
            <span className="waiter-nav-icon">✅</span>
            <span>Completed</span>
          </button>
          <button className={`waiter-nav-item ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => handleSidebarTabChange('payments')}>
            <span className="waiter-nav-icon">💳</span>
            <span>Payments</span>
          </button>
          <button className={`waiter-nav-item ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => handleSidebarTabChange('alerts')}>
            <span className="waiter-nav-icon">🔔</span>
            <span>Alerts</span>
            {alerts.length > 0 && <span className="nav-badge">{alerts.length}</span>}
          </button>
          <button className={`waiter-nav-item ${activeTab === 'events' ? 'active' : ''}`} onClick={() => handleSidebarTabChange('events')}>
            <span className="waiter-nav-icon">ðŸŽ‰</span>
            <span>Events</span>
          </button>
          <button className={`waiter-nav-item ${activeTab === 'team' ? 'active' : ''}`} onClick={() => handleSidebarTabChange('team')}>
            <span className="waiter-nav-icon">👥</span>
            <span>Team</span>
          </button>
          <button
            className="waiter-nav-item"
            onClick={() => {
              clearActiveSession();
              window.location.href='/login';
            }}
          >
            <span className="waiter-nav-icon">↩</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
      <div className="waiter-content" data-endpoints={JSON.stringify(waiterEndpoints)}>
        {toast && (
          <div className="toast-ready" onClick={() => { setActiveTab('my_orders'); setToast(null); }}>
            <span>{toast.text}</span>
            <button className="toast-action">View</button>
          </div>
        )}
        {requestNotice && (
          <div className="toast-ready" onClick={() => { setActiveTab('alerts'); setRequestNotice(''); }}>
            <span>{requestNotice}</span>
            <button className="toast-action">View</button>
          </div>
        )}
        <div className="waiter-dashboard">
          <section className="waiter-summary-section">
            <div className="waiter-summary-header">
              <div>
                <h4>Live Shift Overview</h4>
                <p>{overviewSummary.readyOrders} ready to serve, {overviewSummary.activeOrders} active orders, {overviewSummary.totalTables} tables in view.</p>
              </div>
              {cafeId && <span className="waiter-summary-cafe">Cafe #{cafeId}</span>}
            </div>
            {summaryError && <p className="waiter-summary-error">{summaryError}</p>}
            <div className="waiter-summary-grid">
              <div className="waiter-summary-card">
                <span className="waiter-summary-label">Total Orders</span>
                <strong>{overviewSummary.totalOrders}</strong>
              </div>
              <div className="waiter-summary-card">
                <span className="waiter-summary-label">Active Orders</span>
                <strong>{overviewSummary.activeOrders}</strong>
              </div>
              <div className="waiter-summary-card">
                <span className="waiter-summary-label">Ready To Serve</span>
                <strong>{overviewSummary.readyOrders}</strong>
              </div>
              <div className="waiter-summary-card">
                <span className="waiter-summary-label">Served Orders</span>
                <strong>{overviewSummary.servedOrders}</strong>
              </div>
              <div className="waiter-summary-card">
                <span className="waiter-summary-label">Tables</span>
                <strong>{overviewSummary.totalTables}</strong>
              </div>
              <div className="waiter-summary-card">
                <span className="waiter-summary-label">Reservations</span>
                <strong>{overviewSummary.totalReservations}</strong>
              </div>
              <div className="waiter-summary-card">
                <span className="waiter-summary-label">Pending Reservations</span>
                <strong>{overviewSummary.pendingReservations}</strong>
              </div>
              <div className="waiter-summary-card">
                <span className="waiter-summary-label">Waiter Team</span>
                <strong>{overviewSummary.totalWaiters}</strong>
              </div>
            </div>
          </section>
          {activeTab === 'orders' && (
            <div className="order-queue-section" id="waiter-tab-orders">
              <h4>Orders</h4>
              <p className="waiter-section-copy">Review ready orders and pick the ones you want to serve.</p>
              {availableOrders.length === 0 ? (
                <p>No ready orders are waiting to be picked.</p>
              ) : (
                <div className="orders-section">
                  <table className="order-table">
                    <thead>
                      <tr>
                        <th>Preview</th>
                        <th>Order</th>
                        <th>Table</th>
                        <th>Details</th>
                        <th>Total Items</th>
                        <th>Status</th>
                        <th>Placed</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableOrders.map((order) => {
                        const firstItem = (order.items || [])[0];
                        const firstName = firstItem ? (typeof firstItem === 'string' ? firstItem : firstItem.name) : 'Order';
                          const img = itemImageMap[firstName] || FOOD_PLACEHOLDER_IMAGE;
                        return (
                          <tr key={`row-${order.id}`}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <img className="order-thumb" src={img} alt={firstName} />
                                <span className="team-name">{firstName}</span>
                              </div>
                            </td>
                            <td>#{order.id}</td>
                            <td>{order.table}</td>
                            <td>{formatOrderItems(order.items)}</td>
                            <td>{(order.items || []).reduce((sum, item) => sum + Number(item?.quantity ?? 1), 0)}</td>
                            <td>{order.status}</td>
                            <td>{new Date(order.timestamp).toLocaleTimeString()}</td>
                            <td>
                              {order.status === 'Ready' ? (
                                <button className="serve-order-button" onClick={() => handlePickOrder(order.id)}>Pick</button>
                              ) : (
                                <span style={{ color: '#6f4e37' }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {activeTab === 'my_orders' && (
            <div className="order-queue-section" id="waiter-tab-my_orders">
              <h4>My Orders</h4>
              <p className="waiter-section-copy">Orders picked by you appear here until you serve them.</p>
              {myOrders.length === 0 ? (
                <p>You have not picked any orders yet.</p>
              ) : (
                <div className="orders-section">
                  <table className="order-table">
                    <thead>
                      <tr>
                        <th>Preview</th>
                        <th>Order</th>
                        <th>Table</th>
                        <th>Details</th>
                        <th>Total Items</th>
                        <th>Status</th>
                        <th>Picked By</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myOrders.map((order) => {
                        const firstItem = (order.items || [])[0];
                        const firstName = firstItem ? (typeof firstItem === 'string' ? firstItem : firstItem.name) : 'Order';
                        const img = itemImageMap[firstName] || FOOD_PLACEHOLDER_IMAGE;
                        return (
                          <tr key={`my-row-${order.id}`}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <img className="order-thumb" src={img} alt={firstName} />
                                <span className="team-name">{firstName}</span>
                              </div>
                            </td>
                            <td>#{order.id}</td>
                            <td>{order.table}</td>
                            <td>{formatOrderItems(order.items)}</td>
                            <td>{(order.items || []).reduce((sum, item) => sum + Number(item?.quantity ?? 1), 0)}</td>
                            <td>{order.status}</td>
                            <td>{order.assignedWaiterName || staffName}</td>
                            <td>
                              <button className="serve-order-button" onClick={() => handleServe(order.id)}>Served</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {activeTab === 'completed' && (
            <div className="order-queue-section" id="waiter-tab-completed">
              <h4>Completed</h4>
              <p className="waiter-section-copy">Orders already served by you are tracked here.</p>
              {completedOrders.length === 0 ? (
                <p>No completed orders yet.</p>
              ) : (
                <div className="orders-section">
                  <table className="order-table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Table</th>
                        <th>Details</th>
                        <th>Status</th>
                        <th>Served By</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedOrders.map((order) => (
                        <tr key={`completed-row-${order.id}`}>
                          <td>#{order.id}</td>
                          <td>{order.table}</td>
                          <td>{formatOrderItems(order.items)}</td>
                          <td>{order.status}</td>
                          <td>{order.assignedWaiterName || staffName}</td>
                          <td>{new Date(order.timestamp).toLocaleTimeString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {activeTab === 'payments' && (
            <div className="order-queue-section" id="waiter-tab-payments">
              <h4>Payments</h4>
              {paymentStatuses.length === 0 ? (
                <p>No customer payments found yet.</p>
              ) : (
                <div className="recipe-list">
                  {paymentStatuses.map((payment) => { const o = { id: payment.orderId, table: payment.table }; return (
                    <div key={payment.id} className="recipe-card">
                      <h5>Order #{o.id} - {formatOrderTableLabel(o.table)}</h5>
                      <p>Customer: {payment.customerName || 'Customer'}</p>
                      <p>Payment Method: {payment.paymentMethod || 'Razorpay'}</p>
                      <p>Amount: Rs. {Number(payment.amount || 0).toFixed(2)}</p>
                      <p>Payment Status: {payment.paymentStatus || 'Paid'}</p>
                      <p>Order Status: {payment.orderStatus}</p>
                      <p>Paid At: {payment.paidAt ? new Date(payment.paidAt).toLocaleString() : '-'}</p>
                    </div>
                  ); })}
                </div>
              )}
            </div>
          )}
          {activeTab === 'alerts' && (
            <div className="order-queue-section" id="waiter-tab-alerts">
              <h4>Alerts</h4>
              {alerts.length === 0 ? (
                <p>No alerts.</p>
              ) : (
                <div className="recipe-list">
                  {alerts.map(a => (
                    <div key={a.id} className="recipe-card">
                      <h5>{a.type === 'customer_help' ? 'Customer Help Request' : a.type === 'order_ready' ? 'Order Ready' : 'Notification'}</h5>
                      <p>Order #{a.orderId} - {formatOrderTableLabel(formatOrderTable(a.table))}</p>
                      {a.customerName && <p>Customer: {a.customerName}</p>}
                      {a.message && <p>{a.message}</p>}
                      <p>Time: {new Date(a.timestamp).toLocaleTimeString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === 'events' && (
            <div className="order-queue-section" id="waiter-tab-events">
              <h4>Event Checklist</h4>
              <p className="waiter-section-copy">Approved event bookings up to today appear here with their preparation checklist.</p>
              {todayEventBookings.length === 0 ? (
                <p>No approved event bookings for today.</p>
              ) : (
                <div className="recipe-list">
                  {todayEventBookings.map((booking) => {
                    const checklist = buildEventPreparationChecklist(booking);
                    return (
                      <div key={booking.id} className="recipe-card">
                        <h5>{booking.eventTitle}</h5>
                        <p>Customer: {booking.customerName}</p>
                        <p>Type: {booking.requestedEventType === 'Custom Event' ? booking.customEventType || 'Custom Event' : booking.requestedEventType}</p>
                        <p>Time: {booking.bookingTime || '-'}</p>
                        <p>Guests: {booking.guestCount || 0}</p>
                        <p>Tables: {Array.isArray(booking.tableLabels) && booking.tableLabels.length > 0 ? booking.tableLabels.join(', ') : '-'}</p>
                        <p>Advance: Rs. {Number(booking.advanceAmount || 0).toFixed(2)}</p>
                        <p>Quoted Price: Rs. {Number(booking.quotedPrice ?? booking.totalAmount ?? 0).toFixed(2)}</p>
                        {checklist.length > 0 ? (
                          <ul>
                            {checklist.map((item, index) => (
                              <li key={`${booking.id}-event-check-${index}`}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>No checklist items added.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {activeTab === 'team' && (
            <div className="order-queue-section" id="waiter-tab-team">
              <div className="team-header">
                <h4>Team</h4>
                <button className="view-btn" onClick={() => openManage(null)}>Add Member</button>
              </div>
              <div className="team-section">
                <table className="team-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Qualification</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamLoading && (
                      <tr>
                        <td colSpan="5">Loading waiters...</td>
                      </tr>
                    )}
                    {!teamLoading && teamMembers.length === 0 && (
                      <tr>
                        <td colSpan="5">No waiters found for this cafe.</td>
                      </tr>
                    )}
                    {!teamLoading && teamMembers.map((m, idx) => (
                      <tr key={`${m.name}-${idx}`}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <img className="team-avatar" src={PHOTO_PLACEHOLDER_IMAGE} alt={m.name} />
                            <span className="team-name">{m.name}</span>
                          </div>
                        </td>
                        <td>{m.email}</td>
                        <td>{m.phone}</td>
                        <td>{m.qualifications || '-'}</td>
                        <td>
                          <button className="view-btn" onClick={() => openManage(m)}>Manage</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {showManage && (
            <div className="team-modal-overlay" onClick={() => { setShowManage(false); setEditMember(null); }}>
              <div className="team-modal" onClick={(e) => e.stopPropagation()}>
                <h4 style={{ marginTop: 0 }}>{editMember ? 'Manage Team Member' : 'Add Team Member'}</h4>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Name</label>
                    <input type="text" value={mName} onChange={(e) => setMName(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Email</label>
                    <input type="text" value={mEmail} onChange={(e) => setMEmail(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Phone</label>
                    <input type="text" value={mPhone} onChange={(e) => setMPhone(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Gender</label>
                    <input type="text" value={mGender} onChange={(e) => setMGender(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Address</label>
                    <input type="text" value={mAddress} onChange={(e) => setMAddress(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Qualification</label>
                    <input type="text" value={mQualification} onChange={(e) => setMQualification(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>{editMember ? 'Password (leave blank to keep current)' : 'Password'}</label>
                    <input type="password" value={mPassword} onChange={(e) => setMPassword(e.target.value)} />
                  </div>
                </div>
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button className="view-btn" onClick={saveMember}>Save</button>
                  <button className="view-btn" onClick={() => { setShowManage(false); setEditMember(null); }}>Cancel</button>
                  {editMember && <button className="view-btn" onClick={() => deleteMember(editMember.id)}>Delete</button>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaiterDashboard;







// import React, { useState, useEffect } from 'react';
// import './WaiterDashboard.css';

// const WaiterDashboard = () => {
//   const [tables, setTables] = useState([
//     { id: 1, status: 'Empty', capacity: 4, x: 50, y: 50, shape: 'square' },
//     { id: 2, status: 'Occupied', capacity: 2, customer: 'Alice', seatingTime: Date.now() - (60 * 60 * 1000), currentOrder: { id: 101, items: [{ name: 'Latte', quantity: 1, price: 4.00 }, { name: 'Croissant', quantity: 1, price: 3.50 }], status: 'Preparing' }, x: 200, y: 50, shape: 'circle' },
//     { id: 3, status: 'Reserved', capacity: 6, customer: 'Bob', reservationTime: '12:00 PM', x: 350, y: 50, shape: 'rectangle' },
//     { id: 4, status: 'Empty', capacity: 4, x: 50, y: 200, shape: 'square' },
//     { id: 5, status: 'Occupied', capacity: 3, customer: 'Charlie', seatingTime: Date.now() - (30 * 60 * 1000), currentOrder: { id: 102, items: [{ name: 'Espresso', quantity: 1, price: 2.50 }, { name: 'Muffin', quantity: 1, price: 3.00 }], status: 'Ready' }, x: 200, y: 200, shape: 'circle' },
//     { id: 6, status: 'Empty', capacity: 2, x: 350, y: 200, shape: 'square' },
//     { id: 7, status: 'Occupied', capacity: 4, customer: 'David', seatingTime: Date.now() - (15 * 60 * 1000), currentOrder: { id: 103, items: [{ name: 'Cappuccino', quantity: 2, price: 4.00 }], status: 'Served' }, x: 500, y: 125, shape: 'rectangle' },
//   ]);
//   const [selectedTableId, setSelectedTableId] = useState(null);
//   const [customerName, setCustomerName] = useState('');
//   const [menu, setMenu] = useState([
//     { id: 'm1', name: 'Espresso', price: 2.50, category: 'Coffee' },
//     { id: 'm2', name: 'Latte', price: 4.00, category: 'Coffee' },
//     { id: 'm3', name: 'Cappuccino', price: 4.00, category: 'Coffee' },
//     { id: 'm4', name: 'Americano', price: 3.00, category: 'Coffee' },
//     { id: 'm5', name: 'Croissant', price: 3.50, category: 'Pastry' },
//     { id: 'm6', name: 'Muffin', price: 3.00, category: 'Pastry' },
//     { id: 'm7', name: 'Orange Juice', price: 3.00, category: 'Beverage' },
//     { id: 'm8', name: 'Still Water', price: 2.00, category: 'Beverage' },
//   ]);
//   const [selectedItems, setSelectedItems] = useState({}); // {itemId: quantity}
//   const [showPaymentForm, setShowPaymentForm] = useState(false);
//   const [paymentTableId, setPaymentTableId] = useState(null);
//   const [amountReceived, setAmountReceived] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState('Cash');
//   const [customerRequests, setCustomerRequests] = useState([]);
//   const [showRequestManagement, setShowRequestManagement] = useState(false);
//   const [selectedTable, setSelectedTable] = useState(null);
//   const [requestFilterStatus, setRequestFilterStatus] = useState('All');
//   const [filteredRequests, setFilteredRequests] = useState([]);

//   useEffect(() => {
//     const requestsForSelectedTable = customerRequests.filter(req => req.tableId === selectedTable);
//     if (requestFilterStatus === 'All') {
//       setFilteredRequests(requestsForSelectedTable);
//     } else {
//       setFilteredRequests(requestsForSelectedTable.filter(req => req.status === requestFilterStatus));
//     }
//   }, [customerRequests, selectedTable, requestFilterStatus]);

//   // Function to simulate a customer making a request
//   const handleAddRequest = (tableId, requestType) => {
//     const newRequest = {
//       id: customerRequests.length + 1,
//       tableId,
//       requestType,
//       status: 'Pending',
//       timestamp: Date.now(),
//     };
//     setCustomerRequests((prevRequests) => [...prevRequests, newRequest]);
//     alert(`New request from Table ${tableId}: ${requestType}`);
//   };

//   // Function to update the status of a customer request
//   const handleUpdateRequestStatus = (requestId, newStatus) => {
//     setCustomerRequests((prevRequests) =>
//       prevRequests.map((req) =>
//         req.id === requestId ? { ...req, status: newStatus } : req
//       )
//     );
//   };

//   // Simulate incoming requests for demonstration
//   useEffect(() => {
//     const interval = setInterval(() => {
//       const randomTableId = Math.floor(Math.random() * tables.length) + 1;
//       const requestTypes = ['Water', 'Bill', 'Assistance', 'Order'];
//       const randomRequestType = requestTypes[Math.floor(Math.random() * requestTypes.length)];
//       if (Math.random() < 0.3) { // 30% chance to add a new request
//         handleAddRequest(randomTableId, randomRequestType);
//       }
//     }, 30000); // Every 30 seconds

//     return () => clearInterval(interval);
//   }, [tables, handleAddRequest]);

//   const handleAssignCustomer = (e) => {
//     e.preventDefault();
//     if (selectedTableId && customerName) {
//       setTables(tables.map((table) =>
//         table.id === selectedTableId
//           ? { ...table, status: 'Occupied', customer: customerName, seatingTime: Date.now(), currentOrder: null } // No order initially
//           : table
//       ));
//       // Keep selectedTableId for immediate order taking
//       setCustomerName('');
//       setSelectedItems({}); // Clear selected items for the new customer
//     }
//   };

//   const handleClearTable = (id) => {
//     setTables(tables.map((table) =>
//       table.id === id
//         ? { ...table, status: 'Empty', customer: undefined, seatingTime: undefined, currentOrder: undefined }
//         : table
//     ));
//   };

//   const handleServeOrder = (tableId) => {
//     setTables(tables.map((table) =>
//       table.id === tableId
//         ? { ...table, currentOrder: { ...table.currentOrder, status: 'Served' } } // Mark as served, but keep order for payment
//         : table
//     ));
//   };

//   const handleProcessPayment = (e) => {
//     e.preventDefault();
//     if (paymentTableId && amountReceived) {
//       const tableToPay = tables.find(table => table.id === paymentTableId);
//       if (tableToPay && tableToPay.currentOrder) {
//         const totalAmount = tableToPay.currentOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
//         if (parseFloat(amountReceived) >= totalAmount) {
//           alert(`Payment of $${amountReceived} received for Table ${paymentTableId} via ${paymentMethod}. Change: $${(parseFloat(amountReceived) - totalAmount).toFixed(2)}`);
//           setTables(tables.map((table) =>
//             table.id === paymentTableId
//               ? { ...table, status: 'Empty', customer: undefined, seatingTime: undefined, currentOrder: undefined }
//               : table
//           ));
//           setShowPaymentForm(false);
//           setPaymentTableId(null);
//           setAmountReceived('');
//           setPaymentMethod('Cash');
//         } else {
//           alert(`Amount received ($${amountReceived}) is less than total amount ($${totalAmount.toFixed(2)}).`);
//         }
//       }
//     }
//   };

//   const handleInitiatePayment = (tableId) => {
//     setPaymentTableId(tableId);
//     setShowPaymentForm(true);
//     const tableToPay = tables.find(table => table.id === tableId);
//     if (tableToPay && tableToPay.currentOrder) {
//       const totalAmount = tableToPay.currentOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
//       setAmountReceived(totalAmount.toFixed(2)); // Pre-fill with total amount
//     }
//   };

//   const handleSelectTable = (id) => {
//     setSelectedTableId(id);
//     setCustomerName('');
//     setSelectedItems({}); // Clear selected items when a new table is selected
//   };

//   const handleQuantityChange = (itemId, change) => {
//     setSelectedItems((prevSelectedItems) => {
//       const newQuantity = (prevSelectedItems[itemId] || 0) + change;
//       if (newQuantity < 0) return prevSelectedItems; // Quantity cannot be negative
//       if (newQuantity === 0) {
//         const newItems = { ...prevSelectedItems };
//         delete newItems[itemId];
//         return newItems;
//       }
//       return {
//         ...prevSelectedItems,
//         [itemId]: newQuantity,
//       };
//     });
//   };

//   const formatSeatingTime = (timestamp) => {
//     const now = Date.now();
//     const elapsed = now - timestamp; // milliseconds
//     const minutes = Math.floor(elapsed / (1000 * 60));
//     const hours = Math.floor(minutes / 60);
//     const remainingMinutes = minutes % 60;

//     if (hours > 0) {
//       return `${hours}h ${remainingMinutes}m`;
//     } else {
//       return `${remainingMinutes}m`;
//     }
//   };

//   const handleSendOrder = () => {
//     if (selectedTableId && Object.keys(selectedItems).length > 0) {
//       const orderItems = Object.entries(selectedItems)
//         .filter(([, quantity]) => quantity > 0)
//         .map(([itemId, quantity]) => {
//           const item = menu.find(m => m.id === itemId);
//           return item ? { name: item.name, quantity, price: item.price } : null;
//         })
//         .filter(Boolean);

//       if (orderItems.length > 0) {
//         const newOrder = {
//           id: Date.now(), // Simple unique ID
//           items: orderItems,
//           status: 'Pending', // Initial status
//           timestamp: Date.now(),
//         };

//         setTables(tables.map((table) =>
//           table.id === selectedTableId
//             ? { ...table, currentOrder: newOrder }
//             : table
//         ));
//         setSelectedItems({});
//         // Keep selectedTableId for now, so waiter can continue taking orders or assign another customer
//       }
//     }
//   };

//   // Simulate kitchen processing
//   useEffect(() => {
//     const kitchenInterval = setInterval(() => {
//       setTables((prevTables) =>
//         prevTables.map((table) => {
//           if (table.currentOrder) {
//             const orderAge = (Date.now() - table.currentOrder.timestamp) / 1000; // in seconds
//             let newStatus = table.currentOrder.status;

//             if (newStatus === 'Pending' && orderAge > 5) { // After 5 seconds, start preparing
//               newStatus = 'Preparing';
//             } else if (newStatus === 'Preparing' && orderAge > 15) { // After 15 seconds, order is ready
//               newStatus = 'Ready';
//             }

//             if (newStatus !== table.currentOrder.status) {
//               return {
//                 ...table,
//                 currentOrder: { ...table.currentOrder, status: newStatus },
//               };
//             }
//           }
//           return table;
//         })
//       );
//     }, 2000); // Check every 2 seconds

//     return () => clearInterval(kitchenInterval);
//   }, []);

//   return (
//     <div className="waiter-dashboard">
//       <h3>Waiter Dashboard</h3>
//       <p>Welcome, Waiter! Manage tables, deliver orders, and complete payments efficiently.</p>

//       <div className="table-management-section">
//         <h4>Table Status</h4>
//         <div className="floor-plan-container">
//           {tables.map((table) => (
//             <div
//               key={table.id}
//               className={`table-card ${table.status.toLowerCase()} ${table.shape}`}
//               style={{ left: table.x, top: table.y }}
//               onClick={() => handleSelectTable(table.id)}
//             >
//               <h5>Table {table.id}</h5>
//               <p>Capacity: {table.capacity}</p>
//               <p>Status: {table.status}</p>
//               {table.status === 'Occupied' && (
//               <>
//                 <p>Customer: {table.customer}</p>
//                 <p>Seated: {formatSeatingTime(table.seatingTime)} ago</p>
//                 {customerRequests.filter(req => req.tableId === table.id && req.status === 'Pending').length > 0 && (
//                   <div className="request-indicator">
//                     <span>🔔 {customerRequests.filter(req => req.tableId === table.id && req.status === 'Pending').length} New Request(s)</span>
//                   </div>
//                 )}
//                 {table.currentOrder && (
//                   <div className={`current-order-details order-status-${table.currentOrder.status.toLowerCase()}`}>
//                     <h5>Current Order:</h5>
//                     <ul>
//                       {table.currentOrder.items.map((item, index) => (
//                         <li key={index}>{item.name} x {item.quantity}</li>
//                       ))}
//                     </ul>
//                     <p>Status: <strong>{table.currentOrder.status}</strong></p>
//                     {table.currentOrder.status === 'Ready' && (
//                       <button onClick={(e) => { e.stopPropagation(); handleServeOrder(table.id); }} className="serve-order-button">Mark as Served</button>
//                     )}
//                     {table.currentOrder.status === 'Served' && (
//                       <button onClick={(e) => { e.stopPropagation(); handleInitiatePayment(table.id); }} className="process-payment-button">Process Payment</button>
//                     )}
//                   </div>
//                 )}
//                 <button onClick={(e) => { e.stopPropagation(); handleClearTable(table.id); }} className="clear-table-button">Clear Table</button>
//                 <button onClick={(e) => { e.stopPropagation(); setSelectedTable(table.id); setShowRequestManagement(true); }} className="manage-requests-button">Manage Requests</button>
//               </>
//             )}
//               {table.status === 'Reserved' && (
//                 <>
//                   <p>Customer: {table.customer}</p>
//                   <p>Reservation: {table.reservationTime}</p>
//                 </>
//               )}
//               {table.status === 'Empty' && (
//                 <button onClick={(e) => { e.stopPropagation(); handleSelectTable(table.id); }} className="assign-customer-button">Assign Customer</button>
//               )}
//             </div>
//           ))}
//         </div>

//         {showPaymentForm && paymentTableId && (
//           <div className="payment-form-overlay">
//             <div className="payment-form-container">
//               <h4>Process Payment for Table {paymentTableId}</h4>
//               {tables.find(table => table.id === paymentTableId)?.currentOrder && (
//                 <div className="payment-order-summary">
//                   <h5>Order Details:</h5>
//                   <ul>
//                     {tables.find(table => table.id === paymentTableId).currentOrder.items.map((item, index) => (
//                       <li key={index}>{item.name} x {item.quantity} - ${(item.price * item.quantity).toFixed(2)}</li>
//                     ))}
//                   </ul>
//                   <p>Total: <strong>${tables.find(table => table.id === paymentTableId).currentOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</strong></p>
//                 </div>
//               )}
//               <form onSubmit={handleProcessPayment}>
//                 <label>
//                   Amount Received:
//                   <input
//                     type="number"
//                     step="0.01"
//                     value={amountReceived}
//                     onChange={(e) => setAmountReceived(e.target.value)}
//                     required
//                   />
//                 </label>
//                 <label>
//                   Payment Method:
//                   <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
//                     <option value="Cash">Cash</option>
//                     <option value="Card">Card</option>
//                     <option value="MobilePay">Mobile Pay</option>
//                   </select>
//                 </label>
//                 <div className="payment-form-actions">
//                   <button type="submit">Complete Payment</button>
//                   <button type="button" onClick={() => setShowPaymentForm(false)}>Cancel</button>
//                 </div>
//               </form>
//             </div>
//         </div>
//       )}

//       {showRequestManagement && (
//         <div className="request-management-overlay">
//           <div className="request-management-container">
//             <h3>Customer Requests for Table {selectedTable}</h3>
//             <button className="close-button" onClick={() => setShowRequestManagement(false)}>X</button>
//             <div className="request-filters">
//               <label htmlFor="request-status-filter">Filter by Status:</label>
//               <select
//                 id="request-status-filter"
//                 onChange={(e) => setRequestFilterStatus(e.target.value)}
//                 value={requestFilterStatus}
//               >
//                 <option value="All">All</option>
//                 <option value="Pending">Pending</option>
//                 <option value="In Progress">In Progress</option>
//                 <option value="Completed">Completed</option>
//               </select>
//             </div>
//             <div className="request-list">
//               {filteredRequests.length > 0 ? (
//                 filteredRequests.map((request) => (
//                   <div key={request.id} className={`request-item status-${request.status.toLowerCase().replace(' ', '-')}`}>
//                     <p><strong>Table {request.tableId}:</strong> {request.requestType}</p>
//                     <p>Status: {request.status}</p>
//                     <p className="request-time">Requested {formatSeatingTime(request.timestamp)} ago</p>
//                     <div className="request-actions">
//                       {request.status === 'Pending' && (
//                         <button onClick={() => handleUpdateRequestStatus(request.id, 'In Progress')}>Mark In Progress</button>
//                       )}
//                       {request.status === 'In Progress' && (
//                         <button onClick={() => handleUpdateRequestStatus(request.id, 'Completed')}>Mark Completed</button>
//                       )}
//                     </div>
//                   </div>
//                 ))
//               ) : (
//                 <p>No requests for this table.</p>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//         {selectedTableId && (
//           <div className="assign-customer-form">
//             <h4>Assign Customer to Table {selectedTableId}</h4>
//             <form onSubmit={handleAssignCustomer}>
//               <input
//                 type="text"
//                 placeholder="Customer Name"
//                 value={customerName}
//                 onChange={(e) => setCustomerName(e.target.value)}
//                 required
//               />
//               <button type="submit">Assign</button>
//               <button type="button" onClick={() => setSelectedTableId(null)}>Cancel</button>
//             </form>
//           </div>
//         )}

//         {selectedTableId && (
//           <div className="order-taking-section">
//             <h4>Take Order for Table {selectedTableId}</h4>
//             <div className="menu-selection">
//               {menu.map((item) => (
//                 <div key={item.id} className="menu-item-selection">
//                   <span>{item.name} - ${item.price.toFixed(2)}</span>
//                   <div className="item-quantity-controls">
//                     <button onClick={() => handleQuantityChange(item.id, -1)}>-</button>
//                     <span>{selectedItems[item.id] || 0}</span>
//                     <button onClick={() => handleQuantityChange(item.id, 1)}>+</button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//             <div className="current-order-summary">
//               <h5>Order Summary</h5>
//               {Object.keys(selectedItems).length === 0 ? (
//                 <p>No items selected.</p>
//               ) : (
//                 <ul>
//                   {Object.entries(selectedItems).map(([itemId, quantity]) => {
//                     const item = menu.find(m => m.id === itemId);
//                     return item && quantity > 0 ? (
//                       <li key={itemId}>{item.name} x {quantity}</li>
//                     ) : null;
//                   })}
//                 </ul>
//               )}
//               <button onClick={handleSendOrder} className="send-order-button">Send Order to Kitchen</button>
//               <button onClick={() => setSelectedTableId(null)} className="cancel-order-button">Cancel Order</button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default WaiterDashboard;






// import React, { useState, useEffect } from 'react';
// import './WaiterDashboard.css';
// import './OwnerDashboard.css';

// const WaiterDashboard = () => {
//   /* ==========================================================
//      LOCAL STORAGE & INITIAL STATE (TABLES & MENU)
//      ========================================================== */
//   const loadKitchenOrders = () => {
//     try {
//       const raw = localStorage.getItem('kitchen_orders') || '[]';
//       const arr = JSON.parse(raw);
//       return Array.isArray(arr) ? arr : [];
//     } catch {
//       return [];
//     }
//   };
//   const saveKitchenOrders = (arr) => {
//     try {
//       localStorage.setItem('kitchen_orders', JSON.stringify(arr));
//     } catch {}
//   };
//   const [tables, setTables] = useState([
//     { id: 1, status: 'Empty', capacity: 4, x: 50, y: 50, shape: 'square' },
//     { id: 2, status: 'Occupied', capacity: 2, customer: 'Alice', seatingTime: Date.now() - (60 * 60 * 1000), currentOrder: { id: 101, items: [{ name: 'Latte', quantity: 1, price: 4.00 }, { name: 'Croissant', quantity: 1, price: 3.50 }], status: 'Preparing' }, x: 200, y: 50, shape: 'circle' },
//     { id: 3, status: 'Reserved', capacity: 6, customer: 'Bob', reservationTime: '12:00 PM', x: 350, y: 50, shape: 'rectangle' },
//     { id: 4, status: 'Empty', capacity: 4, x: 50, y: 200, shape: 'square' },
//     { id: 5, status: 'Occupied', capacity: 3, customer: 'Charlie', seatingTime: Date.now() - (30 * 60 * 1000), currentOrder: { id: 102, items: [{ name: 'Espresso', quantity: 1, price: 2.50 }, { name: 'Muffin', quantity: 1, price: 3.00 }], status: 'Ready' }, x: 200, y: 200, shape: 'circle' },
//     { id: 6, status: 'Empty', capacity: 2, x: 350, y: 200, shape: 'square' },
//     { id: 7, status: 'Occupied', capacity: 4, customer: 'David', seatingTime: Date.now() - (15 * 60 * 1000), currentOrder: { id: 103, items: [{ name: 'Cappuccino', quantity: 2, price: 4.00 }], status: 'Served' }, x: 500, y: 125, shape: 'rectangle' },
//   ]);
//   const [selectedTableId, setSelectedTableId] = useState(null);
//   const [customerName, setCustomerName] = useState('');
//   const [menu, setMenu] = useState([
//     { id: 'm1', name: 'Espresso', price: 2.50, category: 'Coffee' },
//     { id: 'm2', name: 'Latte', price: 4.00, category: 'Coffee' },
//     { id: 'm3', name: 'Cappuccino', price: 4.00, category: 'Coffee' },
//     { id: 'm4', name: 'Americano', price: 3.00, category: 'Coffee' },
//     { id: 'm5', name: 'Croissant', price: 3.50, category: 'Pastry' },
//     { id: 'm6', name: 'Muffin', price: 3.00, category: 'Pastry' },
//     { id: 'm7', name: 'Orange Juice', price: 3.00, category: 'Beverage' },
//     { id: 'm8', name: 'Still Water', price: 2.00, category: 'Beverage' },
//   ]);
//   const [selectedItems, setSelectedItems] = useState({}); // {itemId: quantity}
//   const [showPaymentForm, setShowPaymentForm] = useState(false);
//   const [paymentTableId, setPaymentTableId] = useState(null);
//   const [amountReceived, setAmountReceived] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState('Cash');
//   /* ==========================================================
//      CUSTOMER REQUEST MANAGEMENT
//      ========================================================== */
//   const [customerRequests, setCustomerRequests] = useState([]);
//   const [showRequestManagement, setShowRequestManagement] = useState(false);
//   const [selectedTable, setSelectedTable] = useState(null);
//   const [requestFilterStatus, setRequestFilterStatus] = useState('All');
//   const [filteredRequests, setFilteredRequests] = useState([]);

//   useEffect(() => {
//     const requestsForSelectedTable = customerRequests.filter(req => req.tableId === selectedTable);
//     if (requestFilterStatus === 'All') {
//       setFilteredRequests(requestsForSelectedTable);
//     } else {
//       setFilteredRequests(requestsForSelectedTable.filter(req => req.status === requestFilterStatus));
//     }
//   }, [customerRequests, selectedTable, requestFilterStatus]);

//   // Function to simulate a customer making a request
//   const handleAddRequest = (tableId, requestType) => {
//     const newRequest = {
//       id: customerRequests.length + 1,
//       tableId,
//       requestType,
//       status: 'Pending',
//       timestamp: Date.now(),
//     };
//     setCustomerRequests((prevRequests) => [...prevRequests, newRequest]);
//     alert(`New request from Table ${tableId}: ${requestType}`);
//   };

//   // Function to update the status of a customer request
//   const handleUpdateRequestStatus = (requestId, newStatus) => {
//     setCustomerRequests((prevRequests) =>
//       prevRequests.map((req) =>
//         req.id === requestId ? { ...req, status: newStatus } : req
//       )
//     );
//   };

//   // Simulate incoming requests for demonstration
//   useEffect(() => {
//     const interval = setInterval(() => {
//       const randomTableId = Math.floor(Math.random() * tables.length) + 1;
//       const requestTypes = ['Water', 'Bill', 'Assistance', 'Order'];
//       const randomRequestType = requestTypes[Math.floor(Math.random() * requestTypes.length)];
//       if (Math.random() < 0.3) { // 30% chance to add a new request
//         handleAddRequest(randomTableId, randomRequestType);
//       }
//     }, 30000); // Every 30 seconds

//     return () => clearInterval(interval);
//   }, [tables, handleAddRequest]);

//   /* ==========================================================
//      TABLE & CUSTOMER ASSIGNMENT HANDLERS
//      ========================================================== */
//   const handleAssignCustomer = (e) => {
//     e.preventDefault();
//     if (selectedTableId && customerName) {
//       setTables(tables.map((table) =>
//         table.id === selectedTableId
//           ? { ...table, status: 'Occupied', customer: customerName, seatingTime: Date.now(), currentOrder: null } // No order initially
//           : table
//       ));
//       // Keep selectedTableId for immediate order taking
//       setCustomerName('');
//       setSelectedItems({}); // Clear selected items for the new customer
//     }
//   };

//   const handleClearTable = (id) => {
//     setTables(tables.map((table) =>
//       table.id === id
//         ? { ...table, status: 'Empty', customer: undefined, seatingTime: undefined, currentOrder: undefined }
//         : table
//     ));
//   };

//   const handleServeOrder = (tableId) => {
//     setTables(prev =>
//       prev.map((table) => {
//         if (table.id === tableId && table.currentOrder) {
//           const served = { ...table.currentOrder, status: 'Served' };
//           const orders = loadKitchenOrders();
//           const updated = orders.map(o => o.id === served.id ? { ...o, status: 'Served', timestamp: Date.now() } : o);
//           saveKitchenOrders(updated);
//           return { ...table, currentOrder: served };
//         }
//         return table;
//       })
//     );
//   };

//   const handleProcessPayment = (e) => {
//     e.preventDefault();
//     if (paymentTableId && amountReceived) {
//       const tableToPay = tables.find(table => table.id === paymentTableId);
//       if (tableToPay && tableToPay.currentOrder) {
//         const totalAmount = tableToPay.currentOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
//         if (parseFloat(amountReceived) >= totalAmount) {
//           alert(`Payment of $${amountReceived} received for Table ${paymentTableId} via ${paymentMethod}. Change: $${(parseFloat(amountReceived) - totalAmount).toFixed(2)}`);
//           setTables(tables.map((table) =>
//             table.id === paymentTableId
//               ? { ...table, status: 'Empty', customer: undefined, seatingTime: undefined, currentOrder: undefined }
//               : table
//           ));
//           setShowPaymentForm(false);
//           setPaymentTableId(null);
//           setAmountReceived('');
//           setPaymentMethod('Cash');
//         } else {
//           alert(`Amount received ($${amountReceived}) is less than total amount ($${totalAmount.toFixed(2)}).`);
//         }
//       }
//     }
//   };

//   const handleInitiatePayment = (tableId) => {
//     setPaymentTableId(tableId);
//     setShowPaymentForm(true);
//     const tableToPay = tables.find(table => table.id === tableId);
//     if (tableToPay && tableToPay.currentOrder) {
//       const totalAmount = tableToPay.currentOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
//       setAmountReceived(totalAmount.toFixed(2)); // Pre-fill with total amount
//     }
//   };

//   const handleSelectTable = (id) => {
//     setSelectedTableId(id);
//     setCustomerName('');
//     setSelectedItems({}); // Clear selected items when a new table is selected
//   };

//   /* ==========================================================
//      ORDER TAKING & QUANTITY HANDLERS
//      ========================================================== */
//   const handleQuantityChange = (itemId, change) => {
//     setSelectedItems((prevSelectedItems) => {
//       const newQuantity = (prevSelectedItems[itemId] || 0) + change;
//       if (newQuantity < 0) return prevSelectedItems; // Quantity cannot be negative
//       if (newQuantity === 0) {
//         const newItems = { ...prevSelectedItems };
//         delete newItems[itemId];
//         return newItems;
//       }
//       return {
//         ...prevSelectedItems,
//         [itemId]: newQuantity,
//       };
//     });
//   };

//   const formatSeatingTime = (timestamp) => {
//     const now = Date.now();
//     const elapsed = now - timestamp; // milliseconds
//     const minutes = Math.floor(elapsed / (1000 * 60));
//     const hours = Math.floor(minutes / 60);
//     const remainingMinutes = minutes % 60;

//     if (hours > 0) {
//       return `${hours}h ${remainingMinutes}m`;
//     } else {
//       return `${remainingMinutes}m`;
//     }
//   };

//   const scrollTo = (id) => {
//     try {
//       const el = document.getElementById(id);
//       if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
//     } catch {}
//   };
//   const [activeTab, setActiveTab] = useState('orders');
//   const [orders, setOrders] = useState(() => loadKitchenOrders());
//   const [orderFilter, setOrderFilter] = useState('all');
//   const [alerts, setAlerts] = useState([]);
//   const [toast, setToast] = useState(null);
//   const [lastNotifId, setLastNotifId] = useState(null);
//   const itemImageMap = {
//     'Espresso': 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=300&q=60',
//     'Latte': 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=300&q=60',
//     'Cappuccino': 'https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=300&q=60',
//     'Americano': 'https://images.unsplash.com/photo-1461988091159-192b6df7054f?auto=format&fit=crop&w=300&q=60',
//     'Croissant': 'https://images.unsplash.com/photo-1546263667-ccb7ee7dfa6a?auto=format&fit=crop&w=300&q=60',
//     'Muffin': 'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?auto=format&fit=crop&w=300&q=60',
//     'Orange Juice': 'https://images.unsplash.com/photo-1571078321249-cd7bcb9c05b0?auto=format&fit=crop&w=300&q=60',
//     'Still Water': 'https://images.unsplash.com/photo-1517940310602-115e9d6c3b8a?auto=format&fit=crop&w=300&q=60'
//   };
//   /* ==========================================================
//      WAITER TEAM MANAGEMENT STATE & HANDLERS
//      ========================================================== */
//   const [teamMembers, setTeamMembers] = useState(() => {
//     try {
//       const raw = localStorage.getItem('waiter_team') || '[]';
//       const arr = JSON.parse(raw);
//       if (Array.isArray(arr) && arr.length > 0) return arr;
//     } catch {}
//     return [
//       { id: 1, name: 'Rahul', email: 'rahul@email.com', phone: '9876543210', points: 20, shift: 'Morning', avatar: 'https://i.pravatar.cc/64?img=12' },
//       { id: 2, name: 'Priya', email: 'priya@email.com', phone: '9876543222', points: 18, shift: 'Evening', avatar: 'https://i.pravatar.cc/64?img=45' },
//       { id: 3, name: 'David', email: 'david@email.com', phone: '9876543333', points: 25, shift: 'Night', avatar: 'https://i.pravatar.cc/64?img=32' },
//       { id: 4, name: 'Anita', email: 'anita@email.com', phone: '9876500001', points: 15, shift: 'Morning', avatar: 'https://i.pravatar.cc/64?img=5' },
//       { id: 5, name: 'Rohan', email: 'rohan@email.com', phone: '9876500002', points: 22, shift: 'Evening', avatar: 'https://i.pravatar.cc/64?img=20' },
//       { id: 6, name: 'Sneha', email: 'sneha@email.com', phone: '9876500003', points: 16, shift: 'Night', avatar: 'https://i.pravatar.cc/64?img=10' },
//       { id: 7, name: 'Karan', email: 'karan@email.com', phone: '9876500004', points: 19, shift: 'Morning', avatar: 'https://i.pravatar.cc/64?img=60' },
//       { id: 8, name: 'Meera', email: 'meera@email.com', phone: '9876500005', points: 12, shift: 'Evening', avatar: 'https://i.pravatar.cc/64?img=8' }
//     ];
//   });
//   const [showManage, setShowManage] = useState(false);
//   const [editMember, setEditMember] = useState(null);
//   const [mName, setMName] = useState('');
//   const [mEmail, setMEmail] = useState('');
//   const [mPhone, setMPhone] = useState('');
//   const [mPoints, setMPoints] = useState('');
//   const [mShift, setMShift] = useState('Morning');
//   const [mAvatar, setMAvatar] = useState('');
//   const handleWaiterPhotoFile = (e) => {
//     const file = e.target.files && e.target.files[0];
//     if (!file) return;
//     const reader = new FileReader();
//     reader.onload = () => {
//       setMAvatar(String(reader.result || ''));
//     };
//     reader.readAsDataURL(file);
//   };
//   const saveTeam = (list) => {
//     setTeamMembers(list);
//     try { localStorage.setItem('waiter_team', JSON.stringify(list)); } catch {}
//   };
//   const openManage = (member) => {
//     setEditMember(member || null);
//     setMName(member ? member.name : '');
//     setMEmail(member ? member.email : '');
//     setMPhone(member ? member.phone : '');
//     setMPoints(member ? String(member.points || '') : '');
//     setMShift(member ? member.shift : 'Morning');
//     setMAvatar(member ? member.avatar || '' : '');
//     setShowManage(true);
//   };
//   const saveMember = () => {
//     const nm = mName.trim();
//     if (!nm) return;
//     const obj = { id: editMember ? editMember.id : Date.now(), name: nm, email: mEmail.trim(), phone: mPhone.trim(), points: Number(mPoints || 0), shift: mShift, avatar: mAvatar.trim() };
//     if (editMember) {
//       const next = teamMembers.map(t => t.id === editMember.id ? obj : t);
//       saveTeam(next);
//     } else {
//       saveTeam([obj, ...teamMembers]);
//     }
//     setShowManage(false);
//     setEditMember(null);
//   };
//   const deleteMember = (id) => {
//     saveTeam(teamMembers.filter(t => t.id !== id));
//     setShowManage(false);
//     setEditMember(null);
//   };

//   /* ==========================================================
//      SYNC WITH KITCHEN ORDERS (POLLING)
//      ========================================================== */
//   useEffect(() => {
//     const interval = setInterval(() => {
//       const raw = loadKitchenOrders();
//       if (raw.length === 0) seedDemoOrders();
//       const latest = raw.map(o => ({
//         ...o,
//         elapsedTime: Math.floor((Date.now() - o.timestamp) / 1000)
//       }));
//       setOrders(latest);
//     }, 1000);
//     return () => clearInterval(interval);
//   }, []);

//   useEffect(() => {
//     try {
//       const notifRaw = localStorage.getItem('waiter_notifications') || '[]';
//       const notifs = JSON.parse(notifRaw);
//       const list = Array.isArray(notifs) ? notifs.reverse() : [];
//       setAlerts(list);
//       if (list.length > 0) {
//         const latest = list[0];
//         if (!lastNotifId || latest.id !== lastNotifId) {
//           setLastNotifId(latest.id);
//           setToast({ id: latest.id, text: `Order #${latest.orderId} for Table ${latest.table} is Ready` });
//           setTimeout(() => setToast(null), 4000);
//         }
//       }
//     } catch {
//       setAlerts([]);
//     }
//   }, [orders, lastNotifId]);

//   const filteredOrders = orders.filter(o => {
//     if (orderFilter === 'all') return o.status === 'Ready';
//     if (orderFilter === 'completed') return o.status === 'Served';
//     return true;
//   });

//   const handleServe = (orderId) => {
//     const updated = loadKitchenOrders().map(o =>
//       o.id === orderId ? { ...o, status: 'Served', timestamp: Date.now() } : o
//     );
//     saveKitchenOrders(updated);
//     setOrders(updated.map(o => ({ ...o, elapsedTime: Math.floor((Date.now() - o.timestamp) / 1000) })));
//   };

//   const seedDemoOrders = () => {
//     try {
//       const flag = localStorage.getItem('waiter_demo_seeded');
//       if (flag) return;
//       const now = Date.now();
//       const demo = [
//         { id: now - 30000, table: 2, items: ['Latte', 'Croissant'], status: 'Preparing', timestamp: now - (8 * 60 * 1000) },
//         { id: now - 20000, table: 5, items: ['Espresso', 'Muffin'], status: 'Ready', timestamp: now - (5 * 60 * 1000) },
//         { id: now - 10000, table: 1, items: ['Cappuccino'], status: 'New', timestamp: now - (2 * 60 * 1000) },
//       ];
//       saveKitchenOrders(demo);
//       localStorage.setItem('waiter_demo_seeded', '1');
//     } catch {}
//   };

//   const handleSendOrder = () => {
//     if (selectedTableId && Object.keys(selectedItems).length > 0) {
//       const orderItems = Object.entries(selectedItems)
//         .filter(([, quantity]) => quantity > 0)
//         .map(([itemId, quantity]) => {
//           const item = menu.find(m => m.id === itemId);
//           return item ? { name: item.name, quantity, price: item.price } : null;
//         })
//         .filter(Boolean);

//       if (orderItems.length > 0) {
//         const newOrder = {
//           id: Date.now(),
//           items: orderItems,
//           status: 'New',
//           timestamp: Date.now(),
//           table: selectedTableId,
//           priority: 'medium'
//         };

//         setTables(prev =>
//           prev.map((table) =>
//             table.id === selectedTableId ? { ...table, currentOrder: newOrder } : table
//           )
//         );
//         const existing = loadKitchenOrders();
//         const payload = {
//           id: newOrder.id,
//           table: newOrder.table,
//           items: newOrder.items.map(i => i.name),
//           status: 'New',
//           timestamp: newOrder.timestamp,
//           priority: 'medium'
//         };
//         saveKitchenOrders([...existing, payload]);
//         setSelectedItems({});
//       }
//     }
//   };

//   useEffect(() => {
//     const syncInterval = setInterval(() => {
//       const kitchen = loadKitchenOrders();
//       setTables(prev =>
//         prev.map(table => {
//           if (!table.currentOrder) return table;
//           const ko = kitchen.find(o => o.id === table.currentOrder.id);
//           if (!ko) return table;
//           if (table.currentOrder.status !== ko.status) {
//             return { ...table, currentOrder: { ...table.currentOrder, status: ko.status } };
//           }
//           return table;
//         })
//       );
//     }, 1000);
//     return () => clearInterval(syncInterval);
//   }, []);

//   const waiterEndpoints = {
//     base: '/api',
//     orders: '/api/waiter/orders',
//     serveOrder: '/api/waiter/orders/:id/serve',
//     alerts: '/api/waiter/alerts',
//     team: '/api/waiter/team',
//     teamMemberById: '/api/waiter/team/:id'
//   };

//   return (
//     <div
//       className="owners-layout"
//       style={{
//         paddingLeft: '250px',
//         backgroundImage:
//           'url(\"https://static.vecteezy.com/system/resources/previews/023/010/450/non_2x/the-cup-of-latte-coffee-with-heart-shaped-latte-art-and-ai-generated-free-photo.jpg\")',
//         backgroundPosition: 'center',
//         backgroundSize: 'cover',
//         backgroundRepeat: 'no-repeat',
//         backgroundAttachment: 'fixed'
//       }}
//     >
//       <div className="owner-sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
//         <div className="owner-topbar" />
//         <h2 style={{ margin: '8px 0 12px 2px', color: '#fff' }}>☕ Waiter Panel</h2>
//         <div className="owner-nav" style={{ gap: '0.6rem' }}>
//           <button className={`nav-item ${activeTab === 'orders' && orderFilter === 'all' ? 'active' : ''}`} onClick={() => { setActiveTab('orders'); setOrderFilter('all'); }}>
//             <span className="nav-icon">🍽</span>
//             <span>Orders</span>
//           </button>
//           <button className={`nav-item ${activeTab === 'orders' && orderFilter === 'completed' ? 'active' : ''}`} onClick={() => { setActiveTab('orders'); setOrderFilter('completed'); }}>
//             <span className="nav-icon">✅</span>
//             <span>Completed</span>
//           </button>
//           <button className={`nav-item ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>
//             <span className="nav-icon">💳</span>
//             <span>Payments</span>
//           </button>
//           <button className={`nav-item ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveTab('alerts')}>
//             <span className="nav-icon">🔔</span>
//             <span>Alerts</span>
//             {alerts.length > 0 && <span className="nav-badge">{alerts.length}</span>}
//           </button>
//           <button className={`nav-item ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>
//             <span className="nav-icon">👥</span>
//             <span>Team</span>
//           </button>
//           <button
//             className="nav-item"
//             onClick={() => {
//               try { localStorage.removeItem('auth_token'); } catch {}
//               window.location.href='/login';
//             }}
//           >
//             <span className="nav-icon">↩</span>
//             <span>Logout</span>
//           </button>
//         </div>
//       </div>
//       <div className="owner-content" data-endpoints={JSON.stringify(waiterEndpoints)}>
//         {toast && (
//           <div className="toast-ready" onClick={() => { setActiveTab('orders'); setOrderFilter('completed'); setToast(null); }}>
//             <span>{toast.text}</span>
//             <button className="toast-action">View</button>
//           </div>
//         )}
//         <div className="waiter-dashboard">
//           {activeTab === 'orders' && (
//             <div className="order-queue-section">
//               <h4>Orders</h4>
//               {filteredOrders.length === 0 ? (
//                 <p>No orders right now.</p>
//               ) : (
//                 <div className="orders-section">
//                   <table className="order-table">
//                     <thead>
//                       <tr>
//                         <th>Item</th>
//                         <th>Order</th>
//                         <th>Table</th>
//                         <th>Items</th>
//                         <th>Status</th>
//                         <th>Placed</th>
//                         {orderFilter === 'completed' && <th>Served?</th>}
//                         <th>Actions</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {filteredOrders.map((order) => {
//                         const firstItem = (order.items || [])[0];
//                         const firstName = firstItem ? (typeof firstItem === 'string' ? firstItem : firstItem.name) : 'Order';
//                         const img = itemImageMap[firstName] || 'https://via.placeholder.com/64x64?text=Food';
//                         return (
//                           <tr key={`row-${order.id}`}>
//                             <td>
//                               <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                                 <img className="order-thumb" src={img} alt={firstName} />
//                                 <span className="team-name">{firstName}</span>
//                               </div>
//                             </td>
//                             <td>#{order.id}</td>
//                             <td>{order.table}</td>
//                             <td>{(order.items || []).length}</td>
//                             <td>{order.status}</td>
//                             <td>{new Date(order.timestamp).toLocaleTimeString()}</td>
//                             {orderFilter === 'completed' && (
//                               <td>{order.status === 'Served' ? 'Yes' : 'No'}</td>
//                             )}
//                             <td>
//                               {order.status === 'Ready' ? (
//                                 <button className="serve-order-button" onClick={() => handleServe(order.id)}>Serve</button>
//                               ) : (
//                                 <span style={{ color: '#6f4e37' }}>—</span>
//                               )}
//                             </td>
//                           </tr>
//                         );
//                       })}
//                     </tbody>
//                   </table>
//                 </div>
//               )}
//             </div>
//           )}
//           {activeTab === 'payments' && (
//             <div className="order-queue-section" id="payments">
//               <h4>Payments</h4>
//               {orders.filter(o => o.status === 'Served').length === 0 ? (
//                 <p>No served orders pending payment.</p>
//               ) : (
//                 <div className="recipe-list">
//                   {orders.filter(o => o.status === 'Served').map(o => (
//                     <div key={`pay-${o.id}`} className="recipe-card">
//                       <h5>Order #{o.id} — Table {o.table}</h5>
//                       <p>Status: {o.status}</p>
//                       <button className="process-payment-button" onClick={() => alert(`Payment processed for Order #${o.id}`)}>Process Payment</button>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           )}
//           {activeTab === 'alerts' && (
//             <div className="order-queue-section">
//               <h4>Alerts</h4>
//               {alerts.length === 0 ? (
//                 <p>No alerts.</p>
//               ) : (
//                 <div className="recipe-list">
//                   {alerts.map(a => (
//                     <div key={a.id} className="recipe-card">
//                       <h5>{a.type === 'order_ready' ? 'Order Ready' : 'Notification'}</h5>
//                       <p>Order #{a.orderId} — Table {a.table}</p>
//                       <p>Time: {new Date(a.timestamp).toLocaleTimeString()}</p>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           )}
//           {activeTab === 'team' && (
//             <div className="order-queue-section">
//               <div className="team-header">
//                 <h4>Team</h4>
//                 <button className="view-btn" onClick={() => openManage(null)}>Add Member</button>
//               </div>
//               <div className="team-section">
//                 <table className="team-table">
//                   <thead>
//                     <tr>
//                       <th>Name</th>
//                       <th>Email</th>
//                       <th>Phone</th>
//                       <th>Points</th>
//                       <th>Shift</th>
//                       <th>Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {teamMembers.map((m, idx) => (
//                       <tr key={`${m.name}-${idx}`}>
//                         <td>
//                           <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                             <img className="team-avatar" src={m.avatar || 'https://via.placeholder.com/64x64?text=Photo'} alt={m.name} />
//                             <span className="team-name">{m.name}</span>
//                           </div>
//                         </td>
//                         <td>{m.email}</td>
//                         <td>{m.phone}</td>
//                         <td>{m.points}</td>
//                         <td>{m.shift}</td>
//                         <td>
//                           <button className="view-btn" onClick={() => openManage(m)}>Manage</button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           )}
//           {showManage && (
//             <div className="team-modal-overlay" onClick={() => { setShowManage(false); setEditMember(null); }}>
//               <div className="team-modal" onClick={(e) => e.stopPropagation()}>
//                 <h4 style={{ marginTop: 0 }}>{editMember ? 'Manage Team Member' : 'Add Team Member'}</h4>
//                 <div className="form-grid">
//                   <div className="form-field">
//                     <label>Name</label>
//                     <input type="text" value={mName} onChange={(e) => setMName(e.target.value)} />
//                   </div>
//                   <div className="form-field">
//                     <label>Email</label>
//                     <input type="text" value={mEmail} onChange={(e) => setMEmail(e.target.value)} />
//                   </div>
//                   <div className="form-field">
//                     <label>Phone</label>
//                     <input type="text" value={mPhone} onChange={(e) => setMPhone(e.target.value)} />
//                   </div>
//                   <div className="form-field">
//                     <label>Points</label>
//                     <input type="number" value={mPoints} onChange={(e) => setMPoints(e.target.value)} />
//                   </div>
//                   <div className="form-field">
//                     <label>Shift</label>
//                     <select value={mShift} onChange={(e) => setMShift(e.target.value)}>
//                       <option>Morning</option>
//                       <option>Evening</option>
//                       <option>Night</option>
//                     </select>
//                   </div>
//                   <div className="form-field">
//                     <label>Photo</label>
//                     <div className="photo-preview">
//                       {mAvatar && <img src={mAvatar} alt="Avatar" />}
//                       <input type="file" accept="image/*" onChange={handleWaiterPhotoFile} />
//                     </div>
//                   </div>
//                 </div>
//                 <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
//                   <button className="view-btn" onClick={saveMember}>Save</button>
//                   <button className="view-btn" onClick={() => { setShowManage(false); setEditMember(null); }}>Cancel</button>
//                   {editMember && <button className="view-btn" onClick={() => deleteMember(editMember.id)}>Delete</button>}
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default WaiterDashboard;







// // import React, { useState, useEffect } from 'react';
// // import './WaiterDashboard.css';

// // const WaiterDashboard = () => {
// //   const [tables, setTables] = useState([
// //     { id: 1, status: 'Empty', capacity: 4, x: 50, y: 50, shape: 'square' },
// //     { id: 2, status: 'Occupied', capacity: 2, customer: 'Alice', seatingTime: Date.now() - (60 * 60 * 1000), currentOrder: { id: 101, items: [{ name: 'Latte', quantity: 1, price: 4.00 }, { name: 'Croissant', quantity: 1, price: 3.50 }], status: 'Preparing' }, x: 200, y: 50, shape: 'circle' },
// //     { id: 3, status: 'Reserved', capacity: 6, customer: 'Bob', reservationTime: '12:00 PM', x: 350, y: 50, shape: 'rectangle' },
// //     { id: 4, status: 'Empty', capacity: 4, x: 50, y: 200, shape: 'square' },
// //     { id: 5, status: 'Occupied', capacity: 3, customer: 'Charlie', seatingTime: Date.now() - (30 * 60 * 1000), currentOrder: { id: 102, items: [{ name: 'Espresso', quantity: 1, price: 2.50 }, { name: 'Muffin', quantity: 1, price: 3.00 }], status: 'Ready' }, x: 200, y: 200, shape: 'circle' },
// //     { id: 6, status: 'Empty', capacity: 2, x: 350, y: 200, shape: 'square' },
// //     { id: 7, status: 'Occupied', capacity: 4, customer: 'David', seatingTime: Date.now() - (15 * 60 * 1000), currentOrder: { id: 103, items: [{ name: 'Cappuccino', quantity: 2, price: 4.00 }], status: 'Served' }, x: 500, y: 125, shape: 'rectangle' },
// //   ]);
// //   const [selectedTableId, setSelectedTableId] = useState(null);
// //   const [customerName, setCustomerName] = useState('');
// //   const [menu, setMenu] = useState([
// //     { id: 'm1', name: 'Espresso', price: 2.50, category: 'Coffee' },
// //     { id: 'm2', name: 'Latte', price: 4.00, category: 'Coffee' },
// //     { id: 'm3', name: 'Cappuccino', price: 4.00, category: 'Coffee' },
// //     { id: 'm4', name: 'Americano', price: 3.00, category: 'Coffee' },
// //     { id: 'm5', name: 'Croissant', price: 3.50, category: 'Pastry' },
// //     { id: 'm6', name: 'Muffin', price: 3.00, category: 'Pastry' },
// //     { id: 'm7', name: 'Orange Juice', price: 3.00, category: 'Beverage' },
// //     { id: 'm8', name: 'Still Water', price: 2.00, category: 'Beverage' },
// //   ]);
// //   const [selectedItems, setSelectedItems] = useState({}); // {itemId: quantity}
// //   const [showPaymentForm, setShowPaymentForm] = useState(false);
// //   const [paymentTableId, setPaymentTableId] = useState(null);
// //   const [amountReceived, setAmountReceived] = useState('');
// //   const [paymentMethod, setPaymentMethod] = useState('Cash');
// //   const [customerRequests, setCustomerRequests] = useState([]);
// //   const [showRequestManagement, setShowRequestManagement] = useState(false);
// //   const [selectedTable, setSelectedTable] = useState(null);
// //   const [requestFilterStatus, setRequestFilterStatus] = useState('All');
// //   const [filteredRequests, setFilteredRequests] = useState([]);

// //   useEffect(() => {
// //     const requestsForSelectedTable = customerRequests.filter(req => req.tableId === selectedTable);
// //     if (requestFilterStatus === 'All') {
// //       setFilteredRequests(requestsForSelectedTable);
// //     } else {
// //       setFilteredRequests(requestsForSelectedTable.filter(req => req.status === requestFilterStatus));
// //     }
// //   }, [customerRequests, selectedTable, requestFilterStatus]);

// //   // Function to simulate a customer making a request
// //   const handleAddRequest = (tableId, requestType) => {
// //     const newRequest = {
// //       id: customerRequests.length + 1,
// //       tableId,
// //       requestType,
// //       status: 'Pending',
// //       timestamp: Date.now(),
// //     };
// //     setCustomerRequests((prevRequests) => [...prevRequests, newRequest]);
// //     alert(`New request from Table ${tableId}: ${requestType}`);
// //   };

// //   // Function to update the status of a customer request
// //   const handleUpdateRequestStatus = (requestId, newStatus) => {
// //     setCustomerRequests((prevRequests) =>
// //       prevRequests.map((req) =>
// //         req.id === requestId ? { ...req, status: newStatus } : req
// //       )
// //     );
// //   };

// //   // Simulate incoming requests for demonstration
// //   useEffect(() => {
// //     const interval = setInterval(() => {
// //       const randomTableId = Math.floor(Math.random() * tables.length) + 1;
// //       const requestTypes = ['Water', 'Bill', 'Assistance', 'Order'];
// //       const randomRequestType = requestTypes[Math.floor(Math.random() * requestTypes.length)];
// //       if (Math.random() < 0.3) { // 30% chance to add a new request
// //         handleAddRequest(randomTableId, randomRequestType);
// //       }
// //     }, 30000); // Every 30 seconds

// //     return () => clearInterval(interval);
// //   }, [tables, handleAddRequest]);

// //   const handleAssignCustomer = (e) => {
// //     e.preventDefault();
// //     if (selectedTableId && customerName) {
// //       setTables(tables.map((table) =>
// //         table.id === selectedTableId
// //           ? { ...table, status: 'Occupied', customer: customerName, seatingTime: Date.now(), currentOrder: null } // No order initially
// //           : table
// //       ));
// //       // Keep selectedTableId for immediate order taking
// //       setCustomerName('');
// //       setSelectedItems({}); // Clear selected items for the new customer
// //     }
// //   };

// //   const handleClearTable = (id) => {
// //     setTables(tables.map((table) =>
// //       table.id === id
// //         ? { ...table, status: 'Empty', customer: undefined, seatingTime: undefined, currentOrder: undefined }
// //         : table
// //     ));
// //   };

// //   const handleServeOrder = (tableId) => {
// //     setTables(tables.map((table) =>
// //       table.id === tableId
// //         ? { ...table, currentOrder: { ...table.currentOrder, status: 'Served' } } // Mark as served, but keep order for payment
// //         : table
// //     ));
// //   };

// //   const handleProcessPayment = (e) => {
// //     e.preventDefault();
// //     if (paymentTableId && amountReceived) {
// //       const tableToPay = tables.find(table => table.id === paymentTableId);
// //       if (tableToPay && tableToPay.currentOrder) {
// //         const totalAmount = tableToPay.currentOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
// //         if (parseFloat(amountReceived) >= totalAmount) {
// //           alert(`Payment of $${amountReceived} received for Table ${paymentTableId} via ${paymentMethod}. Change: $${(parseFloat(amountReceived) - totalAmount).toFixed(2)}`);
// //           setTables(tables.map((table) =>
// //             table.id === paymentTableId
// //               ? { ...table, status: 'Empty', customer: undefined, seatingTime: undefined, currentOrder: undefined }
// //               : table
// //           ));
// //           setShowPaymentForm(false);
// //           setPaymentTableId(null);
// //           setAmountReceived('');
// //           setPaymentMethod('Cash');
// //         } else {
// //           alert(`Amount received ($${amountReceived}) is less than total amount ($${totalAmount.toFixed(2)}).`);
// //         }
// //       }
// //     }
// //   };

// //   const handleInitiatePayment = (tableId) => {
// //     setPaymentTableId(tableId);
// //     setShowPaymentForm(true);
// //     const tableToPay = tables.find(table => table.id === tableId);
// //     if (tableToPay && tableToPay.currentOrder) {
// //       const totalAmount = tableToPay.currentOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
// //       setAmountReceived(totalAmount.toFixed(2)); // Pre-fill with total amount
// //     }
// //   };

// //   const handleSelectTable = (id) => {
// //     setSelectedTableId(id);
// //     setCustomerName('');
// //     setSelectedItems({}); // Clear selected items when a new table is selected
// //   };

// //   const handleQuantityChange = (itemId, change) => {
// //     setSelectedItems((prevSelectedItems) => {
// //       const newQuantity = (prevSelectedItems[itemId] || 0) + change;
// //       if (newQuantity < 0) return prevSelectedItems; // Quantity cannot be negative
// //       if (newQuantity === 0) {
// //         const newItems = { ...prevSelectedItems };
// //         delete newItems[itemId];
// //         return newItems;
// //       }
// //       return {
// //         ...prevSelectedItems,
// //         [itemId]: newQuantity,
// //       };
// //     });
// //   };

// //   const formatSeatingTime = (timestamp) => {
// //     const now = Date.now();
// //     const elapsed = now - timestamp; // milliseconds
// //     const minutes = Math.floor(elapsed / (1000 * 60));
// //     const hours = Math.floor(minutes / 60);
// //     const remainingMinutes = minutes % 60;

// //     if (hours > 0) {
// //       return `${hours}h ${remainingMinutes}m`;
// //     } else {
// //       return `${remainingMinutes}m`;
// //     }
// //   };

// //   const handleSendOrder = () => {
// //     if (selectedTableId && Object.keys(selectedItems).length > 0) {
// //       const orderItems = Object.entries(selectedItems)
// //         .filter(([, quantity]) => quantity > 0)
// //         .map(([itemId, quantity]) => {
// //           const item = menu.find(m => m.id === itemId);
// //           return item ? { name: item.name, quantity, price: item.price } : null;
// //         })
// //         .filter(Boolean);

// //       if (orderItems.length > 0) {
// //         const newOrder = {
// //           id: Date.now(), // Simple unique ID
// //           items: orderItems,
// //           status: 'Pending', // Initial status
// //           timestamp: Date.now(),
// //         };

// //         setTables(tables.map((table) =>
// //           table.id === selectedTableId
// //             ? { ...table, currentOrder: newOrder }
// //             : table
// //         ));
// //         setSelectedItems({});
// //         // Keep selectedTableId for now, so waiter can continue taking orders or assign another customer
// //       }
// //     }
// //   };

// //   // Simulate kitchen processing
// //   useEffect(() => {
// //     const kitchenInterval = setInterval(() => {
// //       setTables((prevTables) =>
// //         prevTables.map((table) => {
// //           if (table.currentOrder) {
// //             const orderAge = (Date.now() - table.currentOrder.timestamp) / 1000; // in seconds
// //             let newStatus = table.currentOrder.status;

// //             if (newStatus === 'Pending' && orderAge > 5) { // After 5 seconds, start preparing
// //               newStatus = 'Preparing';
// //             } else if (newStatus === 'Preparing' && orderAge > 15) { // After 15 seconds, order is ready
// //               newStatus = 'Ready';
// //             }

// //             if (newStatus !== table.currentOrder.status) {
// //               return {
// //                 ...table,
// //                 currentOrder: { ...table.currentOrder, status: newStatus },
// //               };
// //             }
// //           }
// //           return table;
// //         })
// //       );
// //     }, 2000); // Check every 2 seconds

// //     return () => clearInterval(kitchenInterval);
// //   }, []);

// //   return (
// //     <div className="waiter-dashboard">
// //       <h3>Waiter Dashboard</h3>
// //       <p>Welcome, Waiter! Manage tables, deliver orders, and complete payments efficiently.</p>

// //       <div className="table-management-section">
// //         <h4>Table Status</h4>
// //         <div className="floor-plan-container">
// //           {tables.map((table) => (
// //             <div
// //               key={table.id}
// //               className={`table-card ${table.status.toLowerCase()} ${table.shape}`}
// //               style={{ left: table.x, top: table.y }}
// //               onClick={() => handleSelectTable(table.id)}
// //             >
// //               <h5>Table {table.id}</h5>
// //               <p>Capacity: {table.capacity}</p>
// //               <p>Status: {table.status}</p>
// //               {table.status === 'Occupied' && (
// //               <>
// //                 <p>Customer: {table.customer}</p>
// //                 <p>Seated: {formatSeatingTime(table.seatingTime)} ago</p>
// //                 {customerRequests.filter(req => req.tableId === table.id && req.status === 'Pending').length > 0 && (
// //                   <div className="request-indicator">
// //                     <span>🔔 {customerRequests.filter(req => req.tableId === table.id && req.status === 'Pending').length} New Request(s)</span>
// //                   </div>
// //                 )}
// //                 {table.currentOrder && (
// //                   <div className={`current-order-details order-status-${table.currentOrder.status.toLowerCase()}`}>
// //                     <h5>Current Order:</h5>
// //                     <ul>
// //                       {table.currentOrder.items.map((item, index) => (
// //                         <li key={index}>{item.name} x {item.quantity}</li>
// //                       ))}
// //                     </ul>
// //                     <p>Status: <strong>{table.currentOrder.status}</strong></p>
// //                     {table.currentOrder.status === 'Ready' && (
// //                       <button onClick={(e) => { e.stopPropagation(); handleServeOrder(table.id); }} className="serve-order-button">Mark as Served</button>
// //                     )}
// //                     {table.currentOrder.status === 'Served' && (
// //                       <button onClick={(e) => { e.stopPropagation(); handleInitiatePayment(table.id); }} className="process-payment-button">Process Payment</button>
// //                     )}
// //                   </div>
// //                 )}
// //                 <button onClick={(e) => { e.stopPropagation(); handleClearTable(table.id); }} className="clear-table-button">Clear Table</button>
// //                 <button onClick={(e) => { e.stopPropagation(); setSelectedTable(table.id); setShowRequestManagement(true); }} className="manage-requests-button">Manage Requests</button>
// //               </>
// //             )}
// //               {table.status === 'Reserved' && (
// //                 <>
// //                   <p>Customer: {table.customer}</p>
// //                   <p>Reservation: {table.reservationTime}</p>
// //                 </>
// //               )}
// //               {table.status === 'Empty' && (
// //                 <button onClick={(e) => { e.stopPropagation(); handleSelectTable(table.id); }} className="assign-customer-button">Assign Customer</button>
// //               )}
// //             </div>
// //           ))}
// //         </div>

// //         {showPaymentForm && paymentTableId && (
// //           <div className="payment-form-overlay">
// //             <div className="payment-form-container">
// //               <h4>Process Payment for Table {paymentTableId}</h4>
// //               {tables.find(table => table.id === paymentTableId)?.currentOrder && (
// //                 <div className="payment-order-summary">
// //                   <h5>Order Details:</h5>
// //                   <ul>
// //                     {tables.find(table => table.id === paymentTableId).currentOrder.items.map((item, index) => (
// //                       <li key={index}>{item.name} x {item.quantity} - ${(item.price * item.quantity).toFixed(2)}</li>
// //                     ))}
// //                   </ul>
// //                   <p>Total: <strong>${tables.find(table => table.id === paymentTableId).currentOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</strong></p>
// //                 </div>
// //               )}
// //               <form onSubmit={handleProcessPayment}>
// //                 <label>
// //                   Amount Received:
// //                   <input
// //                     type="number"
// //                     step="0.01"
// //                     value={amountReceived}
// //                     onChange={(e) => setAmountReceived(e.target.value)}
// //                     required
// //                   />
// //                 </label>
// //                 <label>
// //                   Payment Method:
// //                   <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
// //                     <option value="Cash">Cash</option>
// //                     <option value="Card">Card</option>
// //                     <option value="MobilePay">Mobile Pay</option>
// //                   </select>
// //                 </label>
// //                 <div className="payment-form-actions">
// //                   <button type="submit">Complete Payment</button>
// //                   <button type="button" onClick={() => setShowPaymentForm(false)}>Cancel</button>
// //                 </div>
// //               </form>
// //             </div>
// //         </div>
// //       )}

// //       {showRequestManagement && (
// //         <div className="request-management-overlay">
// //           <div className="request-management-container">
// //             <h3>Customer Requests for Table {selectedTable}</h3>
// //             <button className="close-button" onClick={() => setShowRequestManagement(false)}>X</button>
// //             <div className="request-filters">
// //               <label htmlFor="request-status-filter">Filter by Status:</label>
// //               <select
// //                 id="request-status-filter"
// //                 onChange={(e) => setRequestFilterStatus(e.target.value)}
// //                 value={requestFilterStatus}
// //               >
// //                 <option value="All">All</option>
// //                 <option value="Pending">Pending</option>
// //                 <option value="In Progress">In Progress</option>
// //                 <option value="Completed">Completed</option>
// //               </select>
// //             </div>
// //             <div className="request-list">
// //               {filteredRequests.length > 0 ? (
// //                 filteredRequests.map((request) => (
// //                   <div key={request.id} className={`request-item status-${request.status.toLowerCase().replace(' ', '-')}`}>
// //                     <p><strong>Table {request.tableId}:</strong> {request.requestType}</p>
// //                     <p>Status: {request.status}</p>
// //                     <p className="request-time">Requested {formatSeatingTime(request.timestamp)} ago</p>
// //                     <div className="request-actions">
// //                       {request.status === 'Pending' && (
// //                         <button onClick={() => handleUpdateRequestStatus(request.id, 'In Progress')}>Mark In Progress</button>
// //                       )}
// //                       {request.status === 'In Progress' && (
// //                         <button onClick={() => handleUpdateRequestStatus(request.id, 'Completed')}>Mark Completed</button>
// //                       )}
// //                     </div>
// //                   </div>
// //                 ))
// //               ) : (
// //                 <p>No requests for this table.</p>
// //               )}
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //         {selectedTableId && (
// //           <div className="assign-customer-form">
// //             <h4>Assign Customer to Table {selectedTableId}</h4>
// //             <form onSubmit={handleAssignCustomer}>
// //               <input
// //                 type="text"
// //                 placeholder="Customer Name"
// //                 value={customerName}
// //                 onChange={(e) => setCustomerName(e.target.value)}
// //                 required
// //               />
// //               <button type="submit">Assign</button>
// //               <button type="button" onClick={() => setSelectedTableId(null)}>Cancel</button>
// //             </form>
// //           </div>
// //         )}

// //         {selectedTableId && (
// //           <div className="order-taking-section">
// //             <h4>Take Order for Table {selectedTableId}</h4>
// //             <div className="menu-selection">
// //               {menu.map((item) => (
// //                 <div key={item.id} className="menu-item-selection">
// //                   <span>{item.name} - ${item.price.toFixed(2)}</span>
// //                   <div className="item-quantity-controls">
// //                     <button onClick={() => handleQuantityChange(item.id, -1)}>-</button>
// //                     <span>{selectedItems[item.id] || 0}</span>
// //                     <button onClick={() => handleQuantityChange(item.id, 1)}>+</button>
// //                   </div>
// //                 </div>
// //               ))}
// //             </div>
// //             <div className="current-order-summary">
// //               <h5>Order Summary</h5>
// //               {Object.keys(selectedItems).length === 0 ? (
// //                 <p>No items selected.</p>
// //               ) : (
// //                 <ul>
// //                   {Object.entries(selectedItems).map(([itemId, quantity]) => {
// //                     const item = menu.find(m => m.id === itemId);
// //                     return item && quantity > 0 ? (
// //                       <li key={itemId}>{item.name} x {quantity}</li>
// //                     ) : null;
// //                   })}
// //                 </ul>
// //               )}
// //               <button onClick={handleSendOrder} className="send-order-button">Send Order to Kitchen</button>
// //               <button onClick={() => setSelectedTableId(null)} className="cancel-order-button">Cancel Order</button>
// //             </div>
// //           </div>
// //         )}
// //       </div>
// //     </div>
// //   );
// // };

// // export default WaiterDashboard;


