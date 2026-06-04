import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './CustomerAccount.css';
import { userApi } from '../services/api';
import { formatINR } from '../utils/currency';
import { getBookingRefund, recordRefund } from '../utils/refundPolicy';
import { downloadReceiptPdf } from '../dashboards/OrderReceipt';
import { mapUserProfileToAccountProfile, syncCustomerProfileCache } from '../utils/customerProfile';
import { getCurrentUser } from '../utils/session';
import CustomerEventBookings from './CustomerEventBookings';
import { getCustomerFeedbackForCustomer, getCustomerFeedbackSignal, saveCustomerFeedback } from '../utils/feedbackStore';

const tabs = ['orders', 'tables', 'events', 'favourites', 'receipts', 'addresses', 'settings'];
const STAFF_HELP_ALERTS_KEY = 'staff_help_alerts';
const CUSTOMER_PAYMENT_RECORDS_KEY = 'customer_payment_records';
const CUSTOMER_REFUND_RECORDS_KEY = 'customer_refund_records';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

const normalizeHelpStatus = (status) => String(status || '').trim().toLowerCase();
const formatBookingLabel = (value) =>
  String(value || '')
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const isMoreThan24HoursOld = (value) => {
  if (!value) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && Date.now() - parsed.getTime() >= TWENTY_FOUR_HOURS_MS;
};

const getHelpOptionsForStatus = (status) => {
  const normalized = normalizeHelpStatus(status);

  if (['pending', 'approved', 'new'].includes(normalized)) {
    return ['chef'];
  }

  if (['ready', 'prepared', 'completed'].includes(normalized)) {
    return ['waiter'];
  }

  return [];
};

const CustomerAccount = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useMemo(() => {
    return getCurrentUser();
  }, []);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [editPhone, setEditPhone] = useState(false);
  const [editEmail, setEditEmail] = useState(false);
  const [profile, setProfile] = useState(() => mapUserProfileToAccountProfile(user || {}));
  useEffect(() => {
    if (!user?.id) return;

    const loadProfile = async () => {
      try {
        const { data } = await userApi.getProfile(user.id);
        const safeProfileData = data && typeof data === 'object' ? data : {};
        const nextProfile = mapUserProfileToAccountProfile(safeProfileData);
        setProfile(nextProfile);
        setPhone(safeProfileData.phone || '');
        setEmail(safeProfileData.email || '');
        syncCustomerProfileCache(safeProfileData);
      } catch (error) {
        console.error('Failed to load customer profile', error);
      }
    };

    loadProfile();
  }, [user?.id]);
  const savePhone = () => {
    localStorage.setItem('customerPhone', phone);
    setProfile(prev => ({ ...prev, phone }));
    localStorage.setItem('customerProfile', JSON.stringify({ ...profile, phone }));
    setEditPhone(false);
  };
  const saveEmail = () => {
    localStorage.setItem('customerEmail', email);
    setProfile(prev => ({ ...prev, email }));
    localStorage.setItem('customerProfile', JSON.stringify({ ...profile, email }));
    setEditEmail(false);
  };
  const saveProfile = () => {
    const next = { ...profile, phone, email };
    setProfile(next);
    localStorage.setItem('customerProfile', JSON.stringify(next));
    if (phone) localStorage.setItem('customerPhone', phone);
    if (email) localStorage.setItem('customerEmail', email);
    setDrawerOpen(false);
  };
  const useSampleData = () => {
    const sample = {
      fullName: 'Priya Sharma',
      gender: 'Female',
      dob: '1998-09-21',
      phone: '9991112222',
      email: 'priya.sharma@example.com',
      address1: '12 MG Road',
      address2: 'Apt 5B',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
      veg: true,
      newsletter: false,
    };
    setProfile(sample);
    setPhone(sample.phone);
    setEmail(sample.email);
  };
  const active = useMemo(() => {
    const t = (params.get('tab') || 'orders').toLowerCase();
    return tabs.includes(t) ? t : 'orders';
  }, [params]);
  const [paymentMethod, setPaymentMethod] = useState(() => {
    return localStorage.getItem('customerPaymentMethod') || '';
  });
  const [paymentDetails, setPaymentDetails] = useState(() => {
    try {
      const raw = localStorage.getItem('customerPaymentDetails');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const savePayment = () => {
    localStorage.setItem('customerPaymentMethod', paymentMethod);
    localStorage.setItem('customerPaymentDetails', JSON.stringify(paymentDetails || {}));
    alert('Payment preference saved');
  };
  // Address management
  const [savedAddresses, setSavedAddresses] = useState(() => {
    try {
      const raw = localStorage.getItem('savedAddresses');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [defaultAddress, setDefaultAddress] = useState(() => {
    return localStorage.getItem('currentAddress') || '';
  });
  const [addrFormOpen, setAddrFormOpen] = useState(false);
  const [addrLabel, setAddrLabel] = useState('');
  const [addrFull, setAddrFull] = useState('');
  const [addrErrors, setAddrErrors] = useState({});
  const [editIndex, setEditIndex] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [customerBookings, setCustomerBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [cafeImageMap, setCafeImageMap] = useState({});
  const [menuItemsByCafe, setMenuItemsByCafe] = useState({});
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [helpModalStep, setHelpModalStep] = useState('role');
  const [selectedHelpOrder, setSelectedHelpOrder] = useState(null);
  const [helpTargetRole, setHelpTargetRole] = useState('');
  const [helpRequestMessage, setHelpRequestMessage] = useState('');
  const [helpFeedback, setHelpFeedback] = useState('');
  const [paymentRecords, setPaymentRecords] = useState(() => {
    try {
      const raw = localStorage.getItem(CUSTOMER_PAYMENT_RECORDS_KEY) || '[]';
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [refundRecords, setRefundRecords] = useState(() => {
    try {
      const raw = localStorage.getItem(CUSTOMER_REFUND_RECORDS_KEY) || '[]';
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [feedbackDrafts, setFeedbackDrafts] = useState({});
  const [submittedFeedback, setSubmittedFeedback] = useState(() => user?.id ? getCustomerFeedbackForCustomer(user.id) : []);
  const [reorderingOrderId, setReorderingOrderId] = useState(null);

  useEffect(() => {
    if (active === 'addresses' && savedAddresses.length === 0) {
      setAddrFormOpen(true);
    }
  }, [active, savedAddresses.length]);

  const fallbackOrderImages = [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=900&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=900&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=900&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1498804103079-a6351b050096?q=80&w=900&auto=format&fit=crop',
  ];

  const resolveOrderItemImage = (order, parsedItems) => {
    const directItemImage = parsedItems.find((item) => item.imageUrl)?.imageUrl;
    if (directItemImage) {
      return directItemImage.startsWith('/') ? `http://localhost:8081${directItemImage}` : directItemImage;
    }

    const cafeMenu = menuItemsByCafe[order.cafeId] || [];
    const orderedItem = parsedItems.find((item) => item.itemId != null);
    const matchingMenuItem = orderedItem
      ? cafeMenu.find((menuItem) => Number(menuItem.id) === Number(orderedItem.itemId))
      : cafeMenu.find((menuItem) => {
          const firstItem = parsedItems[0];
          return firstItem && Number(menuItem.price) === Number(firstItem.price);
        });

    const menuImage = matchingMenuItem?.imageUrl;
    if (menuImage) {
      return menuImage.startsWith('/') ? `http://localhost:8081${menuImage}` : menuImage;
    }

    return '';
  };

  const resolveOrderImage = (order, index, parsedItems = [], preferOrderItemImage = false) => {
    if (preferOrderItemImage) {
      const orderItemImage = resolveOrderItemImage(order, parsedItems);
      if (orderItemImage) return orderItemImage;
    }
    const mappedImage = cafeImageMap[order.cafeId];
    if (mappedImage && !preferOrderItemImage) return mappedImage;
    return fallbackOrderImages[index % fallbackOrderImages.length];
  };
  const persistAddresses = (list, current = defaultAddress) => {
    setSavedAddresses(list);
    try {
      localStorage.setItem('savedAddresses', JSON.stringify(list));
    } catch {}
    if (!current && list.length > 0) current = list[0].full;
    setDefaultAddress(current);
    try {
      if (current) localStorage.setItem('currentAddress', current);
    } catch {}
  };
  const getAddressParts = () => {
    const parts = addrFull.split(',').map((part) => part.trim());
    return Array.from({ length: 6 }, (_, index) => parts[index] || '');
  };
  const updateAddressPart = (index, value) => {
    const parts = getAddressParts();
    parts[index] = value;
    setAddrFull(parts.join(', '));
  };
  const handleAddressFieldChange = (field, index, value) => {
    let nextValue = value;

    if (field === 'flatNo') {
      nextValue = value.replace(/\D/g, '');
    }

    if (field === 'street') {
      nextValue = value.replace(/[^A-Za-z\s]/g, '');
    }

    if (['district', 'city', 'state'].includes(field)) {
      nextValue = value.replace(/[^A-Za-z\s]/g, '');
    }

    if (field === 'pincode') {
      nextValue = value.replace(/\D/g, '').slice(0, 6);
    }

    updateAddressPart(index, nextValue);
    setAddrErrors((prev) => ({ ...prev, [field]: '' }));
  };
  const handleAddOrUpdateAddress = (e) => {
    e.preventDefault();
    const label = (addrLabel || (paymentDetails?.type || '') || 'Address').trim();
    const [flatNo, street, district, city, state, pincode] = getAddressParts();
    const nextErrors = {};

    if (!flatNo || !/^\d+$/.test(flatNo)) {
      nextErrors.flatNo = 'Flat No. should accept numbers only.';
    }
    if (!street || !/^[A-Za-z\s]+$/.test(street)) {
      nextErrors.street = 'Street should accept characters only.';
    }
    if (!district || !/^[A-Za-z\s]+$/.test(district)) {
      nextErrors.district = 'District should accept characters only.';
    }
    if (!city || !/^[A-Za-z\s]+$/.test(city)) {
      nextErrors.city = 'City should accept characters only.';
    }
    if (!state || !/^[A-Za-z\s]+$/.test(state)) {
      nextErrors.state = 'State should accept characters only.';
    }
    if (!/^\d{6}$/.test(pincode)) {
      nextErrors.pincode = 'Pincode should be exactly 6 digits.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setAddrErrors(nextErrors);
      return;
    }

    const full = [flatNo, street, district, city, state, pincode].join(', ');
    setAddrErrors({});
    if (editIndex != null) {
      const next = savedAddresses.map((a, i) => (i === editIndex ? { ...a, label, full } : a));
      persistAddresses(next, defaultAddress === savedAddresses[editIndex]?.full ? full : defaultAddress);
    } else {
      const next = [...savedAddresses, { label, full }];
      persistAddresses(next, defaultAddress || full);
    }
    setAddrLabel('');
    setAddrFull('');
    setAddrFormOpen(false);
    setEditIndex(null);
  };
  const startEditAddress = (index) => {
    setEditIndex(index);
    setAddrLabel(savedAddresses[index]?.label || '');
    setAddrFull(savedAddresses[index]?.full || '');
    setAddrErrors({});
    setAddrFormOpen(true);
  };
  const deleteAddress = (index) => {
    const toDelete = savedAddresses[index];
    const next = savedAddresses.filter((_, i) => i !== index);
    const newDefault = defaultAddress === toDelete?.full ? next[0]?.full || '' : defaultAddress;
    persistAddresses(next, newDefault);
  };
  const makeDefault = (index) => {
    const full = savedAddresses[index]?.full;
    if (!full) return;
    setDefaultAddress(full);
    try {
      localStorage.setItem('currentAddress', full);
    } catch {}
  };

  const setTab = (t) => {
    setParams({ tab: t });
  };

  useEffect(() => {
    fetch('http://localhost:8081/api/cafe')
      .then((res) => res.json())
      .then((data) => {
        const cafes = Array.isArray(data) ? data : [];
        const nextMap = {};
        cafes.forEach((cafe, index) => {
          let image = cafe.imageUrl;
          if (image && image.startsWith('/')) {
            image = `http://localhost:8081${image}`;
          }
          nextMap[cafe.id] = image || fallbackOrderImages[index % fallbackOrderImages.length];
        });
        setCafeImageMap(nextMap);
      })
      .catch((err) => console.error('Failed to fetch cafe images', err));
  }, []);

  useEffect(() => {
    const syncFeedback = () => {
      setSubmittedFeedback(user?.id ? getCustomerFeedbackForCustomer(user.id) : []);
    };

    syncFeedback();
    const signal = getCustomerFeedbackSignal();
    window.addEventListener(signal, syncFeedback);
    window.addEventListener('storage', syncFeedback);
    return () => {
      window.removeEventListener(signal, syncFeedback);
      window.removeEventListener('storage', syncFeedback);
    };
  }, [user?.id]);

  useEffect(() => {
    const syncRefundRecords = () => {
      try {
        const raw = localStorage.getItem(CUSTOMER_REFUND_RECORDS_KEY) || '[]';
        const parsed = JSON.parse(raw);
        setRefundRecords(Array.isArray(parsed) ? parsed : []);
      } catch {
        setRefundRecords([]);
      }
    };

    syncRefundRecords();
    window.addEventListener('customerRefundRecordsChanged', syncRefundRecords);
    window.addEventListener('storage', syncRefundRecords);

    return () => {
      window.removeEventListener('customerRefundRecordsChanged', syncRefundRecords);
      window.removeEventListener('storage', syncRefundRecords);
    };
  }, []);

  useEffect(() => {
    if (!user?.id || !['orders', 'receipts'].includes(active)) return;
    setOrdersLoading(true);
    fetch(`http://localhost:8081/api/orders/customer/${user.id}`)
      .then((res) => res.json())
      .then((data) => setCustomerOrders(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('Failed to fetch customer orders', err);
        setCustomerOrders([]);
      })
      .finally(() => setOrdersLoading(false));
  }, [active, user?.id]);

  useEffect(() => {
    const syncPaymentRecords = () => {
      try {
        const raw = localStorage.getItem(CUSTOMER_PAYMENT_RECORDS_KEY) || '[]';
        const parsed = JSON.parse(raw);
        setPaymentRecords(Array.isArray(parsed) ? parsed : []);
      } catch {
        setPaymentRecords([]);
      }
    };

    syncPaymentRecords();
    window.addEventListener('customerPaymentRecordsChanged', syncPaymentRecords);
    window.addEventListener('storage', syncPaymentRecords);

    return () => {
      window.removeEventListener('customerPaymentRecordsChanged', syncPaymentRecords);
      window.removeEventListener('storage', syncPaymentRecords);
    };
  }, []);

  useEffect(() => {
    if (!user?.id || active !== 'favourites') return;
    setFavoritesLoading(true);
    fetch(`http://localhost:8081/api/favorites/user/${user.id}`)
      .then((res) => res.json())
      .then((data) => setFavoriteItems(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('Failed to fetch favourites', err);
        setFavoriteItems([]);
      })
      .finally(() => setFavoritesLoading(false));
  }, [active, user?.id]);

  useEffect(() => {
    if (!user?.id || active !== 'tables') return;
    setBookingsLoading(true);
    fetch(`http://localhost:8081/api/bookings/customer/${user.id}`)
      .then((res) => res.json())
      .then((data) => setCustomerBookings(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('Failed to fetch customer bookings', err);
        setCustomerBookings([]);
      })
      .finally(() => setBookingsLoading(false));
  }, [active, user?.id]);

  useEffect(() => {
    const cafeIds = [...new Set(customerOrders.map((order) => order.cafeId).filter(Boolean))];
    if (cafeIds.length === 0) return;

    Promise.all(
      cafeIds.map((cafeId) =>
        fetch(`http://localhost:8081/api/cafe/${cafeId}/menu`)
          .then((res) => res.json())
          .then((items) => [cafeId, Array.isArray(items) ? items : []])
          .catch(() => [cafeId, []])
      )
    ).then((entries) => {
      const nextMap = {};
      entries.forEach(([cafeId, items]) => {
        nextMap[cafeId] = items;
      });
      setMenuItemsByCafe(nextMap);
    });
  }, [customerOrders]);

  const resolveDynamicItemNames = (order, parsedItems) => {
    const cafeMenu = menuItemsByCafe[order.cafeId] || [];
    const usedIndexes = new Set();

    return parsedItems.map((item) => {
      const directName = item.name || item.itemName;
      if (directName) {
        return `${directName}${item.qty > 1 ? ` x${item.qty}` : ''}`;
      }

      const exactIdMatchIndex = cafeMenu.findIndex((menuItem, idx) =>
        !usedIndexes.has(idx) &&
        item.itemId != null &&
        menuItem.id === item.itemId
      );

      if (exactIdMatchIndex >= 0) {
        usedIndexes.add(exactIdMatchIndex);
        const exactIdMatch = cafeMenu[exactIdMatchIndex];
        return `${exactIdMatch.itemName}${item.qty > 1 ? ` x${item.qty}` : ''}`;
      }

      const exactPriceMatchIndex = cafeMenu.findIndex((menuItem, idx) =>
        !usedIndexes.has(idx) &&
        Number(menuItem.price) === Number(item.price)
      );

      if (exactPriceMatchIndex >= 0) {
        usedIndexes.add(exactPriceMatchIndex);
        const exactPriceMatch = cafeMenu[exactPriceMatchIndex];
        return `${exactPriceMatch.itemName}${item.qty > 1 ? ` x${item.qty}` : ''}`;
      }

      return `Item${item.qty > 1 ? ` x${item.qty}` : ''}`;
    }).join(', ');
  };

  const getCustomerOrderStatus = (status) => {
    const normalized = String(status || 'Pending').toLowerCase();

    if (normalized === 'pending') {
      return { label: 'Pending', className: 'status-pending' };
    }
    if (normalized === 'approved' || normalized === 'preparing' || normalized === 'in progress') {
      return { label: 'Preparing', className: 'status-preparing' };
    }
    if (normalized === 'ready' || normalized === 'prepared') {
      return { label: 'Prepared', className: 'status-prepared' };
    }
    if (normalized === 'delivered' || normalized === 'completed') {
      return { label: 'Delivered', className: 'status-delivered' };
    }
    if (normalized === 'cancelled') {
      return { label: 'Cancelled', className: 'status-cancelled' };
    }

    return { label: status || 'Pending', className: 'status-pending' };
  };

  const getCustomerBookingStatus = (status) => {
    const normalized = String(status || 'PENDING').toLowerCase();

    if (normalized === 'approved') {
      return { label: 'Approved', className: 'delivered' };
    }
    if (normalized === 'no_show' || normalized === 'no show') {
      return { label: 'No Show', className: 'cancelled' };
    }
    if (normalized === 'expired') {
      return { label: 'Expired', className: 'cancelled' };
    }
    if (normalized === 'declined' || normalized === 'cancelled') {
      return { label: 'Cancelled', className: 'cancelled' };
    }

    return { label: 'Pending', className: '' };
  };

  const closeHelpModal = () => {
    setHelpModalOpen(false);
    setHelpModalStep('role');
    setSelectedHelpOrder(null);
    setHelpTargetRole('');
    setHelpRequestMessage('');
  };

  const buildDefaultHelpMessage = (role, order) => {
    if (!order) return '';

    if (role === 'chef') {
      return `Hello Chef, please review Order #${order.id} for ${order.cafe}. It has not started preparing yet.`;
    }

    return `Hello Waiter, please serve Order #${order.id} for ${order.cafe}. The food is prepared and I am waiting for service.`;
  };

  const openHelpModal = (order) => {
    setSelectedHelpOrder(order);
    setHelpTargetRole('');
    setHelpRequestMessage('');
    setHelpModalStep('role');
    setHelpModalOpen(true);
    setHelpFeedback('');
  };

  const handleHelpRoleSelect = (role) => {
    setHelpTargetRole(role);
    setHelpRequestMessage(buildDefaultHelpMessage(role, selectedHelpOrder));
    setHelpModalStep('compose');
  };

  const handleSendHelpRequest = () => {
    if (!selectedHelpOrder || !helpTargetRole || !helpRequestMessage.trim()) {
      return;
    }

    try {
      const existingAlerts = JSON.parse(localStorage.getItem(STAFF_HELP_ALERTS_KEY) || '[]');
      const customerName = profile.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.email || 'Customer';
      const nextAlert = {
        id: Date.now(),
        type: 'customer_help',
        recipientRole: helpTargetRole,
        cafeId: selectedHelpOrder.cafeId,
        cafeName: selectedHelpOrder.cafe,
        orderId: selectedHelpOrder.id,
        orderStatus: selectedHelpOrder.status,
        table: selectedHelpOrder.tableNumber || '-',
        customerId: user?.id ?? null,
        customerName,
        message: helpRequestMessage.trim(),
        timestamp: Date.now(),
        status: 'unread',
        targetStaffId: helpTargetRole === 'chef'
          ? selectedHelpOrder.assignedChefId ?? null
          : selectedHelpOrder.assignedWaiterId ?? null,
        targetStaffName: helpTargetRole === 'chef'
          ? selectedHelpOrder.assignedChefName ?? ''
          : selectedHelpOrder.assignedWaiterName ?? '',
      };

      localStorage.setItem(STAFF_HELP_ALERTS_KEY, JSON.stringify([...existingAlerts, nextAlert]));
      window.dispatchEvent(new Event('staffHelpAlertsChanged'));
      setHelpFeedback(`Request sent to the ${helpTargetRole}.`);
      closeHelpModal();
    } catch (error) {
      console.error('Failed to send help request', error);
      setHelpFeedback('Failed to send help request. Please try again.');
    }
  };

  const handleFeedbackDraftChange = (key, field, value) => {
    setFeedbackDrafts((prev) => ({
      ...prev,
      [key]: {
        rating: 5,
        message: '',
        ...(prev[key] || {}),
        [field]: value,
      },
    }));
  };

  const handleSubmitCustomerFeedback = (target) => {
    const draft = feedbackDrafts[target.key] || {};
    const message = String(draft.message || '').trim();

    if (!message) {
      setHelpFeedback('Please write feedback before submitting.');
      return;
    }

    const saved = saveCustomerFeedback({
      type: target.type,
      targetId: target.id,
      cafeId: target.cafeId,
      cafeName: target.cafeName,
      title: target.title,
      customerId: user?.id,
      customerName: profile.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.email || 'Customer',
      rating: draft.rating || 5,
      message,
    });

    setSubmittedFeedback((prev) => [saved, ...prev]);
    setFeedbackDrafts((prev) => ({ ...prev, [target.key]: { rating: 5, message: '' } }));
    setHelpFeedback('Feedback submitted successfully.');
  };

  const hasSubmittedFeedback = (type, id) =>
    submittedFeedback.some((item) => item.type === type && String(item.targetId) === String(id));

  const parseReceiptItems = (order) => {
    if (!order) return [];

    try {
      const parsedItems = JSON.parse(order.itemsSummary || order.items || '[]');
      if (!Array.isArray(parsedItems)) return [];

      return parsedItems.map((item) => ({
        name: item.name || item.itemName || 'Item',
        qty: item.qty ?? item.quantity ?? 1,
        price: item.price || 0,
      }));
    } catch {
      return [];
    }
  };

  const parseOrderItemsForReorder = (order) => {
    if (!order) return [];

    try {
      const parsedItems = JSON.parse(order.itemsSummary || order.items || '[]');
      return Array.isArray(parsedItems) ? parsedItems : [];
    } catch {
      return [];
    }
  };

  const resolveReorderItem = (order, item) => {
    const cafeMenu = menuItemsByCafe[order.cafeId] || [];
    const itemName = item.itemName || item.name || '';
    const itemPrice = Number(item.price || 0);
    const menuMatch = cafeMenu.find((menuItem) => {
      const menuName = menuItem.itemName || menuItem.name || '';
      return (
        (item.itemId != null && Number(menuItem.id) === Number(item.itemId)) ||
        (itemName && menuName.toLowerCase() === itemName.toLowerCase()) ||
        (itemName && Number(menuItem.price) === itemPrice)
      );
    });

    return {
      itemId: item.itemId ?? menuMatch?.id,
      itemName: itemName || menuMatch?.itemName || menuMatch?.name || 'Menu Item',
      price: Number(item.price ?? menuMatch?.price ?? 0),
      imageUrl: item.imageUrl || menuMatch?.imageUrl || '',
      quantity: Math.max(1, Number(item.qty ?? item.quantity ?? 1) || 1),
    };
  };

  const handleOrderAgain = async (order) => {
    if (!user?.id) {
      setHelpFeedback('Please log in before ordering again.');
      return;
    }

    const sourceItems = Array.isArray(order.orderItems) ? order.orderItems : parseOrderItemsForReorder(order);
    const reorderItems = sourceItems
      .map((item) => resolveReorderItem(order, item))
      .filter((item) => item.itemId != null);

    if (reorderItems.length === 0) {
      setHelpFeedback('Could not find menu items for this past order.');
      return;
    }

    setReorderingOrderId(order.id);

    try {
      for (const item of reorderItems) {
        for (let count = 0; count < item.quantity; count += 1) {
          await fetch('http://localhost:8081/api/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              cafeId: order.cafeId,
              cafeName: order.cafeName || `Cafe #${order.cafeId}`,
              itemId: item.itemId,
              itemName: item.itemName,
              price: item.price,
              imageUrl: item.imageUrl,
            }),
          });
        }
      }

      window.dispatchEvent(new Event('cart-updated'));
      setHelpFeedback('Past order added to cart.');
      navigate('/cart');
    } catch (error) {
      console.error('Failed to reorder items', error);
      setHelpFeedback('Could not add this order to cart. Please try again.');
    } finally {
      setReorderingOrderId(null);
    }
  };

  const handleDownloadReceipt = (payment) => {
    if (payment.receiptType === 'REFUND') {
      downloadReceiptPdf({
        orderId: `REF-${payment.bookingId}`,
        date: payment.processedAt ? new Date(payment.processedAt).toLocaleString() : new Date().toLocaleString(),
        items: [
          {
            name: `${payment.type === 'EVENT' ? 'Event' : 'Table'} booking refund`,
            qty: 1,
            price: payment.refundAmount || 0,
          },
          {
            name: 'Cancellation fee deducted',
            qty: 1,
            price: payment.cancellationFee || 0,
          },
        ],
        subtotal: payment.paidAmount || 0,
        discount: payment.cancellationFee || 0,
        tax: 0,
        total: payment.refundAmount || 0,
        cafeName: payment.cafeName || `Cafe #${payment.cafeId}`,
      });
      return;
    }

    const matchingOrder = customerOrders.find((order) => Number(order.id) === Number(payment.orderId));
    downloadReceiptPdf({
      orderId: `ORD-${payment.orderId}`,
      date: payment.paidAt ? new Date(payment.paidAt).toLocaleString() : new Date().toLocaleString(),
      items: parseReceiptItems(matchingOrder),
      subtotal: payment.subtotal || payment.amount || 0,
      discount: payment.discount || 0,
      tax: payment.tax || 0,
      total: payment.amount || 0,
      cafeName: payment.cafeName || matchingOrder?.cafeName || `Cafe #${payment.cafeId}`,
    });
  };

  const isTableCancellationExpired = (booking) => {
    const status = String(booking?.status || '').toLowerCase();
    if (status === 'cancelled') return true;
    if (isMoreThan24HoursOld(booking?.createdAt || booking?.bookedAt)) return true;
    if (!booking?.bookingDate) return false;

    const parsed = new Date(`${booking.bookingDate}T${booking.bookingTime || '23:59'}`);
    if (Number.isNaN(parsed.getTime())) return false;

    return Date.now() >= parsed.getTime() + TWENTY_FOUR_HOURS_MS;
  };

  const handleCancelBooking = async (bookingId) => {
    const currentBooking = customerBookings.find((booking) => booking.id === bookingId);
    if (isTableCancellationExpired(currentBooking)) return;

    const confirmCancel = window.confirm('Are you sure you want to cancel this table booking?');
    if (!confirmCancel) return;

    try {
      const response = await fetch(`http://localhost:8081/api/bookings/${bookingId}/cancel`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

      const updatedBooking = await response.json();
      setCustomerBookings((prev) =>
        prev.map((booking) => (booking.id === updatedBooking.id ? updatedBooking : booking))
      );
      const paidAmount = Number(
        updatedBooking.advancePaymentAmount ||
        currentBooking?.advancePaymentAmount ||
        currentBooking?.price ||
        0
      );
      const { refundAmount, cancellationFee, refundPercentage } = getBookingRefund({
        paidAmount,
        bookingDate: updatedBooking.bookingDate || currentBooking?.bookingDate || '',
        bookingTime: updatedBooking.bookingTime || currentBooking?.bookingTime || '',
        createdAt: currentBooking?.createdAt || currentBooking?.bookedAt || updatedBooking.createdAt || '',
        type: 'TABLE',
      });
      const refundRecord = recordRefund({
        type: 'TABLE',
        bookingId,
        customerId: user?.id,
        cafeId: updatedBooking.cafeId || currentBooking?.cafeId,
        cafeName: updatedBooking.cafeName || currentBooking?.cafeName,
        paidAmount,
        refundAmount,
        cancellationFee,
        refundPercentage,
      });
      handleDownloadReceipt({
        ...refundRecord,
        type: 'TABLE',
        bookingId,
        cafeId: updatedBooking.cafeId || currentBooking?.cafeId,
        cafeName: updatedBooking.cafeName || currentBooking?.cafeName,
        paidAmount,
        refundAmount,
        cancellationFee,
        refundPercentage,
        receiptType: 'REFUND',
      });
      setCustomerBookings((prev) =>
        prev.map((booking) =>
          booking.id === updatedBooking.id
            ? { ...updatedBooking, refundAmount, cancellationFee, refundPercentage, refundStatus: 'PROCESSED' }
            : booking
        )
      );
      alert(`Booking cancelled. ${formatINR(refundAmount)} has been refunded to your account. Cancellation fee: ${formatINR(cancellationFee)}.`);
    } catch (error) {
      console.error('Failed to cancel booking', error);
      alert('Unable to cancel booking right now.');
    }
  };

  const isOrderServed = (status) => {
    const normalized = String(status || '').trim().toLowerCase();
    return ['served', 'delivered', 'completed'].includes(normalized);
  };

  const isOrderCancellationBlocked = (order) => {
    const normalized = String(order?.status || order?.statusLabel || '').trim().toLowerCase();
    return ['cancelled', 'ready', 'prepared', 'served', 'delivered', 'completed'].includes(normalized) ||
      isMoreThan24HoursOld(order?.createdAt || order?.orderDate);
  };

  const isDateTimePassed = (date, time) => {
    if (!date) return false;
    const parsed = new Date(`${date}T${time || '23:59'}`);
    return !Number.isNaN(parsed.getTime()) && parsed <= new Date();
  };

  const handleCancelOrder = async (order) => {
    if (!order || isOrderCancellationBlocked(order)) return;

    const confirmCancel = window.confirm('Are you sure you want to cancel this order?');
    if (!confirmCancel) return;

    try {
      const response = await fetch(`http://localhost:8081/api/orders/${order.id}/status?status=Cancelled`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel order');
      }

      const updatedOrder = await response.json();
      const paidAmount = Number(order.total || updatedOrder.totalAmount || updatedOrder.price || 0);
      const { refundAmount, cancellationFee, refundPercentage } = getBookingRefund({
        paidAmount,
        createdAt: order.createdAt || updatedOrder.createdAt || order.orderDate || '',
        type: 'ORDER',
        status: order.status || order.statusLabel || updatedOrder.status || updatedOrder.orderStatus || '',
      });
      const refundRecord = recordRefund({
        type: 'ORDER',
        bookingId: order.id,
        customerId: user?.id,
        cafeId: order.cafeId,
        cafeName: order.cafe,
        paidAmount,
        refundAmount,
        cancellationFee,
        refundPercentage,
      });

      handleDownloadReceipt({
        ...refundRecord,
        type: 'ORDER',
        bookingId: order.id,
        cafeId: order.cafeId,
        cafeName: order.cafe,
        paidAmount,
        refundAmount,
        cancellationFee,
        refundPercentage,
        receiptType: 'REFUND',
      });

      setCustomerOrders((prev) =>
        prev.map((item) =>
          Number(item.id) === Number(order.id)
            ? { ...item, status: 'Cancelled', orderStatus: 'Cancelled', refundAmount, cancellationFee, refundPercentage, refundStatus: 'PROCESSED' }
            : item
        )
      );
      alert(`Order cancelled. ${formatINR(refundAmount)} has been refunded to your account. Cancellation fee: ${formatINR(cancellationFee)}.`);
    } catch (error) {
      console.error('Failed to cancel order', error);
      alert('Unable to cancel order right now.');
    }
  };

  const renderContent = () => {
    const addressParts = getAddressParts();

    if (active === 'favourites') {
      return (
        <div className="card">
          <h3>Favourites</h3>
          {favoritesLoading && <p>Loading favourites...</p>}
          {!favoritesLoading && favoriteItems.length === 0 && (
            <p>You have not added any favourites yet.</p>
          )}
          <div className="favourites-list">
            {favoriteItems.map((item, index) => {
              let image = item.imageUrl;
              if (image && image.startsWith('/')) {
                image = `http://localhost:8081${image}`;
              }
              image = image || fallbackOrderImages[index % fallbackOrderImages.length];

              return (
                <div key={item.id} className="favourite-card">
                  <img src={image} alt={item.itemName} />
                  <div className="favourite-body">
                    <div className="favourite-cafe">{item.cafeName || `Cafe #${item.cafeId}`}</div>
                    <div className="favourite-title">{item.itemName}</div>
                    <div className="favourite-bottom">
                      <div className="favourite-price">{formatINR(item.price || 0)}</div>
                      <button
                        type="button"
                        className="btn primary"
                        onClick={() => navigate(`/cafe/${item.cafeId}`)}
                      >
                        View Cafe
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (active === 'tables') {
      const bookings = customerBookings.map((booking, index) => {
        const statusMeta = getCustomerBookingStatus(booking.status);
        const celebrationLabel = booking.celebrationEvent
          ? booking.celebrationType === 'other'
            ? booking.customCelebrationType || 'Other Event'
            : formatBookingLabel(booking.celebrationType)
          : '';
        const bookingDateTime = [booking.bookingDate, booking.bookingTime].filter(Boolean).join(' · ');

        return {
          id: booking.id,
          cafe: booking.cafeName || `Cafe #${booking.cafeId}`,
          cafeId: booking.cafeId,
          when: bookingDateTime || 'Upcoming booking',
          guests: booking.people || 0,
          table: booking.tableNumber || booking.tableId || '-',
          status: statusMeta.label,
          badgeClass: statusMeta.className,
          bookingDate: booking.bookingDate,
          bookingTime: booking.bookingTime,
          createdAt: booking.createdAt || booking.bookedAt || '',
          img: resolveOrderImage(booking, index),
          celebrationLabel,
          decorationTheme: booking.decorationTheme,
          surpriseSetup: booking.surpriseSetup,
          notes: booking.notes,
          refundAmount: booking.refundAmount,
          cancellationFee: booking.cancellationFee,
          refundStatus: booking.refundStatus,
          feedbackKey: `TABLE-${booking.id}`,
        };
      });

      return (
        <div className="card">
          <h3>Tables Booked</h3>
          {bookingsLoading && <p>Loading booked tables...</p>}
          {!bookingsLoading && bookings.length === 0 && <p>No table bookings yet.</p>}
          <div className="booking-list">
            {bookings.map((b) => (
              <div key={b.id} className="booking-card">
                <img src={b.img} alt={b.cafe} />
                <div className="booking-body">
                  <div className="booking-title">{b.cafe}</div>
                  <div className="booking-sub">{b.when}</div>
                  <div className="booking-meta">
                    <span className="badge">{b.guests} guests</span>
                    <span className="badge">Table #{b.table}</span>
                    {b.celebrationLabel && <span className="badge">{b.celebrationLabel}</span>}
                    <span className={`badge ${b.badgeClass}`}>{b.status}</span>
                  </div>
                  {(b.celebrationLabel || b.decorationTheme || b.surpriseSetup || b.notes) && (
                    <div className="booking-sub">
                      {[
                        b.celebrationLabel ? `Event: ${b.celebrationLabel}` : '',
                        b.decorationTheme ? `Theme: ${formatBookingLabel(b.decorationTheme)}` : '',
                        b.surpriseSetup ? 'Surprise setup requested' : '',
                        b.notes ? `Request: ${b.notes}` : '',
                      ].filter(Boolean).join(' | ')}
                    </div>
                  )}
                  {b.refundStatus && (
                    <div className="booking-sub">
                      Refund {b.refundStatus}: {formatINR(b.refundAmount || 0)} | Fee: {formatINR(b.cancellationFee || 0)}
                    </div>
                  )}
                  <div className="booking-actions">
                    <button className="btn ghost" disabled={isTableCancellationExpired(b)} onClick={() => handleCancelBooking(b.id)}>
                      {String(b.status).toLowerCase() === 'cancelled' ? 'Cancelled' : 'Cancel Booking'}
                    </button>
                    <button className="btn primary" onClick={() => navigate(`/booking/${b.cafeId || ''}`)}>
                      Book again
                    </button>
                  </div>
                  {String(b.status).toLowerCase() !== 'cancelled' && (
                    <div className="customer-feedback-form">
                      <select
                        value={feedbackDrafts[b.feedbackKey]?.rating || 5}
                        onChange={(e) => handleFeedbackDraftChange(b.feedbackKey, 'rating', e.target.value)}
                      >
                        <option value="5">5 - Excellent</option>
                        <option value="4">4 - Good</option>
                        <option value="3">3 - Average</option>
                        <option value="2">2 - Poor</option>
                        <option value="1">1 - Bad</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Share table booking feedback"
                        value={feedbackDrafts[b.feedbackKey]?.message || ''}
                        onChange={(e) => handleFeedbackDraftChange(b.feedbackKey, 'message', e.target.value)}
                      />
                      <button
                        className="btn primary"
                        type="button"
                        onClick={() => handleSubmitCustomerFeedback({
                          key: b.feedbackKey,
                          type: 'TABLE',
                          id: b.id,
                          cafeId: b.cafeId,
                          cafeName: b.cafe,
                          title: `Table #${b.table}`,
                        })}
                      >
                        Submit Feedback
                      </button>
                      {hasSubmittedFeedback('TABLE', b.id) && <span>Feedback sent</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (active === 'events') {
      return <CustomerEventBookings user={user} />;
    }

    switch (active) {
      case 'orders':
        {
          const orders = customerOrders.map((order, index) => {
            let parsedItems = [];
            try {
              parsedItems = JSON.parse(order.itemsSummary || order.items || '[]');
            } catch {
              parsedItems = [];
            }
            const itemNames = parsedItems.length > 0
              ? resolveDynamicItemNames(order, parsedItems)
              : 'Order items';
            const statusMeta = getCustomerOrderStatus(order.status || order.orderStatus);
            const parsedOrderItems = parseOrderItemsForReorder(order);
            return {
              id: order.id,
              cafe: order.cafeName || `Cafe #${order.cafeId}`,
              cafeName: order.cafeName,
              img: resolveOrderImage(order, index, parsedItems, true),
              items: itemNames,
              orderItems: parsedOrderItems,
              total: order.totalAmount || order.price || 0,
              status: order.status || order.orderStatus || 'Pending',
              statusLabel: statusMeta.label,
              statusClassName: statusMeta.className,
              createdAt: order.createdAt || order.orderDate || '',
              deliveredOn: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '',
              cafeId: order.cafeId,
              tableNumber: order.tableNumber || order.table || '-',
              refundAmount: order.refundAmount,
              cancellationFee: order.cancellationFee,
              refundStatus: order.refundStatus,
              assignedChefId: order.assignedChefId ?? null,
              assignedChefName: order.assignedChefName ?? '',
              assignedWaiterId: order.assignedWaiterId ?? null,
              assignedWaiterName: order.assignedWaiterName ?? '',
              feedbackKey: `ORDER-${order.id}`,
            };
          });
          return (
            <div className="card">
              <h3>Past Orders</h3>
              {ordersLoading && <p>Loading orders...</p>}
              {!ordersLoading && orders.length === 0 && <p>No orders yet.</p>}
              <div className="customer-orders-list">
                {orders.map((o) => (
                  <div key={o.id} className="customer-order-card">
                    <img src={o.img} alt={o.cafe} />
                    <div className="customer-order-card-body">
                      <div className="customer-order-card-title">{o.cafe}</div>
                      <div className="customer-order-card-sub">{o.items}</div>
                      <div className="customer-order-meta">
                        <span className="customer-order-date-label">{o.deliveredOn ? `Ordered on ${o.deliveredOn}` : 'Recent order'}</span>
                      </div>
                      <div className="customer-order-bottom">
                      <div className="customer-order-total">{formatINR(o.total)}</div>
                        <div className="customer-order-actions">
                          <button className={`btn order-status-btn ${o.statusClassName}`} type="button">
                            {o.statusLabel}
                          </button>
                          <button
                            className="btn ghost"
                            type="button"
                            disabled={isOrderCancellationBlocked(o)}
                            onClick={() => handleCancelOrder(o)}
                          >
                            Cancel Order
                          </button>
                          <button
                            className="btn ghost"
                            type="button"
                            disabled={reorderingOrderId === o.id || o.orderItems.length === 0}
                            onClick={() => handleOrderAgain(o)}
                          >
                            {reorderingOrderId === o.id ? 'Adding...' : 'Order Again'}
                          </button>
                        </div>
                      </div>
                      {o.refundStatus && (
                        <div className="booking-sub">
                          Refund {o.refundStatus}: {formatINR(o.refundAmount || 0)} | Fee: {formatINR(o.cancellationFee || 0)}
                        </div>
                      )}
                      {String(o.statusLabel || '').toLowerCase() !== 'cancelled' && (
                        <div className="customer-feedback-form">
                          <select
                            value={feedbackDrafts[o.feedbackKey]?.rating || 5}
                            onChange={(e) => handleFeedbackDraftChange(o.feedbackKey, 'rating', e.target.value)}
                          >
                            <option value="5">5 - Excellent</option>
                            <option value="4">4 - Good</option>
                            <option value="3">3 - Average</option>
                            <option value="2">2 - Poor</option>
                            <option value="1">1 - Bad</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Share menu order feedback"
                            value={feedbackDrafts[o.feedbackKey]?.message || ''}
                            onChange={(e) => handleFeedbackDraftChange(o.feedbackKey, 'message', e.target.value)}
                          />
                          <button
                            className="btn primary"
                            type="button"
                            onClick={() => handleSubmitCustomerFeedback({
                              key: o.feedbackKey,
                              type: 'ORDER',
                              id: o.id,
                              cafeId: o.cafeId,
                              cafeName: o.cafe,
                              title: `Order #${o.id}`,
                            })}
                          >
                            Submit Feedback
                          </button>
                          {hasSubmittedFeedback('ORDER', o.id) && <span>Feedback sent</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
      case 'favourites':
        return <div className="card"><h3>Favourites</h3><p>You haven’t added any favourites yet.</p></div>;
      case 'tables':
        {
          const bookings = [
            {
              id: 201,
              cafe: 'Coffee House (Downtown)',
              when: '2026-03-05 · 07:30 PM',
              guests: 2,
              table: 4,
              status: 'Completed',
              img: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80&w=900&auto=format&fit=crop'
            },
            {
              id: 202,
              cafe: 'Brew & Grind (Uptown)',
              when: '2026-02-14 · 06:00 PM',
              guests: 4,
              table: 7,
              status: 'Completed',
              img: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?q=80&w=900&auto=format&fit=crop'
            },
            {
              id: 203,
              cafe: 'The Daily Roast (Midtown)',
              when: '2026-01-20 · 08:15 PM',
              guests: 3,
              table: 2,
              status: 'Cancelled',
              img: 'https://images.unsplash.com/photo-1517705008128-361805f42e86?q=80&w=900&auto=format&fit=crop'
            }
          ];
          return (
            <div className="card">
              <h3>Tables Booked</h3>
              <div className="booking-list">
                {bookings.map(b => (
                  <div key={b.id} className="booking-card">
                    <img src={b.img} alt={b.cafe} />
                    <div className="booking-body">
                      <div className="booking-title">{b.cafe}</div>
                      <div className="booking-sub">{b.when}</div>
                      <div className="booking-meta">
                        <span className="badge">{b.guests} guests</span>
                        <span className="badge">Table #{b.table}</span>
                        <span className={`badge ${b.status === 'Cancelled' ? 'cancelled' : 'delivered'}`}>{b.status}</span>
                      </div>
                      <div className="booking-actions">
                        <button className="btn ghost">Get help</button>
                        <button className="btn primary">Book again</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
      case 'payments':
        return (
          <div className="card payments-card">
            <h3>Payment Methods</h3>
            <p className="muted">Choose your preferred payment option</p>
            <div className="payments-list">
              <label className={`pay-option ${paymentMethod === 'phonepe' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="phonepe"
                  checked={paymentMethod === 'phonepe'}
                  onChange={() => setPaymentMethod('phonepe')}
                />
                <span className="pay-left">
                  <span className="pay-icon">📲</span>
                  <span className="pay-texts">
                    <span className="pay-title">PhonePe</span>
                    <span className="pay-sub">UPI</span>
                  </span>
                </span>
                <span className="pay-check">✓</span>
              </label>

              <label className={`pay-option ${paymentMethod === 'gpay' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="gpay"
                  checked={paymentMethod === 'gpay'}
                  onChange={() => setPaymentMethod('gpay')}
                />
                <span className="pay-left">
                  <span className="pay-icon">💳</span>
                  <span className="pay-texts">
                    <span className="pay-title">GPay</span>
                    <span className="pay-sub">UPI</span>
                  </span>
                </span>
                <span className="pay-check">✓</span>
              </label>

              <label className={`pay-option ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                />
                <span className="pay-left">
                  <span className="pay-icon">💵</span>
                  <span className="pay-texts">
                    <span className="pay-title">Cash on Delivery</span>
                    <span className="pay-sub">Pay in cash</span>
                  </span>
                </span>
                <span className="pay-check">✓</span>
              </label>

              <label className={`pay-option ${paymentMethod === 'other' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="other"
                  checked={paymentMethod === 'other'}
                  onChange={() => setPaymentMethod('other')}
                />
                <span className="pay-left">
                  <span className="pay-icon">⚙️</span>
                  <span className="pay-texts">
                    <span className="pay-title">Other</span>
                    <span className="pay-sub">Custom</span>
                  </span>
                </span>
                <span className="pay-check">✓</span>
              </label>
            </div>
            {paymentMethod && (
              <div className="pay-detail">
                {['phonepe', 'gpay'].includes(paymentMethod) && (
                  <div className="pay-field">
                    <label>UPI ID</label>
                    <input
                      className="pay-input"
                      type="text"
                      value={paymentDetails.upiId || ''}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, upiId: e.target.value }))}
                      placeholder="name@bank"
                    />
                  </div>
                )}
                {paymentMethod === 'cod' && (
                  <div className="pay-note">
                    Cash on Delivery selected. Ensure your address is updated in your profile.
                  </div>
                )}
                {paymentMethod === 'other' && (
                  <div className="pay-field">
                    <label>Notes</label>
                    <textarea
                      className="pay-input"
                      rows="3"
                      value={paymentDetails.notes || ''}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add instructions or method details"
                    />
                  </div>
                )}
                <div className="pay-actions">
                  <button className="btn ghost" onClick={() => { setPaymentMethod(''); setPaymentDetails({}); }}>Clear</button>
                  <button className="btn primary" onClick={savePayment}>Save Preference</button>
                </div>
              </div>
            )}
            {!paymentMethod && (
              <div className="muted">No payment method selected</div>
            )}
            {localStorage.getItem('customerPaymentMethod') && (
              <div className="pay-summary">
                <div className="summary-title">Saved preference</div>
                <div className="summary-row">
                  <div className="summary-key">Method</div>
                  <div className="summary-val">{localStorage.getItem('customerPaymentMethod')}</div>
                </div>
              </div>
            )}
          </div>
        );
      case 'receipts':
        {
          const customerReceipts = paymentRecords
            .filter((payment) => Number(payment.customerId) === Number(user?.id))
            .map((payment) => ({ ...payment, receiptType: 'PAYMENT' }))
            .sort((a, b) => Number(b.paidAt || 0) - Number(a.paidAt || 0));
          const customerRefundReceipts = refundRecords
            .filter((refund) => Number(refund.customerId) === Number(user?.id))
            .map((refund) => ({ ...refund, receiptType: 'REFUND' }))
            .sort((a, b) => new Date(b.processedAt || 0).getTime() - new Date(a.processedAt || 0).getTime());
          const allReceipts = [...customerRefundReceipts, ...customerReceipts]
            .sort((a, b) => {
              const aTime = a.receiptType === 'REFUND' ? new Date(a.processedAt || 0).getTime() : Number(a.paidAt || 0);
              const bTime = b.receiptType === 'REFUND' ? new Date(b.processedAt || 0).getTime() : Number(b.paidAt || 0);
              return bTime - aTime;
            });

          return (
            <div className="card">
              <h3>Receipts</h3>
              {allReceipts.length === 0 ? (
                <p>No receipts available yet.</p>
              ) : (
                <div className="receipts-list">
                  {allReceipts.map((payment) => (
                    <div key={payment.id} className="receipt-history-card">
                      <div className="receipt-history-top">
                        <div>
                          <div className="receipt-history-title">{payment.cafeName || `Cafe #${payment.cafeId}`}</div>
                          <div className="receipt-history-sub">
                            {payment.receiptType === 'REFUND' ? `Refund for ${payment.type?.toLowerCase()} booking #${payment.bookingId}` : `Order #${payment.orderId}`}
                          </div>
                        </div>
                        <div className="receipt-history-total">
                          {formatINR(payment.receiptType === 'REFUND' ? payment.refundAmount || 0 : payment.amount || 0)}
                        </div>
                      </div>
                      <div className="receipt-history-meta">
                        <span>{payment.paymentMethod || 'Razorpay'}</span>
                        <span>{payment.receiptType === 'REFUND' ? payment.refundStatus || 'Refunded' : 'Paid'}</span>
                        <span>{payment.receiptType === 'REFUND'
                          ? payment.processedAt ? new Date(payment.processedAt).toLocaleDateString() : '-'
                          : payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : '-'}</span>
                      </div>
                      <button className="btn primary receipt-download-btn" type="button" onClick={() => handleDownloadReceipt(payment)}>
                        Download Receipt
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }
      case 'addresses':
        return (
          <div className="card">
            <h3>Addresses</h3>
            <p className="muted">Manage your delivery addresses. Set a default for quick checkout.</p>
            <div className="address-list">
              {savedAddresses.length > 0 ? (
                savedAddresses.map((a, idx) => (
                  <div key={idx} className="address-item">
                    <div className="addr-main">
                      <div className="addr-label">{a.label || 'Address'}</div>
                      <div className="addr-full">{a.full}</div>
                      {defaultAddress === a.full && <span className="addr-badge">Default</span>}
                    </div>
                    <div className="addr-actions">
                      {defaultAddress !== a.full && (
                        <button className="btn ghost" onClick={() => makeDefault(idx)}>Make Default</button>
                      )}
                      <button className="btn ghost" onClick={() => startEditAddress(idx)}>Edit</button>
                      <button className="btn ghost" onClick={() => deleteAddress(idx)}>Delete</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="muted">No saved addresses yet.</div>
              )}
            </div>
            {!addrFormOpen ? (
              <div className="addr-add-row">
                <button className="btn primary" onClick={() => { setAddrFormOpen(true); setEditIndex(null); }}>Add new address</button>
              </div>
            ) : (
              <form className="addr-form" onSubmit={handleAddOrUpdateAddress}>
                <div className="addr-type-pills">
                  <button type="button" className={`pill ${addrLabel.toLowerCase()==='home' ? 'active' : ''}`} onClick={() => setAddrLabel('Home')}>Home</button>
                  <button type="button" className={`pill ${addrLabel.toLowerCase()==='work' ? 'active' : ''}`} onClick={() => setAddrLabel('Work')}>Work</button>
                  <button type="button" className={`pill ${addrLabel.toLowerCase()==='other' ? 'active' : ''}`} onClick={() => setAddrLabel('Other')}>Other</button>
                </div>
                <div className="addr-form-grid-advanced">
                  <div className="addr-field">
                    <input type="text" inputMode="numeric" className={`addr-input ${addrErrors.flatNo ? 'error' : ''}`} placeholder="House / Flat No." value={addressParts[0]} onChange={(e) => handleAddressFieldChange('flatNo', 0, e.target.value)} />
                    {addrErrors.flatNo && <span className="addr-error">{addrErrors.flatNo}</span>}
                  </div>
                  <div className="addr-field">
                    <input type="text" className={`addr-input ${addrErrors.street ? 'error' : ''}`} placeholder="Area / Street" value={addressParts[1]} onChange={(e) => handleAddressFieldChange('street', 1, e.target.value)} />
                    {addrErrors.street && <span className="addr-error">{addrErrors.street}</span>}
                  </div>
                  <div className="addr-field">
                    <input type="text" className={`addr-input ${addrErrors.district ? 'error' : ''}`} placeholder="District" value={addressParts[2]} onChange={(e) => handleAddressFieldChange('district', 2, e.target.value)} />
                    {addrErrors.district && <span className="addr-error">{addrErrors.district}</span>}
                  </div>
                  <div className="addr-field">
                    <input type="text" className={`addr-input ${addrErrors.city ? 'error' : ''}`} placeholder="City" value={addressParts[3]} onChange={(e) => handleAddressFieldChange('city', 3, e.target.value)} />
                    {addrErrors.city && <span className="addr-error">{addrErrors.city}</span>}
                  </div>
                  <div className="addr-field">
                    <input type="text" className={`addr-input ${addrErrors.state ? 'error' : ''}`} placeholder="State" value={addressParts[4]} onChange={(e) => handleAddressFieldChange('state', 4, e.target.value)} />
                    {addrErrors.state && <span className="addr-error">{addrErrors.state}</span>}
                  </div>
                  <div className="addr-field">
                    <input type="text" inputMode="numeric" maxLength={6} className={`addr-input ${addrErrors.pincode ? 'error' : ''}`} placeholder="Pin Code" value={addressParts[5]} onChange={(e) => handleAddressFieldChange('pincode', 5, e.target.value)} />
                    {addrErrors.pincode && <span className="addr-error">{addrErrors.pincode}</span>}
                  </div>
                </div>
                <div className="addr-form-actions">
                  <button type="button" className="btn ghost" onClick={() => { setAddrFormOpen(false); setEditIndex(null); setAddrLabel(''); setAddrFull(''); setAddrErrors({}); }}>Cancel</button>
                  <button type="submit" className="btn primary">{editIndex != null ? 'Save' : 'Add Address'}</button>
                </div>
              </form>
            )}
          </div>
        );
      case 'settings':
        return <div className="card"><h3>Settings</h3><p>Update preferences and notifications.</p></div>;
      default:
        return null;
    }
  };

  return (
    <div className="account-page">
      {helpFeedback && (
        <div className="customer-help-feedback" role="status" aria-live="polite">
          {helpFeedback}
        </div>
      )}

      <div className="account-body">
        <aside className="account-sidebar">
          <div className="account-sidebar-profile">
            <div className="account-sidebar-name">Your Profile</div>
            <div className="account-sidebar-sub">Welcome back</div>
          </div>
          <ul>
            <li className={active === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>Orders</li>
            <li className={active === 'tables' ? 'active' : ''} onClick={() => setTab('tables')}>Tables Booked</li>
            <li className={active === 'events' ? 'active' : ''} onClick={() => setTab('events')}>Event Booking</li>
            <li className={active === 'favourites' ? 'active' : ''} onClick={() => setTab('favourites')}>Favourites</li>
            <li className={active === 'receipts' ? 'active' : ''} onClick={() => setTab('receipts')}>Receipts</li>
            <li className={active === 'addresses' ? 'active' : ''} onClick={() => setTab('addresses')}>Addresses</li>
            <li className={active === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>Settings</li>
          </ul>
          <div className="account-sidebar-actions">
            <button className="btn hero-back-btn" onClick={() => navigate('/dashboard/customer')}>Back To Home</button>
            <button className="btn edit-btn" onClick={() => navigate('/customer-account/edit')}>Edit Profile</button>
          </div>
        </aside>
        <main className="account-content">
          {renderContent()}
        </main>
      </div>
      {drawerOpen && (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <aside className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <button className="icon-btn" onClick={() => setDrawerOpen(false)}>✕</button>
              <div className="drawer-title">Edit profile</div>
            </div>
            <div className="drawer-section">
              <div className="drawer-label">Phone number</div>
              {!editPhone ? (
                <div className="drawer-row">
                  <div className="drawer-value">{phone || 'Not set'}</div>
                  <button className="link-btn" onClick={() => setEditPhone(true)}>Change</button>
                </div>
              ) : (
                <div className="drawer-edit">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                  <div className="drawer-actions">
                    <button className="btn ghost" onClick={() => setEditPhone(false)}>Cancel</button>
                    <button className="btn primary" onClick={savePhone}>Save</button>
                  </div>
                </div>
              )}
            </div>
            <div className="drawer-divider" />
            <div className="drawer-section">
              <div className="drawer-label">Email id</div>
              {!editEmail ? (
                <div className="drawer-row">
                  <div className="drawer-value">{email || 'Not set'}</div>
                  <button className="link-btn" onClick={() => setEditEmail(true)}>Change</button>
                </div>
              ) : (
                <div className="drawer-edit">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email"
                  />
                  <div className="drawer-actions">
                    <button className="btn ghost" onClick={() => setEditEmail(false)}>Cancel</button>
                    <button className="btn primary" onClick={saveEmail}>Save</button>
                  </div>
                </div>
              )}
            </div>
            <div className="drawer-divider" />
            <div className="drawer-section">
              <div className="drawer-label">Personal details</div>
              <div className="drawer-edit">
                <input
                  type="text"
                  value={profile.fullName || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Full name"
                />
                <select
                  value={profile.gender || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, gender: e.target.value }))}
                >
                  <option value="">Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
                <input
                  type="date"
                  value={profile.dob || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, dob: e.target.value }))}
                />
              </div>
            </div>
            <div className="drawer-section">
              <div className="drawer-label">Address</div>
              <div className="drawer-edit">
                <input
                  type="text"
                  value={profile.address1 || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, address1: e.target.value }))}
                  placeholder="Address line 1"
                />
                <input
                  type="text"
                  value={profile.address2 || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, address2: e.target.value }))}
                  placeholder="Address line 2"
                />
                <input
                  type="text"
                  value={profile.city || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                />
                <input
                  type="text"
                  value={profile.state || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="State/Province"
                />
                <input
                  type="text"
                  value={profile.postalCode || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, postalCode: e.target.value }))}
                  placeholder="Postal code"
                />
                <input
                  type="text"
                  value={profile.country || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="Country"
                />
              </div>
            </div>
            <div className="drawer-section">
              <div className="drawer-label">Preferences</div>
              <div className="drawer-edit">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={!!profile.veg}
                    onChange={(e) => setProfile(prev => ({ ...prev, veg: e.target.checked }))}
                  />
                  Vegetarian preference
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={!!profile.newsletter}
                    onChange={(e) => setProfile(prev => ({ ...prev, newsletter: e.target.checked }))}
                  />
                  Subscribe to newsletter
                </label>
              </div>
            </div>
            <div className="drawer-actions">
              <button className="btn ghost" onClick={useSampleData}>Use sample data</button>
              <button className="btn primary" onClick={saveProfile}>Save profile</button>
            </div>
          </aside>
        </div>
      )}
      {helpModalOpen && selectedHelpOrder && (
        <div className="customer-help-overlay" onClick={closeHelpModal}>
          <div className="customer-help-modal" onClick={(e) => e.stopPropagation()}>
            <div className="customer-help-header">
              <div>
                <h3>Order Help</h3>
                <p>
                  Order #{selectedHelpOrder.id} for {selectedHelpOrder.cafe}
                </p>
              </div>
              <button className="icon-btn" type="button" onClick={closeHelpModal}>x</button>
            </div>

            {helpModalStep === 'role' && (
              <div className="customer-help-step">
                <p className="customer-help-copy">Choose who should receive your request.</p>
                <div className="customer-help-role-grid">
                  <button
                    type="button"
                    className="customer-help-role-card"
                    disabled={!getHelpOptionsForStatus(selectedHelpOrder.status).includes('chef')}
                    onClick={() => handleHelpRoleSelect('chef')}
                  >
                    <span className="customer-help-role-title">Chef</span>
                    <span className="customer-help-role-subtitle">For orders not started yet.</span>
                  </button>
                  <button
                    type="button"
                    className="customer-help-role-card"
                    disabled={!getHelpOptionsForStatus(selectedHelpOrder.status).includes('waiter')}
                    onClick={() => handleHelpRoleSelect('waiter')}
                  >
                    <span className="customer-help-role-title">Waiter</span>
                    <span className="customer-help-role-subtitle">For prepared food waiting to be served.</span>
                  </button>
                </div>
                {getHelpOptionsForStatus(selectedHelpOrder.status).length === 0 && (
                  <p className="customer-help-note">
                    Help requests are available before preparation starts or after the order is prepared.
                  </p>
                )}
              </div>
            )}

            {helpModalStep === 'compose' && (
              <div className="customer-help-step">
                <button className="customer-help-back" type="button" onClick={() => setHelpModalStep('role')}>
                  Back
                </button>
                <p className="customer-help-copy">
                  Send this request to the {helpTargetRole}.
                </p>
                <textarea
                  className="customer-help-textarea"
                  rows="5"
                  value={helpRequestMessage}
                  onChange={(e) => setHelpRequestMessage(e.target.value)}
                />
                <button className="btn primary customer-help-send" type="button" onClick={handleSendHelpRequest}>
                  Send Request
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerAccount;

