import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ChefDashboard.css';
import { clearActiveSession, getCurrentCafeId, getCurrentUser } from '../utils/session';

const STAFF_HELP_ALERTS_KEY = 'staff_help_alerts';

const ChefDashboard = () => {
  const currentUser = getCurrentUser();
  const activeCafeId = currentUser?.cafeId || getCurrentCafeId() || '';
  const chefId = currentUser?.id ? Number(currentUser.id) : null;
  const staffName = [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ').trim() || currentUser?.email || 'Chef';
  const [cafeName, setCafeName] = useState(currentUser?.cafeName || '');

  const normalizeRole = (role) => String(role || '').trim().toLowerCase();
const normalizeOrderStatus = (status) => {
  const normalized = String(status || 'Pending').trim().toLowerCase();
  if (['new', 'approved', 'pending'].includes(normalized)) return 'Pending';
  if (['preparing', 'in progress', 'in_progress'].includes(normalized)) return 'Preparing';
  if (['completed', 'ready', 'prepared'].includes(normalized)) return 'Ready';
  if (normalized === 'cancelled') return 'Cancelled';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const formatOrderTable = (value) =>
  value === null || value === undefined || value === '' || Number(value) === 0
    ? 'Menu Order'
    : value;

const formatOrderTableLabel = (value) =>
  String(value) === 'Menu Order' ? 'Menu Order' : `Table ${value}`;

  const parseOrderItems = (rawOrder) => {
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

    const parsedItems = tryParse(rawOrder.items) || tryParse(rawOrder.itemsSummary);
    if (parsedItems.length === 0) {
      const plainText = [rawOrder.itemsSummary, rawOrder.items]
        .find((value) => typeof value === 'string' && value.trim() && !value.trim().startsWith('['));

      if (!plainText) {
        return [];
      }

      return plainText
        .split(',')
        .map((entry, index) => ({
          id: `${rawOrder.id}-${index}`,
          name: entry.trim(),
          quantity: 1,
        }))
        .filter((item) => item.name);
    }

    return parsedItems.map((item, index) => {
      if (typeof item === 'string') {
        return { id: `${rawOrder.id}-${index}`, name: item.trim(), quantity: 1 };
      }

      const name = item?.name || item?.itemName || `Item ${index + 1}`;
      const quantity = item?.quantity ?? item?.qty ?? 1;
      return {
        id: item?.itemId || `${rawOrder.id}-${index}`,
        name,
        quantity,
      };
    });
  };

  const normalizeOrder = (rawOrder) => ({
    ...rawOrder,
    table: formatOrderTable(rawOrder.tableNumber ?? rawOrder.table),
    status: normalizeOrderStatus(rawOrder.orderStatus || rawOrder.status),
    items: parseOrderItems(rawOrder),
    timestamp: rawOrder.createdAt ? new Date(rawOrder.createdAt).getTime() : Date.now(),
    assignedChefId: rawOrder.assignedChefId ?? null,
    assignedChefName: rawOrder.assignedChefName ?? '',
  });

  const tableImages = [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=150&h=150&q=60',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=150&h=150&q=60',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=150&h=150&q=60',
    'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=150&h=150&q=60',
    'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=150&h=150&q=60',
    'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=150&h=150&q=60'
  ];

  const getTableImage = (tableNum) => {
    const index = Number.isFinite(Number(tableNum)) ? Number(tableNum) : 0;
    return tableImages[index % tableImages.length];
  };

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  /* ==========================================================
     RECIPE DATA & STATE
     ========================================================== */
  const allowedCoffeeNames = ['Espresso','Latte','Cappuccino','Americano','Mocha','Flat White','Macchiato','Cold Brew'];
  const defaultCoffeeRecipes = [
    { id: 1, name: 'Espresso', ingredients: ['Finely Ground Coffee', 'Hot Water'], instructions: 'Ingredients: Finely ground coffee and hot water.\nTamp firmly and extract under high pressure.' },
    { id: 2, name: 'Latte', ingredients: ['Espresso', 'Steamed Milk', 'Foam'], instructions: 'Ingredients: Espresso, steamed milk, and light foam.\nPour steamed milk over espresso and finish with a small foam cap.' },
    { id: 3, name: 'Cappuccino', ingredients: ['Espresso', 'Steamed Milk', 'Thick Foam'], instructions: 'Ingredients: Espresso, milk, and thick foam.\nLayer equal parts espresso, steamed milk, and thick foam.' },
    { id: 4, name: 'Americano', ingredients: ['Espresso', 'Hot Water'], instructions: 'Ingredients: Espresso and hot water.\nBrew espresso and dilute with hot water to taste.' },
    { id: 5, name: 'Mocha', ingredients: ['Espresso', 'Steamed Milk', 'Chocolate'], instructions: 'Ingredients: Espresso, chocolate syrup, and steamed milk.\nMix chocolate with espresso; top with steamed milk.' },
    { id: 6, name: 'Flat White', ingredients: ['Espresso', 'Steamed Milk'], instructions: 'Ingredients: Espresso and microfoam milk.\nAdd velvety microfoam milk over ristretto espresso.' },
    { id: 7, name: 'Macchiato', ingredients: ['Espresso', 'Foamed Milk'], instructions: 'Ingredients: Espresso and a spoon of foam.\n“Mark” the espresso with a dollop of milk foam.' },
    { id: 8, name: 'Cold Brew', ingredients: ['Coarse Coffee', 'Cold Water'], instructions: 'Ingredients: Coarse coffee and cold water.\nSteep 12–24 hours, strain, and serve over ice.' },
  ];
  const [recipes, setRecipes] = useState(() => {
    try {
      const raw = localStorage.getItem('chef_recipes') || '[]';
      const arr = JSON.parse(raw);
      return Array.isArray(arr) && arr.length > 0 ? arr : defaultCoffeeRecipes;
    } catch {
      return defaultCoffeeRecipes;
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('orders');
  const navigate = useNavigate();
  const [orderFilter, setOrderFilter] = useState('all'); // all | in_progress | completed
  const [alerts, setAlerts] = useState([]);

  const loadChefAlerts = () => {
    try {
      const raw = localStorage.getItem(STAFF_HELP_ALERTS_KEY) || '[]';
      const parsed = JSON.parse(raw);
      const nextAlerts = Array.isArray(parsed)
        ? parsed
            .filter((alert) => {
              if (alert?.recipientRole !== 'chef') return false;
              if (String(alert?.cafeId ?? '') !== String(activeCafeId ?? '')) return false;
              if (alert?.targetStaffId != null && chefId != null) {
                return Number(alert.targetStaffId) === Number(chefId);
              }
              return true;
            })
            .sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0))
        : [];
      setAlerts(nextAlerts);
    } catch {
      setAlerts([]);
    }
  };
  /* ==========================================================
     CHEF TEAM MANAGEMENT STATE
     ========================================================== */
  const [chefTeam, setChefTeam] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [chefShowManage, setChefShowManage] = useState(false);
  const [chefEditMember, setChefEditMember] = useState(null);
  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cRole, setCRole] = useState('Chef');
  const [cGender, setCGender] = useState('');
  const [cAddress, setCAddress] = useState('');
  const [cQualification, setCQualification] = useState('');
  const [cPassword, setCPassword] = useState('');
  const openChefManage = (member) => {
    setChefEditMember(member || null);
    setCName(member ? member.name : '');
    setCEmail(member ? member.email : '');
    setCPhone(member ? member.phone : '');
    setCRole(member ? member.role : 'Chef');
    setCGender(member ? member.gender || '' : '');
    setCAddress(member ? member.address || '' : '');
    setCQualification(member ? member.qualifications || '' : '');
    setCPassword('');
    setChefShowManage(true);
  };
  const saveChefMember = async () => {
    const nm = cName.trim();
    if (!nm) return;
    if (!chefEditMember && !cPassword.trim()) return;

    const payload = {
      name: nm,
      email: cEmail.trim(),
      phone: cPhone.trim(),
      role: cRole,
      gender: cGender.trim(),
      address: cAddress.trim(),
      qualifications: cQualification.trim(),
      password: cPassword.trim(),
    };

    const url = chefEditMember
      ? `http://localhost:8081/api/staff/${chefEditMember.id}`
      : `http://localhost:8081/api/staff/cafe/${activeCafeId}`;
    const method = chefEditMember ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return;
    }

    await fetchChefTeam();
    setChefShowManage(false);
    setChefEditMember(null);
  };
  const deleteChefMember = async (id) => {
    await fetch(`http://localhost:8081/api/staff/${id}`, { method: 'DELETE' });
    await fetchChefTeam();
    setChefShowManage(false);
    setChefEditMember(null);
  };
  const itemImageMap = {
    'Espresso': 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=300&q=60',
    'Latte': 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=300&q=60',
    'Cappuccino': 'https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=300&q=60',
    'Americano': 'https://images.unsplash.com/photo-1461988091159-192b6df7054f?auto=format&fit=crop&w=300&q=60',
    'Muffin': 'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?auto=format&fit=crop&w=300&q=60',
    'Orange Juice': 'https://images.unsplash.com/photo-1571078321249-cd7bcb9c05b0?auto=format&fit=crop&w=300&q=60',
    'Blueberry Scone': 'https://images.unsplash.com/photo-1543339501-355b83f593b0?auto=format&fit=crop&w=300&q=60'
  };
  const itemPriceMap = {
    'Espresso': 2.5,
    'Latte': 4.0,
    'Cappuccino': 4.0,
    'Americano': 3.0,
    'Mocha': 4.5,
    'Flat White': 4.0,
    'Macchiato': 3.5,
    'Cold Brew': 3.5,
    'Muffin': 3.0,
    'Orange Juice': 3.0,
    'Blueberry Scone': 3.5
  };
  const chefEndpoints = {
    base: '/api',
    orders: '/api/chef/orders',
    orderById: '/api/chef/orders/:id',
    updateOrderStatus: '/api/chef/orders/:id/status',
    recipes: '/api/chef/recipes',
    recipeById: '/api/chef/recipes/:id',
    team: '/api/chef/team',
    teamMemberById: '/api/chef/team/:id',
    alerts: '/api/chef/alerts'
  };
  const recipeImageMap = {
    'Espresso': 'https://easternshorecoffee.com/wp-content/uploads/2018/10/espresso-bg.jpg',
    'Latte': 'https://www.foodandwine.com/thmb/CCe2JUHfjCQ44L0YTbCu97ukUzA=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/Partners-Latte-FT-BLOG0523-09569880de524fe487831d95184495cc.jpg',
    'Cappuccino': 'https://www.clarin.com/img/2022/03/01/capuchino-delicioso-y-facil-de___ceq4FUBv9_2000x1500__1.jpg',
    'Americano': 'https://koala.sh/api/image/v2-2lv85-27k9e.jpg?width=1216&height=832&dream',
    'Mocha': 'https://caphenguyenchat.vn/wp-content/uploads/2023/03/Mocha-1fc71f7-1280x806.png',
    'Flat White': 'http://coffeeandkin.co.uk/wp-content/uploads/2018/06/Flat-white.jpeg',
    'Macchiato': 'https://suddencoffee.com/wp-content/uploads/2024/05/macchiato-image.jpg',
    'Cold Brew': 'https://starbmag.com/wp-content/uploads/2022/01/Cold-brewed-coffee.png',
    'Blueberry Scone': 'https://images.unsplash.com/photo-1517244683847-7456b63c5969?auto=format&fit=crop&w=400&q=60'
  };

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState(null);
  const [formName, setFormName] = useState('');
  const [formIngredients, setFormIngredients] = useState('');
  const [formInstructions, setFormInstructions] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const ensureDefaultRecipes = () => {
    const names = new Set(recipes.map(r => r.name));
    const missing = defaultCoffeeRecipes.filter(r => !names.has(r.name));
    if (missing.length > 0) {
      const next = [...recipes, ...missing];
      setRecipes(next);
      saveRecipesStorage(next);
    }
  };

  const openNewRecipe = () => {
    setEditingRecipeId(null);
    setFormName('');
    setFormIngredients('');
    setFormInstructions('');
    setFormImageUrl('');
    setShowRecipeForm(true);
  };

  const openEditRecipe = (r) => {
    setEditingRecipeId(r.id);
    setFormName(r.name);
    setFormIngredients(r.ingredients.join(', '));
    setFormInstructions(r.instructions);
    setFormImageUrl(r.imageUrl || '');
    setShowRecipeForm(true);
  };
  const openDeleteConfirm = (id) => {
    setDeleteTargetId(id);
    setShowDeleteConfirm(true);
  };
  const confirmDelete = () => {
    if (deleteTargetId != null) deleteRecipe(deleteTargetId);
    setShowDeleteConfirm(false);
    setDeleteTargetId(null);
  };
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteTargetId(null);
  };

  const saveRecipesStorage = (list) => {
    try {
      localStorage.setItem('chef_recipes', JSON.stringify(list));
    } catch {}
  };

  const saveRecipe = () => {
    const name = (formName || '').trim();
    const ing = (formIngredients || '').split(',').map(s => s.trim()).filter(Boolean);
    const instr = (formInstructions || '').trim();
    if (!name || ing.length === 0 || !instr) return;
    if (!allowedCoffeeNames.includes(name)) return;
    const img = (formImageUrl || '').trim();
    if (!img && !recipeImageMap[name]) return;
    if (editingRecipeId) {
      const next = recipes.map(r => r.id === editingRecipeId ? { ...r, name, ingredients: ing, instructions: instr, imageUrl: img || undefined } : r);
      setRecipes(next);
      saveRecipesStorage(next);
    } else {
      const id = Date.now();
      const next = [{ id, name, ingredients: ing, instructions: instr, imageUrl: img || undefined }, ...recipes];
      setRecipes(next);
      saveRecipesStorage(next);
    }
    setShowRecipeForm(false);
    setEditingRecipeId(null);
  };

  const deleteRecipe = (id) => {
    const next = recipes.filter(r => r.id !== id);
    setRecipes(next);
    saveRecipesStorage(next);
  };

  const fetchOrders = async ({ silent = false } = {}) => {
    if (!activeCafeId) {
      setOrders([]);
      return;
    }

    try {
      if (!silent) {
        setOrdersLoading(true);
      }
      const response = await fetch(`http://localhost:8081/api/orders/cafe/${activeCafeId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch cafe orders');
      }

      const data = await response.json();
      const normalizedOrders = Array.isArray(data) ? data.map(normalizeOrder) : [];
      setOrders((prevOrders) => {
        const prevSnapshot = JSON.stringify(prevOrders);
        const nextSnapshot = JSON.stringify(normalizedOrders);
        return prevSnapshot === nextSnapshot ? prevOrders : normalizedOrders;
      });
    } catch (error) {
      console.error('Failed to fetch chef orders:', error);
      if (!silent) {
        setOrders([]);
      }
    } finally {
      if (!silent) {
        setOrdersLoading(false);
      }
    }
  };

  const fetchChefTeam = async () => {
    if (!activeCafeId) {
      setChefTeam([]);
      return;
    }

    try {
      setTeamLoading(true);
      const response = await fetch(`http://localhost:8081/api/staff/cafe/${activeCafeId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch staff');
      }

      const data = await response.json();
      const team = Array.isArray(data)
        ? data.filter((member) => {
            const role = normalizeRole(member.role);
            return role === 'chef';
          })
        : [];
      setChefTeam(team);
    } catch (error) {
      console.error('Failed to fetch chef team:', error);
      setChefTeam([]);
    } finally {
      setTeamLoading(false);
    }
  };

  useEffect(() => {
    if (!activeCafeId) {
      setCafeName(currentUser?.cafeName || '');
      return undefined;
    }

    let cancelled = false;
    fetch(`http://localhost:8081/api/cafe/${activeCafeId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) {
          setCafeName(data?.cafeName || currentUser?.cafeName || `Cafe #${activeCafeId}`);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCafeName(currentUser?.cafeName || `Cafe #${activeCafeId}`);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeCafeId, currentUser?.cafeName]);

  useEffect(() => {
    ensureDefaultRecipes();
    fetchOrders();
    fetchChefTeam();
    const interval = setInterval(() => fetchOrders({ silent: true }), 12000);
    return () => clearInterval(interval);
  }, [activeCafeId]);

  useEffect(() => {
    loadChefAlerts();
    const handleAlertsChanged = () => loadChefAlerts();
    window.addEventListener('staffHelpAlertsChanged', handleAlertsChanged);
    return () => window.removeEventListener('staffHelpAlertsChanged', handleAlertsChanged);
  }, [orders, activeCafeId, chefId]);

  /* ==========================================================
     ORDER STATUS UPDATE HANDLERS
     ========================================================== */
  const handleUpdateOrderStatus = async (orderId, newStatus, assignToCurrentChef = false) => {
    const targetOrder = orders.find((order) => order.id === orderId);
    const params = new URLSearchParams({ status: newStatus });

    if (assignToCurrentChef && chefId) {
      params.set('assignedChefId', String(chefId));
      params.set('assignedChefName', staffName);
    }

    const response = await fetch(`http://localhost:8081/api/orders/${orderId}/status?${params.toString()}`, {
      method: 'PUT',
    });

    if (!response.ok) {
      return;
    }

    const updatedOrder = normalizeOrder(await response.json());
    setOrders((prevOrders) =>
      prevOrders.map((order) => (order.id === orderId ? updatedOrder : order))
    );

    if (newStatus === 'Ready' && targetOrder) {
      try {
        const notifications = JSON.parse(localStorage.getItem('waiter_notifications') || '[]');
        notifications.push({
          id: Date.now(),
          orderId: targetOrder.id,
          table: targetOrder.table,
          message: `Order for Table ${targetOrder.table} is ready to serve!`,
          status: 'unread',
          timestamp: Date.now(),
        });
        localStorage.setItem('waiter_notifications', JSON.stringify(notifications));
      } catch (err) {
        console.error('Failed to notify waiter:', err);
      }
    }
  };

  const isOrderAssignedToCurrentChef = (order) => {
    if (!chefId || order?.assignedChefId == null) {
      return false;
    }

    return Number(order.assignedChefId) === chefId;
  };

  const renderOrderActionButton = (order) => {
    const isAssignedToCurrentChef = isOrderAssignedToCurrentChef(order);

    if (order.status === 'Pending') {
      return (
        <button
          type="button"
          onClick={() => handleUpdateOrderStatus(order.id, 'Preparing', true)}
          className="action-button action-button-primary preparing"
        >
          {isAssignedToCurrentChef ? 'Continue Preparing' : 'Start Preparing'}
        </button>
      );
    }

    if (order.status === 'Preparing') {
      if (isAssignedToCurrentChef) {
        return (
          <button
            type="button"
            onClick={() => handleUpdateOrderStatus(order.id, 'Ready')}
            className="action-button action-button-primary ready"
          >
            Mark Ready
          </button>
        );
      }

      return (
        <button
          type="button"
          className="action-button disabled"
          disabled
        >
          In Progress by {order.assignedChefName || 'Another Chef'}
        </button>
      );
    }

    return null;
  };

  const renderOrderItems = (order) => (
    <div className="order-items">
      <div className="order-items-title">Items to Prepare</div>
      {(order.items || []).map((item, index) => {
        const name = item?.name || '';
        if (!name) return null;

        return (
          <div key={`${order.id}-${index}`} className="order-item-row" style={{ display: 'block' }}>
            <span className="order-item-name" style={{ fontWeight: '500' }}>
              {name} x{item.quantity ?? 1}
            </span>
          </div>
        );
      })}
    </div>
  );

  const renderOrderCard = (order, options = {}) => {
    const {
      showChef = false,
      showImage = true,
      maxWidth = undefined,
      showAction = true,
    } = options;
    const actionButton = showAction ? renderOrderActionButton(order) : null;

    return (
      <div
        key={options.cardKey || `order-${order.id}`}
        className={`order-card ${String(order.status || '').toLowerCase()}`}
        style={maxWidth ? { marginBottom: 12, maxWidth } : undefined}
      >
        <div className="order-card-layout">
          <div className="order-card-content">
            <div className="order-card-header">
              <h5 style={{ margin: 0 }}>{formatOrderTableLabel(order.table)}</h5>
            </div>
            <p>Status: {order.status}</p>
            {showChef && <p>Chef: {order.assignedChefName || 'Not assigned'}</p>}
            {renderOrderItems(order)}
            {actionButton && (
              <div className="order-actions order-actions-bottom order-actions-fullwidth">
                {actionButton}
              </div>
            )}
          </div>
          {showImage && (
            <div className="order-card-media">
              <img
                src={getTableImage(order.table)}
                alt="Table"
                style={{ width: '120px', height: '120px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #d2b48c' }}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const sortedOrders = [...orders].sort((a, b) => {
    return a.timestamp - b.timestamp;
  });

  const newOrders = sortedOrders.filter((order) => order.status === 'Pending');
  const preparingOrders = sortedOrders.filter((order) => order.status === 'Preparing');
  const readyOrders = sortedOrders.filter((order) => order.status === 'Ready');

  const filteredOrders = orderFilter === 'in_progress'
    ? preparingOrders
    : orderFilter === 'completed'
      ? readyOrders
      : newOrders;

  const getKitchenStatus = () => {
    const total = orders.length;
    const newCount = orders.filter((order) => order.status === 'Pending').length;
    const prepCount = orders.filter((order) => order.status === 'Preparing').length;
    const readyCount = orders.filter((order) => order.status === 'Ready').length;
    return { total, newCount, prepCount, readyCount };
  };

  const kitchenSnapshot = getKitchenStatus();

  return (
    <div className="chef-layout">
      <div className="chef-sidebar" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div className="chef-topbar" />
        <h2 style={{ margin: '8px 0 12px 2px', color: '#fff' }}>☕ Chef Panel</h2>
        <div className="chef-user-card">
          <p className="chef-user-label">Logged In Staff</p>
          <h3>{staffName}</h3>
          <span>{cafeName || (activeCafeId ? `Cafe #${activeCafeId}` : 'Cafe not linked')}</span>
        </div>
        <div className="chef-nav">
          <button
            className={`chef-nav-item ${activeTab === 'orders' && orderFilter === 'all' ? 'active' : ''}`}
            onClick={() => { setActiveTab('orders'); setOrderFilter('all'); }}
          >
            <span className="chef-nav-icon">🍽</span>
            <span>Orders</span>
          </button>
          <button
            className={`chef-nav-item ${activeTab === 'orders' && orderFilter === 'in_progress' ? 'active' : ''}`}
            onClick={() => { setActiveTab('orders'); setOrderFilter('in_progress'); }}
          >
            <span className="chef-nav-icon">⏳</span>
            <span>In Progress</span>
          </button>
          <button
            className={`chef-nav-item ${activeTab === 'orders' && orderFilter === 'completed' ? 'active' : ''}`}
            onClick={() => { setActiveTab('orders'); setOrderFilter('completed'); }}
          >
            <span className="chef-nav-icon">✅</span>
            <span>Completed</span>
          </button>
          <button className={`chef-nav-item ${activeTab === 'recipes' ? 'active' : ''}`} onClick={() => setActiveTab('recipes')}>
            <span className="chef-nav-icon">📖</span>
            <span>Recipes</span>
          </button>
          <button className={`chef-nav-item ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveTab('alerts')}>
            <span className="chef-nav-icon">🔔</span>
            <span>Alerts</span>
          </button>
          <button className={`chef-nav-item ${activeTab === 'status' ? 'active' : ''}`} onClick={() => setActiveTab('status')}>
            <span className="chef-nav-icon">📊</span>
            <span>Kitchen Status</span>
          </button>
          <button className={`chef-nav-item ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>
            <span className="chef-nav-icon">👥</span>
            <span>Team</span>
          </button>
          <button
            className="chef-nav-item"
            onClick={() => {
              clearActiveSession();
              navigate('/login');
            }}
          >
            <span className="chef-nav-icon">↩</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
      <div
        className="chef-content"
        data-endpoints={JSON.stringify(chefEndpoints)}
      >
        <section className="chef-shell-hero">
          <div className="chef-shell-copy">
            <p className="chef-shell-eyebrow">Kitchen Command Center</p>
            <h2>Chef Dashboard</h2>
            <p className="chef-shell-text">
              Track live orders, move drinks through preparation, keep recipes close at hand,
              and coordinate the kitchen team without losing speed during service.
            </p>
          </div>
          <div className="chef-shell-metrics">
            <div className="chef-shell-metric-card">
              <span>New Queue</span>
              <strong>{kitchenSnapshot.newCount}</strong>
            </div>
            <div className="chef-shell-metric-card">
              <span>Preparing</span>
              <strong>{kitchenSnapshot.prepCount}</strong>
            </div>
            <div className="chef-shell-metric-card">
              <span>Ready to Serve</span>
              <strong>{kitchenSnapshot.readyCount}</strong>
            </div>
            <div className="chef-shell-metric-card">
              <span>Total Orders</span>
              <strong>{kitchenSnapshot.total}</strong>
            </div>
          </div>
        </section>

        <div className="chef-dashboard">
          {activeTab === 'orders' && (
            <div className="order-queue-section">
              <div className="chef-section-header">
                <div>
                  <p className="chef-section-label">Service Flow</p>
                  <h4>Live Order Queue</h4>
                </div>
                <div className="chef-section-chip">
                  {orderFilter === 'all' ? 'New Orders' : orderFilter === 'in_progress' ? 'Preparing Now' : 'Ready to Serve'}
                </div>
              </div>
              {ordersLoading && <p style={{ color: '#6f4e37' }}>Loading orders...</p>}
              {orderFilter === 'all' && (
                <div className="order-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {filteredOrders.length === 0 ? (
                    <p style={{ color: '#6f4e37' }}>No active orders</p>
                  ) : (
                    filteredOrders.map((order) => renderOrderCard(order, {
                      cardKey: `order-${order.id}`,
                      showAction: true,
                    }))
                  )}
                </div>
              )}
              {orderFilter === 'in_progress' && (
                <div>
                  <div className="order-column-title">Preparing</div>
                  {filteredOrders.length === 0 ? (
                    <div className="empty-state">No orders</div>
                  ) : (
                    <div className="order-list chef-progress-grid">
                      {filteredOrders.map((order) =>
                        renderOrderCard(order, {
                          cardKey: `col-prep-${order.id}`,
                          showChef: true,
                          showAction: true,
                        })
                      )}
                    </div>
                  )}
                </div>
              )}
              {orderFilter === 'completed' && (
                <div>
                  <div className="order-column-title">Ready to Serve</div>
                  {filteredOrders.length === 0 ? (
                    <div className="empty-state">No orders</div>
                  ) : (
                    <div className="order-list chef-progress-grid">
                      {filteredOrders.map((order) =>
                        renderOrderCard(order, {
                          cardKey: `col-ready-${order.id}`,
                          showChef: true,
                          showAction: false,
                        })
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="recipe-management-section">
              <div className="chef-section-header">
                <div>
                  <p className="chef-section-label">Notifications</p>
                  <h4>Alerts</h4>
                </div>
                <div className="chef-section-chip">{alerts.length} active</div>
              </div>
              {alerts.length === 0 ? (
                <p style={{ color: '#6f4e37' }}>No alerts.</p>
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
              <div style={{ marginTop: 10, color: '#6f4e37' }}>Total Alerts: {alerts.length}</div>
            </div>
          )}

          {activeTab === 'status' && (
            <div className="recipe-management-section">
              <div className="chef-section-header">
                <div>
                  <p className="chef-section-label">Performance</p>
                  <h4>Kitchen Status</h4>
                </div>
                <div className="chef-section-chip">{kitchenSnapshot.total} tracked orders</div>
              </div>
              {(() => {
                const s = getKitchenStatus();
                const totalPct = s.total ? 100 : 0;
                const newPct = s.total ? Math.round((s.newCount / s.total) * 100) : 0;
                const prepPct = s.total ? Math.round((s.prepCount / s.total) * 100) : 0;
                const readyPct = s.total ? Math.round((s.readyCount / s.total) * 100) : 0;
                return (
                  <div className="status-grid">
                    <div className="status-card">
                      <h5>Total Orders</h5>
                      <div className="status-value">{s.total}</div>
                      <div className="status-bar"><div className="status-bar-fill" style={{ width: `${totalPct}%` }} /></div>
                    </div>
                    <div className="status-card">
                      <h5>New</h5>
                      <div className="status-value">{s.newCount}</div>
                      <div className="status-bar"><div className="status-bar-fill" style={{ width: `${newPct}%` }} /></div>
                    </div>
                    <div className="status-card">
                      <h5>In Progress</h5>
                      <div className="status-value">{s.prepCount}</div>
                      <div className="status-bar"><div className="status-bar-fill" style={{ width: `${prepPct}%` }} /></div>
                    </div>
                    <div className="status-card">
                      <h5>Completed</h5>
                      <div className="status-value">{s.readyCount}</div>
                      <div className="status-bar"><div className="status-bar-fill" style={{ width: `${readyPct}%` }} /></div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'team' && (
            <div className="recipe-management-section">
              <div className="team-header">
                <div>
                  <p className="chef-section-label">People</p>
                  <h4>Team</h4>
                </div>
                <button className="view-btn" onClick={() => openChefManage(null)}>Add Member</button>
              </div>
              <div className="team-section">
                <table className="team-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Qualification</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamLoading && (
                      <tr>
                        <td colSpan="6">Loading team...</td>
                      </tr>
                    )}
                    {!teamLoading && chefTeam.length === 0 && (
                      <tr>
                        <td colSpan="6">No chefs found for this cafe.</td>
                      </tr>
                    )}
                    {!teamLoading && chefTeam.map((m, idx) => (
                      <tr key={`${m.name}-${idx}`}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <img className="team-avatar" src="https://via.placeholder.com/64x64?text=Photo" alt={m.name} />
                            <span className="team-name">{m.name}</span>
                          </div>
                        </td>
                        <td>{m.role}</td>
                        <td>{m.email}</td>
                        <td>{m.phone}</td>
                        <td>{m.qualifications || '-'}</td>
                        <td>
                          <button className="view-btn" onClick={() => openChefManage(m)}>Manage</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {chefShowManage && (
            <div className="team-modal-overlay" onClick={() => { setChefShowManage(false); setChefEditMember(null); }}>
              <div className="team-modal" onClick={(e) => e.stopPropagation()}>
                <h4 style={{ marginTop: 0 }}>{chefEditMember ? 'Manage Team Member' : 'Add Team Member'}</h4>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Name</label>
                    <input type="text" value={cName} onChange={(e) => setCName(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Role</label>
                    <select value={cRole} onChange={(e) => setCRole(e.target.value)}>
                      <option>Chef</option>
                      <option>Waiter</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Email</label>
                    <input type="text" value={cEmail} onChange={(e) => setCEmail(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Phone</label>
                    <input type="text" value={cPhone} onChange={(e) => setCPhone(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Gender</label>
                    <input type="text" value={cGender} onChange={(e) => setCGender(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Address</label>
                    <input type="text" value={cAddress} onChange={(e) => setCAddress(e.target.value)} />
                  </div>
                  <div className="form-field" style={{ gridColumn: '1 / span 2' }}>
                    <label>Qualification</label>
                    <input type="text" value={cQualification} onChange={(e) => setCQualification(e.target.value)} />
                  </div>
                  <div className="form-field" style={{ gridColumn: '1 / span 2' }}>
                    <label>{chefEditMember ? 'Password (leave blank to keep current)' : 'Password'}</label>
                    <input type="password" value={cPassword} onChange={(e) => setCPassword(e.target.value)} />
                  </div>
                </div>
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button className="view-btn" onClick={saveChefMember}>Save</button>
                  <button className="view-btn" onClick={() => { setChefShowManage(false); setChefEditMember(null); }}>Cancel</button>
                  {chefEditMember && <button className="view-btn" onClick={() => deleteChefMember(chefEditMember.id)}>Delete</button>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'recipes' && (
            <div className="recipe-management-section">
              <div className="chef-section-header">
                <div>
                  <p className="chef-section-label">Recipe Library</p>
                  <h4>Recipe Management & Lookup</h4>
                </div>
                <div className="chef-section-chip">{filteredRecipes.length} visible</div>
              </div>
              <div className="recipe-toolbar">
                <input
                  type="text"
                  placeholder="Search recipes by name or ingredient..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="recipe-search-input"
                />
                <button onClick={openNewRecipe} className="btn-coffee btn-compact btn-equal">Add Recipes</button>
              </div>
              {showRecipeForm && (
                <div className="recipe-modal-overlay" onClick={() => { setShowRecipeForm(false); setEditingRecipeId(null); }}>
                  <div className="recipe-modal" onClick={(e) => e.stopPropagation()}>
                    <h5 style={{ marginTop: 0 }}>{editingRecipeId ? 'Edit Recipe' : 'Add Recipe'}</h5>
                    <div className="form-grid">
                      <div className="form-field">
                        <label>Name</label>
                        <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g., Latte" />
                      </div>
                      <div className="form-field">
                        <label>Ingredients</label>
                        <textarea rows="3" value={formIngredients} onChange={(e) => setFormIngredients(e.target.value)} placeholder="Comma separated" />
                      </div>
                      <div className="form-field" style={{ gridColumn: '1 / span 2' }}>
                        <label>Instructions</label>
                        <textarea rows="3" value={formInstructions} onChange={(e) => setFormInstructions(e.target.value)} />
                      </div>
                      <div className="form-field" style={{ gridColumn: '1 / span 2' }}>
                        <label>Image URL (optional)</label>
                        <input value={formImageUrl} onChange={(e) => setFormImageUrl(e.target.value)} placeholder="Leave empty to use default coffee image" />
                      </div>
                    </div>
                    <div className="recipe-actions">
                      <button className="btn-coffee btn-compact btn-equal" onClick={saveRecipe}>Save</button>
                      <button className="btn-coffee btn-compact btn-equal" onClick={() => { setShowRecipeForm(false); setEditingRecipeId(null); }}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}
              <div className="recipe-list">
                {filteredRecipes.length === 0 ? (
                  <p>No recipes found matching your search.</p>
                ) : (
                  filteredRecipes.map((recipe) => (
                    <div key={recipe.id} className="recipe-card">
                      <img
                        className="recipe-thumb"
                        src={recipe.imageUrl || recipeImageMap[recipe.name] || 'https://via.placeholder.com/600x350?text=Recipe'}
                        alt={recipe.name}
                      />
                      <h5>{recipe.name}</h5>
                      <p><strong>Ingredients:</strong> {recipe.ingredients.join(', ')}</p>
                      <p><strong>Instructions:</strong> <span className="recipe-instructions-inline">{String(recipe.instructions || '').replace(/\bProcess:\s*/g, '')}</span></p>
                      <div className="recipe-actions">
                        <button className="btn-coffee btn-compact btn-equal" onClick={() => openEditRecipe(recipe)}>Edit</button>
                        <button className="btn-icon-compact" title="Delete" onClick={() => { if (window.confirm('Are you sure you want to delete this item?')) deleteRecipe(recipe.id); }}>🗑</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {showDeleteConfirm && (
                <div className="top-confirm-overlay" onClick={cancelDelete}>
                  <div className="top-confirm" onClick={(e) => e.stopPropagation()}>
                    <h5 style={{ marginTop: 0 }}>Confirm Delete</h5>
                    <p style={{ color: '#6f4e37' }}>Are you sure you want to delete this recipe?</p>
                    <div className="recipe-actions">
                      <button className="btn-coffee btn-compact btn-equal" onClick={confirmDelete}>Delete</button>
                      <button className="btn-coffee btn-compact btn-equal" onClick={cancelDelete}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChefDashboard;

//         <div className="recipe-list">
//           {filteredRecipes.length === 0 ? (
//             <p>No recipes found matching your search.</p>
//           ) : (
//             filteredRecipes.map((recipe) => (
//               <div key={recipe.id} className="recipe-card">
//                 <h5>{recipe.name}</h5>
//                 <p><strong>Ingredients:</strong> {recipe.ingredients.join(', ')}</p>
//                 <p><strong>Instructions:</strong> {recipe.instructions}</p>
//               </div>
//             ))
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ChefDashboard;





// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import './ChefDashboard.css';
// import './OwnerDashboard.css';

// const ChefDashboard = () => {
//   /* ==========================================================
//      LOCAL STORAGE PERSISTENCE HELPERS
//      ========================================================== */
//   const loadKitchenOrders = () => {
//     try {
//       const raw = localStorage.getItem('kitchen_orders') || '[]';
//       let arr = JSON.parse(raw);
//       if (!Array.isArray(arr)) arr = [];
      
//       // FORCE DEFINITIVE RE-SEED v7000 - Tables 2, 8, 10, 11, 12, 3, 5, 6, 4, 7, 9
//       if (!localStorage.getItem('kitchen_demo_force_reseed_v7000')) {
//         localStorage.removeItem('kitchen_orders');
//         const demo = seedDemoOrders();
//         localStorage.setItem('kitchen_demo_force_reseed_v7000', '1');
//         return demo;
//       }
      
//       // Safety: Filter out any table 17 or above from existing orders
//       return arr.filter(o => o.table < 17);
//     } catch {
//       return [];
//     }
//   };

//   const saveKitchenOrders = (arr) => {
//     try {
//       localStorage.setItem('kitchen_orders', JSON.stringify(arr));
//     } catch {}
//   };
//   /* ==========================================================
//      ORDER SIMULATION & DEMO DATA
//      ========================================================== */
//   const seedDemoOrders = () => {
//     // Definitive Force Seed v7000 - Tables 2, 8, 10, 11, 12, 3, 5, 6, 4, 7, 9
//     const now = Date.now();
//     const coffeeItems = ['Latte', 'Espresso', 'Cappuccino', 'Americano', 'Mocha', 'Flat White', 'Macchiato', 'Cold Brew'];
//     const priorities = ['high', 'medium', 'low'];
//     const tablesBelow17 = [2, 8, 10, 11, 12, 3, 5, 6, 4, 7, 9];
    
//     const demo = [];
//     // Generating exactly 11 specific table orders strictly below table 17
//     for (let i = 0; i < tablesBelow17.length; i++) {
//       const randomCoffee = coffeeItems[Math.floor(Math.random() * coffeeItems.length)];
//       const randomPriority = priorities[Math.floor(Math.random() * priorities.length)];
      
//       demo.push({
//         id: 177262190000 + i,
//         table: tablesBelow17[i], // Tables 2, 8, 10, 11, 12, 3, 5, 6, 4, 7, 9
//         items: [randomCoffee], // ONLY one coffee item, NO CROISSANTS
//         status: 'New',
//         timestamp: now - (i * 2 * 60 * 1000),
//         priority: randomPriority
//       });
//     }
    
//     saveKitchenOrders(demo);
//     return demo;
//   };

//   const tableImages = [
//     'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=150&h=150&q=60',
//     'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=150&h=150&q=60',
//     'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=150&h=150&q=60',
//     'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=150&h=150&q=60',
//     'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=150&h=150&q=60',
//     'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=150&h=150&q=60'
//   ];

//   const getTableImage = (tableNum) => {
//     return tableImages[tableNum % tableImages.length];
//   };

//   const [orders, setOrders] = useState(() => loadKitchenOrders());

//   /* ==========================================================
//      RECIPE DATA & STATE
//      ========================================================== */
//   const allowedCoffeeNames = ['Espresso','Latte','Cappuccino','Americano','Mocha','Flat White','Macchiato','Cold Brew'];
//   const defaultCoffeeRecipes = [
//     { id: 1, name: 'Espresso', ingredients: ['Finely Ground Coffee', 'Hot Water'], instructions: 'Ingredients: Finely ground coffee and hot water.\nTamp firmly and extract under high pressure.' },
//     { id: 2, name: 'Latte', ingredients: ['Espresso', 'Steamed Milk', 'Foam'], instructions: 'Ingredients: Espresso, steamed milk, and light foam.\nPour steamed milk over espresso and finish with a small foam cap.' },
//     { id: 3, name: 'Cappuccino', ingredients: ['Espresso', 'Steamed Milk', 'Thick Foam'], instructions: 'Ingredients: Espresso, milk, and thick foam.\nLayer equal parts espresso, steamed milk, and thick foam.' },
//     { id: 4, name: 'Americano', ingredients: ['Espresso', 'Hot Water'], instructions: 'Ingredients: Espresso and hot water.\nBrew espresso and dilute with hot water to taste.' },
//     { id: 5, name: 'Mocha', ingredients: ['Espresso', 'Steamed Milk', 'Chocolate'], instructions: 'Ingredients: Espresso, chocolate syrup, and steamed milk.\nMix chocolate with espresso; top with steamed milk.' },
//     { id: 6, name: 'Flat White', ingredients: ['Espresso', 'Steamed Milk'], instructions: 'Ingredients: Espresso and microfoam milk.\nAdd velvety microfoam milk over ristretto espresso.' },
//     { id: 7, name: 'Macchiato', ingredients: ['Espresso', 'Foamed Milk'], instructions: 'Ingredients: Espresso and a spoon of foam.\n“Mark” the espresso with a dollop of milk foam.' },
//     { id: 8, name: 'Cold Brew', ingredients: ['Coarse Coffee', 'Cold Water'], instructions: 'Ingredients: Coarse coffee and cold water.\nSteep 12–24 hours, strain, and serve over ice.' },
//   ];
//   const [recipes, setRecipes] = useState(() => {
//     try {
//       const raw = localStorage.getItem('chef_recipes') || '[]';
//       const arr = JSON.parse(raw);
//       return Array.isArray(arr) && arr.length > 0 ? arr : defaultCoffeeRecipes;
//     } catch {
//       return defaultCoffeeRecipes;
//     }
//   });

//   const [searchTerm, setSearchTerm] = useState('');
//   const [activeTab, setActiveTab] = useState('orders');
//   const navigate = useNavigate();
//   const [orderFilter, setOrderFilter] = useState('all'); // all | in_progress | completed
//   const [alerts, setAlerts] = useState([]);
//   /* ==========================================================
//      CHEF TEAM MANAGEMENT STATE
//      ========================================================== */
//   const [chefTeam, setChefTeam] = useState(() => {
//     try {
//       const raw = localStorage.getItem('chef_team') || '[]';
//       const arr = JSON.parse(raw);
//       if (Array.isArray(arr) && arr.length > 0) return arr;
//     } catch {}
//     return [
//       { id: 1, name: 'Amit', email: 'amit@cafe.com', phone: '9876500006', points: 18, shift: 'Morning', avatar: 'https://i.pravatar.cc/64?img=21' },
//       { id: 2, name: 'Neha', email: 'neha@cafe.com', phone: '9876500007', points: 22, shift: 'Night', avatar: 'https://i.pravatar.cc/64?img=35' },
//       { id: 3, name: 'Sanjay', email: 'sanjay@cafe.com', phone: '9876500008', points: 16, shift: 'Evening', avatar: 'https://i.pravatar.cc/64?img=27' },
//       { id: 4, name: 'Ritika', email: 'ritika@cafe.com', phone: '9876500009', points: 19, shift: 'Morning', avatar: 'https://i.pravatar.cc/64?img=49' },
//       { id: 5, name: 'Kunal', email: 'kunal@cafe.com', phone: '9876500010', points: 17, shift: 'Evening', avatar: 'https://i.pravatar.cc/64?img=14' },
//       { id: 6, name: 'Megha', email: 'megha@cafe.com', phone: '9876500011', points: 21, shift: 'Night', avatar: 'https://i.pravatar.cc/64?img=31' },
//       { id: 7, name: 'Arjun', email: 'arjun@cafe.com', phone: '9876500012', points: 20, shift: 'Morning', avatar: 'https://i.pravatar.cc/64?img=9' },
//       { id: 8, name: 'Pooja', email: 'pooja@cafe.com', phone: '9876500013', points: 15, shift: 'Evening', avatar: 'https://i.pravatar.cc/64?img=57' },
//       { id: 9, name: 'Vikram', email: 'vikram@cafe.com', phone: '9876500014', points: 23, shift: 'Night', avatar: 'https://i.pravatar.cc/64?img=42' },
//     ];
//   });
//   const [chefShowManage, setChefShowManage] = useState(false);
//   const [chefEditMember, setChefEditMember] = useState(null);
//   const [cName, setCName] = useState('');
//   const [cEmail, setCEmail] = useState('');
//   const [cPhone, setCPhone] = useState('');
//   const [cPoints, setCPoints] = useState('');
//   const [cShift, setCShift] = useState('Morning');
//   const [cAvatar, setCAvatar] = useState('');
//   const handleChefPhotoFile = (e) => {
//     const file = e.target.files && e.target.files[0];
//     if (!file) return;
//     const reader = new FileReader();
//     reader.onload = () => {
//       setCAvatar(String(reader.result || ''));
//     };
//     reader.readAsDataURL(file);
//   };
//   const saveChefTeam = (list) => {
//     setChefTeam(list);
//     try { localStorage.setItem('chef_team', JSON.stringify(list)); } catch {}
//   };
//   const openChefManage = (member) => {
//     setChefEditMember(member || null);
//     setCName(member ? member.name : '');
//     setCEmail(member ? member.email : '');
//     setCPhone(member ? member.phone : '');
//     setCPoints(member ? String(member.points || '') : '');
//     setCShift(member ? member.shift : 'Morning');
//     setCAvatar(member ? member.avatar || '' : '');
//     setChefShowManage(true);
//   };
//   const saveChefMember = () => {
//     const nm = cName.trim();
//     if (!nm) return;
//     const obj = { id: chefEditMember ? chefEditMember.id : Date.now(), name: nm, email: cEmail.trim(), phone: cPhone.trim(), points: Number(cPoints || 0), shift: cShift, avatar: cAvatar.trim() };
//     if (chefEditMember) {
//       const next = chefTeam.map(t => t.id === chefEditMember.id ? obj : t);
//       saveChefTeam(next);
//     } else {
//       saveChefTeam([obj, ...chefTeam]);
//     }
//     setChefShowManage(false);
//     setChefEditMember(null);
//   };
//   const deleteChefMember = (id) => {
//     saveChefTeam(chefTeam.filter(t => t.id !== id));
//     setChefShowManage(false);
//     setChefEditMember(null);
//   };
//   const itemImageMap = {
//     'Espresso': 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=300&q=60',
//     'Latte': 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=300&q=60',
//     'Cappuccino': 'https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=300&q=60',
//     'Americano': 'https://images.unsplash.com/photo-1461988091159-192b6df7054f?auto=format&fit=crop&w=300&q=60',
//     'Muffin': 'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?auto=format&fit=crop&w=300&q=60',
//     'Orange Juice': 'https://images.unsplash.com/photo-1571078321249-cd7bcb9c05b0?auto=format&fit=crop&w=300&q=60',
//     'Blueberry Scone': 'https://images.unsplash.com/photo-1543339501-355b83f593b0?auto=format&fit=crop&w=300&q=60'
//   };
//   const itemPriceMap = {
//     'Espresso': 2.5,
//     'Latte': 4.0,
//     'Cappuccino': 4.0,
//     'Americano': 3.0,
//     'Mocha': 4.5,
//     'Flat White': 4.0,
//     'Macchiato': 3.5,
//     'Cold Brew': 3.5,
//     'Muffin': 3.0,
//     'Orange Juice': 3.0,
//     'Blueberry Scone': 3.5
//   };
//   const chefEndpoints = {
//     base: '/api',
//     orders: '/api/chef/orders',
//     orderById: '/api/chef/orders/:id',
//     updateOrderStatus: '/api/chef/orders/:id/status',
//     recipes: '/api/chef/recipes',
//     recipeById: '/api/chef/recipes/:id',
//     team: '/api/chef/team',
//     teamMemberById: '/api/chef/team/:id',
//     alerts: '/api/chef/alerts'
//   };
//   const recipeImageMap = {
//     'Espresso': 'https://easternshorecoffee.com/wp-content/uploads/2018/10/espresso-bg.jpg',
//     'Latte': 'https://www.foodandwine.com/thmb/CCe2JUHfjCQ44L0YTbCu97ukUzA=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/Partners-Latte-FT-BLOG0523-09569880de524fe487831d95184495cc.jpg',
//     'Cappuccino': 'https://www.clarin.com/img/2022/03/01/capuchino-delicioso-y-facil-de___ceq4FUBv9_2000x1500__1.jpg',
//     'Americano': 'https://koala.sh/api/image/v2-2lv85-27k9e.jpg?width=1216&height=832&dream',
//     'Mocha': 'https://caphenguyenchat.vn/wp-content/uploads/2023/03/Mocha-1fc71f7-1280x806.png',
//     'Flat White': 'http://coffeeandkin.co.uk/wp-content/uploads/2018/06/Flat-white.jpeg',
//     'Macchiato': 'https://suddencoffee.com/wp-content/uploads/2024/05/macchiato-image.jpg',
//     'Cold Brew': 'https://starbmag.com/wp-content/uploads/2022/01/Cold-brewed-coffee.png',
//     'Blueberry Scone': 'https://images.unsplash.com/photo-1517244683847-7456b63c5969?auto=format&fit=crop&w=400&q=60'
//   };

//   const filteredRecipes = recipes.filter(recipe =>
//     recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(searchTerm.toLowerCase()))
//   );

//   const [showRecipeForm, setShowRecipeForm] = useState(false);
//   const [editingRecipeId, setEditingRecipeId] = useState(null);
//   const [formName, setFormName] = useState('');
//   const [formIngredients, setFormIngredients] = useState('');
//   const [formInstructions, setFormInstructions] = useState('');
//   const [formImageUrl, setFormImageUrl] = useState('');
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
//   const [deleteTargetId, setDeleteTargetId] = useState(null);

//   const ensureDefaultRecipes = () => {
//     const names = new Set(recipes.map(r => r.name));
//     const missing = defaultCoffeeRecipes.filter(r => !names.has(r.name));
//     if (missing.length > 0) {
//       const next = [...recipes, ...missing];
//       setRecipes(next);
//       saveRecipesStorage(next);
//     }
//   };

//   const openNewRecipe = () => {
//     setEditingRecipeId(null);
//     setFormName('');
//     setFormIngredients('');
//     setFormInstructions('');
//     setFormImageUrl('');
//     setShowRecipeForm(true);
//   };

//   const openEditRecipe = (r) => {
//     setEditingRecipeId(r.id);
//     setFormName(r.name);
//     setFormIngredients(r.ingredients.join(', '));
//     setFormInstructions(r.instructions);
//     setFormImageUrl(r.imageUrl || '');
//     setShowRecipeForm(true);
//   };
//   const openDeleteConfirm = (id) => {
//     setDeleteTargetId(id);
//     setShowDeleteConfirm(true);
//   };
//   const confirmDelete = () => {
//     if (deleteTargetId != null) deleteRecipe(deleteTargetId);
//     setShowDeleteConfirm(false);
//     setDeleteTargetId(null);
//   };
//   const cancelDelete = () => {
//     setShowDeleteConfirm(false);
//     setDeleteTargetId(null);
//   };

//   const saveRecipesStorage = (list) => {
//     try {
//       localStorage.setItem('chef_recipes', JSON.stringify(list));
//     } catch {}
//   };

//   const saveRecipe = () => {
//     const name = (formName || '').trim();
//     const ing = (formIngredients || '').split(',').map(s => s.trim()).filter(Boolean);
//     const instr = (formInstructions || '').trim();
//     if (!name || ing.length === 0 || !instr) return;
//     if (!allowedCoffeeNames.includes(name)) return;
//     const img = (formImageUrl || '').trim();
//     if (!img && !recipeImageMap[name]) return;
//     if (editingRecipeId) {
//       const next = recipes.map(r => r.id === editingRecipeId ? { ...r, name, ingredients: ing, instructions: instr, imageUrl: img || undefined } : r);
//       setRecipes(next);
//       saveRecipesStorage(next);
//     } else {
//       const id = Date.now();
//       const next = [{ id, name, ingredients: ing, instructions: instr, imageUrl: img || undefined }, ...recipes];
//       setRecipes(next);
//       saveRecipesStorage(next);
//     }
//     setShowRecipeForm(false);
//     setEditingRecipeId(null);
//   };

//   const deleteRecipe = (id) => {
//     const next = recipes.filter(r => r.id !== id);
//     setRecipes(next);
//     saveRecipesStorage(next);
//   };

//   useEffect(() => {
//     ensureDefaultRecipes();
//     // FORCE DEFINITIVE RE-SEED v12 - ABSOLUTELY CLEAR AND REFILL
//     if (!localStorage.getItem('kitchen_demo_force_reseed_v12')) {
//       localStorage.clear(); // Clear EVERYTHING to be 100% sure
//       seedDemoOrders();
//       localStorage.setItem('kitchen_demo_force_reseed_v12', '1');
//     }
//     const interval = setInterval(() => {
//       let raw = loadKitchenOrders();
//       if (raw.length === 0) {
//         seedDemoOrders();
//         raw = loadKitchenOrders();
//       }
//       let mutated = false;
//       const estMs = 10 * 60 * 1000;
//       const latest = raw.map(o => {
//         const placedAt = o.placedAt || o.timestamp || Date.now();
//         let startedAt = o.startedAt;
//         let readyAt = o.readyAt;
//         if (o.status === 'Preparing' && !startedAt) {
//           startedAt = placedAt + 60 * 1000;
//           mutated = true;
//         }
//         if (o.status === 'Ready' && (!readyAt || readyAt === placedAt)) {
//           readyAt = (o.timestamp && o.timestamp > placedAt) ? o.timestamp : placedAt + estMs;
//           mutated = true;
//         }
//         return {
//           ...o,
//           placedAt,
//           startedAt,
//           readyAt,
//           elapsedTime: Math.floor((Date.now() - placedAt) / 1000),
//         };
//       });
//       if (mutated) {
//         saveKitchenOrders(latest.map(({ elapsedTime, ...rest }) => rest));
//       }
//       setOrders(latest);
//     }, 1000);
//     return () => clearInterval(interval);
//   }, []);

//   useEffect(() => {
//     try {
//       const notifRaw = localStorage.getItem('waiter_notifications') || '[]';
//       const notifs = JSON.parse(notifRaw);
//       setAlerts(Array.isArray(notifs) ? notifs.reverse() : []);
//     } catch {
//       setAlerts([]);
//     }
//   }, [orders]);

//   /* ==========================================================
//      ORDER STATUS UPDATE HANDLERS
//      ========================================================== */
//   const handleUpdateOrderStatus = (orderId, newStatus) => {
//     const updated = orders.map((o) => {
//       if (o.id === orderId) {
//         const timestamp = Date.now();
//         const updatedOrder = { ...o, status: newStatus };
//         if (newStatus === 'Preparing') updatedOrder.startedAt = timestamp;
//         if (newStatus === 'Ready') {
//           updatedOrder.readyAt = timestamp;
//           // Notify Waiter
//           try {
//             const notifications = JSON.parse(localStorage.getItem('waiter_notifications') || '[]');
//             notifications.push({
//               id: Date.now(),
//               orderId: o.id,
//               table: o.table,
//               message: `Order for Table ${o.table} is ready to serve!`,
//               status: 'unread',
//               timestamp: timestamp
//             });
//             localStorage.setItem('waiter_notifications', JSON.stringify(notifications));
//             console.log(`Notification sent to waiter for Table ${o.table}`);
//           } catch (err) {
//             console.error('Failed to notify waiter:', err);
//           }
//         }
//         return updatedOrder;
//       }
//       return o;
//     });
//     setOrders(updated);
//     saveKitchenOrders(updated);
//   };

//   const formatTime = (seconds) => {
//     const minutes = Math.floor(seconds / 60);
//     const remainingSeconds = seconds % 60;
//     return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
//   };

//   const sortedOrders = [...orders].sort((a, b) => {
//     const priorityOrder = { high: 3, medium: 2, low: 1 };
//     if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
//       return priorityOrder[b.priority] - priorityOrder[a.priority];
//     }
//     return a.timestamp - b.timestamp;
//   });

//   const filteredOrders = sortedOrders.filter(o => {
//     if (orderFilter === 'in_progress') return o.status === 'Preparing';
//     if (orderFilter === 'completed') return o.status === 'Ready';
//     return o.status === 'New';
//   });

//   const getKitchenStatus = () => {
//     const total = orders.length;
//     const newCount = orders.filter(o => o.status === 'New').length;
//     const prepCount = orders.filter(o => o.status === 'Preparing').length;
//     const readyCount = orders.filter(o => o.status === 'Ready').length;
//     return { total, newCount, prepCount, readyCount };
//   };
//   const progressPct = (o) => {
//     const base = o.startedAt || o.placedAt || o.timestamp || Date.now();
//     const elapsed = Math.max(0, Date.now() - base);
//     const est = 10 * 60 * 1000;
//     const pct = Math.min(100, Math.floor((elapsed / est) * 100));
//     return pct;
//   };

//   return (
//     <div className="owner-layout">
//       <div className="owner-sidebar" style={{ display: 'flex', flexDirection: 'column', overflowY: 'hidden' }}>
//         <div className="owner-topbar" />
//         <h2 style={{ margin: '8px 0 12px 2px', color: '#fff' }}>☕ Chef Panel</h2>
//         <div className="owner-nav">
//           <button
//             className={`nav-item ${activeTab === 'orders' && orderFilter === 'all' ? 'active' : ''}`}
//             onClick={() => { setActiveTab('orders'); setOrderFilter('all'); }}
//           >
//             <span className="nav-icon">🍽</span>
//             <span>Orders</span>
//           </button>
//           <button
//             className={`nav-item ${activeTab === 'orders' && orderFilter === 'in_progress' ? 'active' : ''}`}
//             onClick={() => { setActiveTab('orders'); setOrderFilter('in_progress'); }}
//           >
//             <span className="nav-icon">⏳</span>
//             <span>In Progress</span>
//           </button>
//           <button
//             className={`nav-item ${activeTab === 'orders' && orderFilter === 'completed' ? 'active' : ''}`}
//             onClick={() => { setActiveTab('orders'); setOrderFilter('completed'); }}
//           >
//             <span className="nav-icon">✅</span>
//             <span>Completed</span>
//           </button>
//           <button className={`nav-item ${activeTab === 'recipes' ? 'active' : ''}`} onClick={() => setActiveTab('recipes')}>
//             <span className="nav-icon">📖</span>
//             <span>Recipes</span>
//           </button>
//           <button className={`nav-item ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveTab('alerts')}>
//             <span className="nav-icon">🔔</span>
//             <span>Alerts</span>
//           </button>
//           <button className={`nav-item ${activeTab === 'status' ? 'active' : ''}`} onClick={() => setActiveTab('status')}>
//             <span className="nav-icon">📊</span>
//             <span>Kitchen Status</span>
//           </button>
//           <button className={`nav-item ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>
//             <span className="nav-icon">👥</span>
//             <span>Team</span>
//           </button>
//           <button
//             className="nav-item"
//             onClick={() => {
//               try {
//                 localStorage.removeItem('auth_token');
//               } catch {}
//               navigate('/login');
//             }}
//           >
//             <span className="nav-icon">↩</span>
//             <span>Logout</span>
//           </button>
//         </div>
//       </div>
//       <div
//         className="owner-content"
//         data-endpoints={JSON.stringify(chefEndpoints)}
//       >
//         <div className="chef-dashboard">
//           {activeTab === 'orders' && (
//             <div className="order-queue-section">
//               <h4>Live Order Queue</h4>
//               {orderFilter === 'all' && (
//                 <div className="order-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
//                   {filteredOrders.length === 0 ? (
//                     <p style={{ color: '#6f4e37' }}>No active orders</p>
//                   ) : (
//                     filteredOrders.map((o) => (
//                       <div
//                         key={`order-${o.id}`}
//                         className={`order-card ${String(o.status || '').toLowerCase()} ${o.priority || 'medium'}`}
//                       >
//                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
//                           <div style={{ flex: 1 }}>
//                             <div className="order-card-header">
//                               <h5 style={{ margin: 0 }}>Table {o.table}</h5>
//                             </div>
//                             <p>Status: {o.status} • Priority: {o.priority || 'medium'}</p>
//                             <p>Placed: {new Date(o.placedAt || o.timestamp).toLocaleTimeString()}</p>
//                             <p>Est. Ready: {new Date(((o.startedAt || o.placedAt || o.timestamp) + 10 * 60 * 1000)).toLocaleTimeString()}</p>
//                             <div className="order-items">
//                               {(o.items || []).map((it, idx) => {
//                                 const n = typeof it === 'string' ? it : it.name;
//                                 const price = itemPriceMap[n] ? `-$${itemPriceMap[n].toFixed(2)}` : '';
//                                 return (
//                                   <div key={idx} className="order-item-row" style={{ display: 'block' }}>
//                                     <span className="order-item-name" style={{ fontWeight: '500' }}>{n}{price}</span>
//                                   </div>
//                                 );
//                               })}
//                             </div>
//                             <div className="order-actions">
//                               <button onClick={() => handleUpdateOrderStatus(o.id, 'Preparing')} className="action-button preparing">
//                                 Start Preparing
//                               </button>
//                             </div>
//                           </div>
//                           <div style={{ marginLeft: '15px' }}>
//                             <img 
//                               src={getTableImage(o.table)} 
//                               alt="Table" 
//                               style={{ width: '120px', height: '120px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #d2b48c' }}
//                             />
//                           </div>
//                         </div>
//                       </div>
//                     ))
//                   )}
//                 </div>
//               )}
//               {orderFilter === 'in_progress' && (
//                 <div 
//                   className="order-columns" 
//                   style={{ 
//                     display: 'grid', 
//                     gap: '20px', 
//                     gridTemplateColumns: 'repeat(2, 1fr)',
//                     alignItems: 'start'
//                   }}
//                 >
//                   {(() => {
//                     const list = filteredOrders.filter((o) => o.status === 'Preparing');
//                     if (list.length === 0) return (
//                       <div className="order-column">
//                         <div className="order-column-title">Preparing</div>
//                         <div className="empty-state">No orders</div>
//                       </div>
//                     );
                    
//                     // Group into 2 columns
//                     const cols = [
//                       list.filter((_, idx) => idx % 2 === 0),
//                       list.filter((_, idx) => idx % 2 === 1)
//                     ];
                    
//                     return cols.map((col, idx) => (
//                       <div key={`prep-col-${idx}`} className="order-column">
//                         <div className="order-column-title">Preparing</div>
//                         {col.length === 0 ? (
//                           <div style={{ visibility: 'hidden', height: '100px' }} />
//                         ) : (
//                           col.map((o) => (
//                             <div
//                               key={`col-prep-${o.id}`}
//                               className={`order-card ${String(o.status || '').toLowerCase()} ${o.priority || 'medium'}`}
//                               style={{ marginBottom: 12, maxWidth: '450px' }}
//                             >
//                               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
//                                 <div style={{ flex: 1 }}>
//                                   <div className="order-card-header">
//                                     <h5 style={{ margin: 0 }}>Table {o.table}</h5>
//                                   </div>
//                                   <p>Status: {o.status} • Priority: {o.priority || 'medium'}</p>
//                                   <p>Est. Ready: {new Date(((o.startedAt || o.placedAt || o.timestamp) + 10 * 60 * 1000)).toLocaleTimeString()}</p>
//                                   <p>
//                                     Time Left: {(() => {
//                                       const base = o.startedAt || o.placedAt || o.timestamp || Date.now();
//                                       const left = Math.max(0, base + 10 * 60 * 1000 - Date.now());
//                                       const m = Math.floor(left / 60000);
//                                       const s = Math.floor((left % 60000) / 1000);
//                                       return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
//                                     })()}
//                                   </p>
//                                   <div style={{ marginTop: 6 }}>
//                                     <div style={{ height: 8, background: '#eee', borderRadius: 6 }}>
//                                       <div style={{ width: `${progressPct(o)}%`, height: 8, background: '#6B4423', borderRadius: 6 }} />
//                                     </div>
//                                     <p style={{ marginTop: 4, color: '#6f4e37' }}>Progress: {progressPct(o)}%</p>
//                                   </div>
//                                   <div className="order-items">
//                                     {(o.items || []).map((it, idx) => {
//                                       const n = typeof it === 'string' ? it : it.name;
//                                       const price = itemPriceMap[n] ? `-$${itemPriceMap[n].toFixed(2)}` : '';
//                                       return (
//                                         <div key={idx} className="order-item-row" style={{ display: 'block' }}>
//                                           <span className="order-item-name" style={{ fontWeight: '500' }}>{n}{price}</span>
//                                         </div>
//                                       );
//                                     })}
//                                   </div>
//                                   <div className="order-actions" style={{ marginTop: 'auto' }}>
//                                     <button onClick={() => handleUpdateOrderStatus(o.id, 'Ready')} className="action-button ready">
//                                       Mark Ready
//                                     </button>
//                                   </div>
//                                 </div>
//                                 <div style={{ marginLeft: '15px' }}>
//                                   <img 
//                                     src={getTableImage(o.table)} 
//                                     alt="Table" 
//                                     style={{ width: '120px', height: '120px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #d2b48c' }}
//                                   />
//                                 </div>
//                               </div>
//                             </div>
//                           ))
//                         )}
//                       </div>
//                     ));
//                   })()}
//                 </div>
//               )}
//               {orderFilter === 'completed' && (
//                 <div 
//                   className="order-columns" 
//                   style={{ 
//                     display: 'grid', 
//                     gap: '20px', 
//                     gridTemplateColumns: 'repeat(2, 1fr)',
//                     alignItems: 'start'
//                   }}
//                 >
//                   {(() => {
//                     const list = filteredOrders.filter((o) => o.status === 'Ready');
//                     if (list.length === 0) return (
//                       <div className="order-column">
//                         <div className="order-column-title">Ready to Serve</div>
//                         <div className="empty-state">No orders</div>
//                       </div>
//                     );
                    
//                     const cols = [
//                       list.filter((_, idx) => idx % 2 === 0),
//                       list.filter((_, idx) => idx % 2 === 1)
//                     ];
                    
//                     return cols.map((col, idx) => (
//                       <div key={`ready-col-${idx}`} className="order-column">
//                         <div className="order-column-title">Ready to Serve</div>
//                         {col.length === 0 ? (
//                           <div style={{ visibility: 'hidden', height: '100px' }} />
//                         ) : (
//                           col.map((o) => (
//                             <div
//                               key={`col-ready-${o.id}`}
//                               className={`order-card ${String(o.status || '').toLowerCase()} ${o.priority || 'medium'}`}
//                               style={{ marginBottom: 12, maxWidth: '450px' }}
//                             >
//                               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
//                                 <div style={{ flex: 1 }}>
//                                   <div className="order-card-header">
//                                     <h5 style={{ margin: 0 }}>Table {o.table}</h5>
//                                   </div>
//                                   <p>Status: {o.status} • Priority: {o.priority || 'medium'}</p>
//                                   <p>Ready at: {new Date(o.readyAt || ((o.placedAt || o.timestamp) + 10 * 60 * 1000)).toLocaleTimeString()}</p>
//                                   <p>Est. Time: 10m</p>
//                                   <div className="order-items">
//                                     {(o.items || []).map((it, idx) => {
//                                       const n = typeof it === 'string' ? it : it.name;
//                                       const price = itemPriceMap[n] ? `-$${itemPriceMap[n].toFixed(2)}` : '';
//                                       return (
//                                         <div key={idx} className="order-item-row" style={{ display: 'block' }}>
//                                           <span className="order-item-name" style={{ fontWeight: '500' }}>{n}{price}</span>
//                                         </div>
//                                       );
//                                     })}
//                                   </div>
//                                 </div>
//                                 <div style={{ marginLeft: '15px' }}>
//                                   <img 
//                                     src={getTableImage(o.table)} 
//                                     alt="Table" 
//                                     style={{ width: '120px', height: '120px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #d2b48c' }}
//                                   />
//                                 </div>
//                               </div>
//                             </div>
//                           ))
//                         )}
//                       </div>
//                     ));
//                   })()}
//                 </div>
//               )}
//             </div>
//           )}

//           {activeTab === 'alerts' && (
//             <div className="recipe-management-section">
//               <h4>Alerts</h4>
//               {alerts.length === 0 ? (
//                 <p style={{ color: '#6f4e37' }}>No alerts.</p>
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
//               <div style={{ marginTop: 10, color: '#6f4e37' }}>Total Alerts: {alerts.length}</div>
//             </div>
//           )}

//           {activeTab === 'status' && (
//             <div className="recipe-management-section">
//               <h4>Kitchen Status</h4>
//               {(() => {
//                 const s = getKitchenStatus();
//                 const totalPct = s.total ? 100 : 0;
//                 const newPct = s.total ? Math.round((s.newCount / s.total) * 100) : 0;
//                 const prepPct = s.total ? Math.round((s.prepCount / s.total) * 100) : 0;
//                 const readyPct = s.total ? Math.round((s.readyCount / s.total) * 100) : 0;
//                 return (
//                   <div className="status-grid">
//                     <div className="status-card">
//                       <h5>Total Orders</h5>
//                       <div className="status-value">{s.total}</div>
//                       <div className="status-bar"><div className="status-bar-fill" style={{ width: `${totalPct}%` }} /></div>
//                     </div>
//                     <div className="status-card">
//                       <h5>New</h5>
//                       <div className="status-value">{s.newCount}</div>
//                       <div className="status-bar"><div className="status-bar-fill" style={{ width: `${newPct}%` }} /></div>
//                     </div>
//                     <div className="status-card">
//                       <h5>In Progress</h5>
//                       <div className="status-value">{s.prepCount}</div>
//                       <div className="status-bar"><div className="status-bar-fill" style={{ width: `${prepPct}%` }} /></div>
//                     </div>
//                     <div className="status-card">
//                       <h5>Completed</h5>
//                       <div className="status-value">{s.readyCount}</div>
//                       <div className="status-bar"><div className="status-bar-fill" style={{ width: `${readyPct}%` }} /></div>
//                     </div>
//                   </div>
//                 );
//               })()}
//             </div>
//           )}

//           {activeTab === 'team' && (
//             <div className="recipe-management-section">
//               <div className="team-header">
//                 <h4>Team</h4>
//                 <button className="view-btn" onClick={() => openChefManage(null)}>Add Member</button>
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
//                     {chefTeam.map((m, idx) => (
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
//                           <button className="view-btn" onClick={() => openChefManage(m)}>Manage</button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           )}
//           {chefShowManage && (
//             <div className="team-modal-overlay" onClick={() => { setChefShowManage(false); setChefEditMember(null); }}>
//               <div className="team-modal" onClick={(e) => e.stopPropagation()}>
//                 <h4 style={{ marginTop: 0 }}>{chefEditMember ? 'Manage Team Member' : 'Add Team Member'}</h4>
//                 <div className="form-grid">
//                   <div className="form-field">
//                     <label>Name</label>
//                     <input type="text" value={cName} onChange={(e) => setCName(e.target.value)} />
//                   </div>
//                   <div className="form-field">
//                     <label>Email</label>
//                     <input type="text" value={cEmail} onChange={(e) => setCEmail(e.target.value)} />
//                   </div>
//                   <div className="form-field">
//                     <label>Phone</label>
//                     <input type="text" value={cPhone} onChange={(e) => setCPhone(e.target.value)} />
//                   </div>
//                   <div className="form-field">
//                     <label>Points</label>
//                     <input type="number" value={cPoints} onChange={(e) => setCPoints(e.target.value)} />
//                   </div>
//                   <div className="form-field">
//                     <label>Shift</label>
//                     <select value={cShift} onChange={(e) => setCShift(e.target.value)}>
//                       <option>Morning</option>
//                       <option>Evening</option>
//                       <option>Night</option>
//                     </select>
//                   </div>
//                   <div className="form-field">
//                     <label>Photo</label>
//                     <div className="photo-preview">
//                       {cAvatar && <img src={cAvatar} alt="Avatar" />}
//                       <input type="file" accept="image/*" onChange={handleChefPhotoFile} />
//                     </div>
//                   </div>
//                 </div>
//                 <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
//                   <button className="view-btn" onClick={saveChefMember}>Save</button>
//                   <button className="view-btn" onClick={() => { setChefShowManage(false); setChefEditMember(null); }}>Cancel</button>
//                   {chefEditMember && <button className="view-btn" onClick={() => deleteChefMember(chefEditMember.id)}>Delete</button>}
//                 </div>
//               </div>
//             </div>
//           )}

//           {activeTab === 'recipes' && (
//             <div className="recipe-management-section">
//               <h4>Recipe Management & Lookup</h4>
//               <div className="recipe-toolbar">
//                 <input
//                   type="text"
//                   placeholder="Search recipes by name or ingredient..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="recipe-search-input"
//                 />
//                 <button onClick={openNewRecipe} className="btn-coffee btn-compact btn-equal">Add Recipes</button>
//               </div>
//               {showRecipeForm && (
//                 <div className="recipe-modal-overlay" onClick={() => { setShowRecipeForm(false); setEditingRecipeId(null); }}>
//                   <div className="recipe-modal" onClick={(e) => e.stopPropagation()}>
//                     <h5 style={{ marginTop: 0 }}>{editingRecipeId ? 'Edit Recipe' : 'Add Recipe'}</h5>
//                     <div className="form-grid">
//                       <div className="form-field">
//                         <label>Name</label>
//                         <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g., Latte" />
//                       </div>
//                       <div className="form-field">
//                         <label>Ingredients</label>
//                         <textarea rows="3" value={formIngredients} onChange={(e) => setFormIngredients(e.target.value)} placeholder="Comma separated" />
//                       </div>
//                       <div className="form-field" style={{ gridColumn: '1 / span 2' }}>
//                         <label>Instructions</label>
//                         <textarea rows="3" value={formInstructions} onChange={(e) => setFormInstructions(e.target.value)} />
//                       </div>
//                       <div className="form-field" style={{ gridColumn: '1 / span 2' }}>
//                         <label>Image URL (optional)</label>
//                         <input value={formImageUrl} onChange={(e) => setFormImageUrl(e.target.value)} placeholder="Leave empty to use default coffee image" />
//                       </div>
//                     </div>
//                     <div className="recipe-actions">
//                       <button className="btn-coffee btn-compact btn-equal" onClick={saveRecipe}>Save</button>
//                       <button className="btn-coffee btn-compact btn-equal" onClick={() => { setShowRecipeForm(false); setEditingRecipeId(null); }}>Cancel</button>
//                     </div>
//                   </div>
//                 </div>
//               )}
//               <div className="recipe-list">
//                 {filteredRecipes.length === 0 ? (
//                   <p>No recipes found matching your search.</p>
//                 ) : (
//                   filteredRecipes.map((recipe) => (
//                     <div key={recipe.id} className="recipe-card">
//                       <img
//                         className="recipe-thumb"
//                         src={recipe.imageUrl || recipeImageMap[recipe.name] || 'https://via.placeholder.com/600x350?text=Recipe'}
//                         alt={recipe.name}
//                       />
//                       <h5>{recipe.name}</h5>
//                       <p><strong>Ingredients:</strong> {recipe.ingredients.join(', ')}</p>
//                       <p><strong>Instructions:</strong> <span className="recipe-instructions-inline">{String(recipe.instructions || '').replace(/\bProcess:\s*/g, '')}</span></p>
//                       <div className="recipe-actions">
//                         <button className="btn-coffee btn-compact btn-equal" onClick={() => openEditRecipe(recipe)}>Edit</button>
//                         <button className="btn-icon-compact" title="Delete" onClick={() => { if (window.confirm('Are you sure you want to delete this item?')) deleteRecipe(recipe.id); }}>🗑</button>
//                       </div>
//                     </div>
//                   ))
//                 )}
//               </div>
//               {showDeleteConfirm && (
//                 <div className="top-confirm-overlay" onClick={cancelDelete}>
//                   <div className="top-confirm" onClick={(e) => e.stopPropagation()}>
//                     <h5 style={{ marginTop: 0 }}>Confirm Delete</h5>
//                     <p style={{ color: '#6f4e37' }}>Are you sure you want to delete this recipe?</p>
//                     <div className="recipe-actions">
//                       <button className="btn-coffee btn-compact btn-equal" onClick={confirmDelete}>Delete</button>
//                       <button className="btn-coffee btn-compact btn-equal" onClick={cancelDelete}>Cancel</button>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ChefDashboard;


// // import React, { useState, useEffect } from 'react';
// // import './ChefDashboard.css';

// // const ChefDashboard = () => {
// //   const [orders, setOrders] = useState([
// //     { id: 1, table: 2, items: ['Latte', 'Croissant'], status: 'Preparing', timestamp: Date.now() - (10 * 60 * 1000), priority: 'medium' }, // 10 minutes ago
// //     { id: 2, table: 5, items: ['Espresso', 'Muffin'], status: 'Ready', timestamp: Date.now() - (5 * 60 * 1000), priority: 'low' }, // 5 minutes ago
// //     { id: 3, table: 1, items: ['Cappuccino', 'Blueberry Scone'], status: 'New', timestamp: Date.now() - (2 * 60 * 1000), priority: 'high' }, // 2 minutes ago
// //     { id: 4, table: 3, items: ['Americano'], status: 'New', timestamp: Date.now() - (1 * 60 * 1000), priority: 'medium' }, // 1 minute ago
// //   ]);

// //   const [recipes, setRecipes] = useState([
// //     { id: 1, name: 'Latte', ingredients: ['Espresso', 'Steamed Milk', 'Foam'], instructions: 'Brew espresso, steam milk, pour milk into espresso, top with foam.' },
// //     { id: 2, name: 'Cappuccino', ingredients: ['Espresso', 'Steamed Milk', 'Thick Foam'], instructions: 'Brew espresso, steam milk to create thick foam, pour milk into espresso, spoon foam on top.' },
// //     { id: 3, name: 'Espresso', ingredients: ['Finely Ground Coffee', 'Hot Water'], instructions: 'Tamp finely ground coffee, extract with hot water under pressure.' },
// //     { id: 4, name: 'Croissant', ingredients: ['Flour', 'Butter', 'Yeast', 'Sugar', 'Salt', 'Water'], instructions: 'Prepare dough, laminate with butter, fold and chill multiple times, shape, proof, and bake.' },
// //     { id: 5, name: 'Blueberry Scone', ingredients: ['Flour', 'Butter', 'Sugar', 'Baking Powder', 'Salt', 'Milk', 'Blueberries'], instructions: 'Mix dry ingredients, cut in butter, add milk and blueberries, form dough, cut, and bake.' },
// //   ]);

// //   const [searchTerm, setSearchTerm] = useState('');

// //   const filteredRecipes = recipes.filter(recipe =>
// //     recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
// //     recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(searchTerm.toLowerCase()))
// //   );

// //   useEffect(() => {
// //     const interval = setInterval(() => {
// //       setOrders(prevOrders =>
// //         prevOrders.map(order => ({
// //           ...order,
// //           elapsedTime: Math.floor((Date.now() - order.timestamp) / 1000), // in seconds
// //         }))
// //       );
// //     }, 1000);
// //     return () => clearInterval(interval);
// //   }, []);

// //   const handleUpdateOrderStatus = (id, newStatus) => {
// //     setOrders(orders.map((order) =>
// //       order.id === id ? { ...order, status: newStatus, timestamp: Date.now() } : order
// //     ));
// //   };

// //   const formatTime = (seconds) => {
// //     const minutes = Math.floor(seconds / 60);
// //     const remainingSeconds = seconds % 60;
// //     return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
// //   };

// //   // Sort orders: high priority first, then by elapsed time (oldest first)
// //   const sortedOrders = [...orders].sort((a, b) => {
// //     const priorityOrder = { high: 3, medium: 2, low: 1 };
// //     if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
// //       return priorityOrder[b.priority] - priorityOrder[a.priority];
// //     }
// //     return a.timestamp - b.timestamp;
// //   });

// //   return (
// //     <div className="chef-dashboard">
// //       <h3>Chef Dashboard</h3>
// //       <p>Welcome, Chef! View live order queues, track preparation, and manage your kitchen flow.</p>

// //       <div className="order-queue-section">
// //         <h4>Live Order Queue</h4>
// //         <div className="order-list">
// //           {sortedOrders.length === 0 ? (
// //             <p>No new orders at the moment.</p>
// //           ) : (
// //             sortedOrders.map((order) => (
// //               <div key={order.id} className={`order-card ${order.status.toLowerCase()} ${order.priority}`}>
// //                 <h5>Order #{order.id} - Table {order.table}</h5>
// //                 <ul>
// //                   {order.items.map((item, index) => (
// //                     <li key={index}>{item}</li>
// //                   ))}
// //                 </ul>
// //                 <p>Status: {order.status}</p>
// //                 <p className="order-timer">Elapsed: {formatTime(order.elapsedTime || 0)}</p>
// //                 <div className="order-actions">
// //                   {order.status === 'New' && (
// //                     <button onClick={() => handleUpdateOrderStatus(order.id, 'Preparing')} className="action-button preparing">Mark as Preparing</button>
// //                   )}
// //                   {order.status === 'Preparing' && (
// //                     <button onClick={() => handleUpdateOrderStatus(order.id, 'Ready')} className="action-button ready">Mark as Ready</button>
// //                   )}
// //                 </div>
// //               </div>
// //             ))
// //           )}
// //         </div>
// //       </div>

// //       <div className="recipe-management-section">
// //         <h4>Recipe Management & Lookup</h4>
// //         <input
// //           type="text"
// //           placeholder="Search recipes by name or ingredient..."
// //           value={searchTerm}
// //           onChange={(e) => setSearchTerm(e.target.value)}
// //           className="recipe-search-input"
// //         />
// //         <div className="recipe-list">
// //           {filteredRecipes.length === 0 ? (
// //             <p>No recipes found matching your search.</p>
// //           ) : (
// //             filteredRecipes.map((recipe) => (
// //               <div key={recipe.id} className="recipe-card">
// //                 <h5>{recipe.name}</h5>
// //                 <p><strong>Ingredients:</strong> {recipe.ingredients.join(', ')}</p>
// //                 <p><strong>Instructions:</strong> {recipe.instructions}</p>
// //               </div>
// //             ))
// //           )}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default ChefDashboard;


