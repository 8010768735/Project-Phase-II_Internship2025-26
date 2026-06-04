import { useEffect, useState } from 'react';
import { FaPaperPlane, FaTimes } from 'react-icons/fa';
import { getCurrentUser } from '../utils/session';
import './AiChatAssistant.css';

const API_BASE_URL = 'http://localhost:8081/api';
const MENU_OFFERS_CACHE_KEY = 'menu_seasonal_offers_cache';
const AI_CHAT_HISTORY_KEY = 'ai_cafe_assistant_history';
const AI_CHAT_SESSIONS_KEY = 'ai_cafe_assistant_sessions';

const menuCategoryMatchers = {
  coffee: /coffee|espresso|latte|cappuccino|americano|mocha|flat white|frappe/i,
  tea: /tea|chai|kahwa/i,
  milkshake: /shake|milkshake|smoothie/i,
  snack: /sandwich|burger|toast|snack|biscuit|fries|puff|wrap|cake|cookie|samosa|noodle|bread/i,
  drink: /cold|soda|juice|mocktail|cooler|fizz|cola|pepsi|sprite|maaza|dew|thums/i,
};

const eventTypes = ['birthday', 'anniversary', 'baby shower', 'farewell', 'proposal'];
const decorationThemes = ['Classic', 'Romantic', 'Kids Party', 'Minimal', 'Premium'];

const quickQuestions = [
  'How do I book a table?',
  'Can I cancel booking?',
  'Suggest event package',
  'Where are my orders?',
];

const readJson = (key, fallback = []) => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '');
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const readObject = (key, fallback = null) => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '');
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const getCurrentSeason = () => {
  const month = new Date().getMonth() + 1;

  if (month >= 3 && month <= 5) return 'SUMMER';
  if (month >= 6 && month <= 9) return 'MONSOON';
  if (month >= 10 && month <= 11) return 'FESTIVE';
  return 'WINTER';
};

const fetchJson = async (url, fallback = []) => {
  try {
    const response = await fetch(url);
    if (!response.ok) return fallback;
    const data = await response.json();
    return data;
  } catch {
    return fallback;
  }
};

const normalizeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.cafes)) return value.cafes;
  return [];
};

const getCurrentCafeId = () => {
  const match = window.location.pathname.match(/\/(?:cafe|booking)\/([^/]+)/);
  return match?.[1] || '';
};

const getSavedCafeId = () => {
  const savedCafe = readObject('selectedCafe');
  return savedCafe?.id ? String(savedCafe.id) : '';
};

const getProjectContext = async () => {
  const user = getCurrentUser();
  const cafeId = getCurrentCafeId() || getSavedCafeId();
  const cafes = normalizeArray(await fetchJson(`${API_BASE_URL}/cafe`, []));
  const currentCafe = cafeId
    ? await fetchJson(`${API_BASE_URL}/cafe/${cafeId}`, null)
    : readObject('selectedCafe');
  const menuItems = cafeId
    ? normalizeArray(await fetchJson(`${API_BASE_URL}/cafe/${cafeId}/menu`, []))
    : [];
  const tables = cafeId
    ? normalizeArray(await fetchJson(`${API_BASE_URL}/tables/cafe/${cafeId}`, []))
    : [];
  const cartItems = user?.id
    ? normalizeArray(await fetchJson(`${API_BASE_URL}/cart/user/${user.id}`, []))
    : [];
  const orders = user?.id
    ? normalizeArray(await fetchJson(`${API_BASE_URL}/orders/customer/${user.id}`, []))
    : [];
  const tableBookings = user?.id
    ? normalizeArray(await fetchJson(`${API_BASE_URL}/bookings/customer/${user.id}`, []))
    : [];
  const events = cafeId
    ? readJson('cafe_connect_events').filter((event) => String(event.cafeId) === String(cafeId))
    : readJson('cafe_connect_events');
  const eventBookings = user?.id
    ? readJson('cafe_connect_event_bookings').filter((booking) => String(booking.customerId) === String(user.id))
    : [];

  return {
    user,
    cafeId,
    cafes,
    currentCafe,
    menuItems,
    tables,
    cartItems,
    orders,
    tableBookings,
    events,
    eventBookings,
  };
};

const getTopNames = (items, nameKeys, limit = 5) =>
  items
    .map((item) => nameKeys.map((key) => item?.[key]).find(Boolean))
    .filter(Boolean)
    .slice(0, limit)
    .join(', ');

const getDetailedItems = (items, limit = 10) =>
  items
    .slice(0, limit)
    .map((item) => {
      const name = item.itemName || item.name || 'Menu item';
      const price = item.price ? ` - Rs. ${Number(item.price).toFixed(2)}` : '';
      return `${name}${price}`;
    })
    .join(', ');

const getItemName = (item) => item?.itemName || item?.name || item?.title || 'Menu item';

const getItemPrice = (item) => Number(item?.price || 0);

const formatMoney = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

const textForItem = (item) =>
  `${item?.itemName || ''} ${item?.name || ''} ${item?.category || ''} ${item?.description || ''}`.toLowerCase();

const getMatchingMenuItems = (items, text) => {
  const matchedCategory = Object.entries(menuCategoryMatchers).find(([category, matcher]) => {
    if (category === 'drink') return /(drink|beverage|cold drink|juice|soda|mocktail|cooler)/i.test(text);
    return text.includes(category);
  });

  if (matchedCategory) {
    return items.filter((item) => matchedCategory[1].test(textForItem(item)));
  }

  const words = text
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !['give', 'show', 'tell', 'which', 'what', 'cost', 'price', 'cheap', 'cheapest', 'best', 'item', 'items'].includes(word));

  const directMatches = items.filter((item) => {
    const itemText = textForItem(item);
    return words.some((word) => itemText.includes(word));
  });

  return directMatches.length ? directMatches : items;
};

const getMentionedMenuCategory = (text) =>
  Object.entries(menuCategoryMatchers).find(([category]) => {
    if (category === 'drink') return /(drink|beverage|cold drink|juice|soda|mocktail|cooler)/i.test(text);
    return text.includes(category);
  });

const getCheapestItems = (items, limit = 3) =>
  [...items]
    .filter((item) => Number.isFinite(getItemPrice(item)) && getItemPrice(item) > 0)
    .sort((a, b) => getItemPrice(a) - getItemPrice(b))
    .slice(0, limit);

const describeMenuItem = (item) => `${getItemName(item)} (${formatMoney(getItemPrice(item))})`;

const getOfferDetails = (item) => {
  const currentSeason = getCurrentSeason();
  const season = String(item?.seasonalOfferSeason || '').trim().toUpperCase();
  const percentage = Number(item?.seasonalOfferPercentage || 0);
  const price = getItemPrice(item);

  if (!percentage || !price || (season && season !== currentSeason)) return null;

  const discountedPrice = Math.max(0, price - (price * percentage) / 100);
  return {
    item,
    percentage,
    season,
    discountedPrice,
  };
};

const mergeCachedOffers = (items, cafeId) => {
  const cache = readObject(MENU_OFFERS_CACHE_KEY, {});
  const cafeOffers = cache?.[String(cafeId || '')] || {};

  return items.map((item) => {
    const cached = cafeOffers[String(item?.id ?? '')];
    if (!cached) return item;
    return {
      ...item,
      seasonalOfferSeason: item.seasonalOfferSeason || cached.seasonalOfferSeason || '',
      seasonalOfferPercentage:
        Number(item.seasonalOfferPercentage || 0) > 0
          ? item.seasonalOfferPercentage
          : cached.seasonalOfferPercentage || 0,
    };
  });
};

const getLatestByTime = (items, keys = ['createdAt', 'bookedAt', 'updatedAt']) =>
  [...items].sort((a, b) => {
    const aTime = keys.map((key) => Date.parse(a?.[key] || '')).find((value) => Number.isFinite(value)) || 0;
    const bTime = keys.map((key) => Date.parse(b?.[key] || '')).find((value) => Number.isFinite(value)) || 0;
    return bTime - aTime;
  })[0];

const getStatus = (item, keys) =>
  keys.map((key) => item?.[key]).find(Boolean) || 'Pending';

const getEventText = (event) =>
  `${event?.title || ''} ${event?.eventType || ''} ${event?.description || ''}`.toLowerCase();

const getEventOptionsText = (events) =>
  events
    .slice(0, 5)
    .map((event) => `${event.title || event.eventType || 'Event'} (${event.eventType || 'Event'}, ${formatMoney(event.price)}, capacity ${event.capacity || 0})`)
    .join(', ');

const findCafeByQuestion = (cafes, text) =>
  cafes.find((cafe) => {
    const name = String(cafe.cafeName || cafe.name || '').toLowerCase();
    return name && text.includes(name);
  });

const isInternalQuestion = (text) =>
  /(password|credential|api key|secret|source code|table name|sql|database schema|db schema)/i.test(text) &&
  !/(advance amount|owner-set|set by owner)/i.test(text);

const projectFeatureAnswers = [
  {
    matcher: /(project|about.*app|what.*app|cafe connect|overview)/i,
    answer:
      'This project is a cafe management and customer ordering platform. Customers can browse cafes, view menus, use budget filters, order food, book tables, book events, pay online, download receipts, cancel eligible bookings, request refunds, give feedback, use multi-language translation, and ask the AI assistant for help.',
  },
  {
    matcher: /(customer dashboard|customer home|customer side)/i,
    answer:
      'Customer dashboard logic: it shows available cafes, lets customers open a cafe, browse menu/tables/events, manage favourites, and move to account pages for orders, bookings, receipts, profile, addresses, and settings.',
  },
  {
    matcher: /(owner dashboard|cafe owner|owner side)/i,
    answer:
      'Owner dashboard logic: cafe owners manage cafe details, menu items, seasonal offers, tables, event packages, reservations, orders, customer feedback, and event booking requests for their cafe.',
  },
  {
    matcher: /(admin dashboard|admin side|admin panel)/i,
    answer:
      'Admin dashboard logic: admins manage platform-level records like users, cafes, approvals, and overall project data from the admin area.',
  },
  {
    matcher: /(chef dashboard|chef side|chef order|kitchen)/i,
    answer:
      'Chef dashboard logic: chefs see assigned food orders, update preparation status, and move orders through pending, preparing, ready, or completed states.',
  },
  {
    matcher: /(waiter dashboard|waiter side|serve|served)/i,
    answer:
      'Waiter dashboard logic: waiters review ready orders, serve them, manage table/service flow, and update served/completed status.',
  },
  {
    matcher: /(cart|checkout|razorpay|payment)/i,
    answer:
      'Cart and payment logic: customers add menu items to cart, checkout calculates totals and discounts, Razorpay payment completes the transaction, then the app stores the order/payment details and receipt.',
  },
  {
    matcher: /(receipt|invoice|bill)/i,
    answer:
      'Receipt logic: after successful payment or eligible refund, the app stores receipt/refund details and shows them in Customer Account under Receipts. Customers can download the receipt as a PDF.',
  },
  {
    matcher: /(feedback|review|rating)/i,
    answer:
      'Feedback logic: customers can submit ratings and messages for completed/non-cancelled orders, table bookings, and event bookings. Owners can view that feedback in their dashboard.',
  },
  {
    matcher: /(favourite|favorite|wishlist)/i,
    answer:
      'Favourite logic: customers mark menu items as favourites from the cafe menu, and those saved items appear in Customer Account under Favourites.',
  },
  {
    matcher: /(profile|address|phone|email|settings)/i,
    answer:
      'Profile logic: Customer Account lets users view and update profile details like phone, email, addresses, payment method, settings, and account-related records.',
  },
  {
    matcher: /(budget filter|budget|price filter)/i,
    answer:
      'Budget filter logic: the customer enters a budget amount, the app converts it to a number, and menu items, tables, or events are shown only when their price is less than or equal to that budget.',
  },
  {
    matcher: /(multi.?language|language|translate)/i,
    answer:
      'Multi-language logic: the language selector saves the selected language in localStorage, sets the Google Translate cookie, loads the Google Translate widget, and triggers translation for customer-facing text.',
  },
  {
    matcher: /(seasonal|offer|discount|deal)/i,
    answer:
      'Seasonal offer logic: the owner sets an offer season and discount percentage on a menu item. The customer menu checks the current season, applies the discount only when it matches, and sends the discounted price to cart and checkout.',
  },
  {
    matcher: /(ai assistant|chat assistant|assistant|chatbot)/i,
    answer:
      'AI assistant logic: it reads project context like cafes, menu, cart, orders, table bookings, events, offers, and customer state, matches the question with project topics, and replies with customer-help answers.',
  },
];

const getProjectFeatureReply = (text) =>
  projectFeatureAnswers.find((item) => item.matcher.test(text))?.answer || '';

const createWelcomeMessage = () => ({
  sender: 'assistant',
  text: 'Hi, I am your cafe assistant. Ask about bookings, orders, events, or refunds.',
});

const createChatSession = (messages = [createWelcomeMessage()]) => ({
  id: `chat-${Date.now()}`,
  title: messages.find((message) => message.sender === 'user')?.text?.slice(0, 36) || 'New chat',
  messages,
  updatedAt: Date.now(),
});

const readChatSessions = () => {
  try {
    const parsedSessions = JSON.parse(window.localStorage.getItem(AI_CHAT_SESSIONS_KEY) || '[]');
    if (Array.isArray(parsedSessions) && parsedSessions.length) return parsedSessions;

    const legacyMessages = JSON.parse(window.localStorage.getItem(AI_CHAT_HISTORY_KEY) || '[]');
    if (Array.isArray(legacyMessages) && legacyMessages.length) return [createChatSession(legacyMessages)];
  } catch {}

  return [createChatSession()];
};

const getAssistantReply = async (message) => {
  const text = String(message || '').toLowerCase();
  const context = await getProjectContext();
  const mentionedCafe = findCafeByQuestion(context.cafes, text);
  const activeCafeId = mentionedCafe?.id ? String(mentionedCafe.id) : context.cafeId;
  const activeCafe = mentionedCafe || context.currentCafe;
  const fetchedMenuItems = mentionedCafe?.id
    ? normalizeArray(await fetchJson(`${API_BASE_URL}/cafe/${mentionedCafe.id}/menu`, []))
    : context.menuItems;
  const activeMenuItems = mergeCachedOffers(fetchedMenuItems, activeCafeId);
  const activeTables = mentionedCafe?.id
    ? normalizeArray(await fetchJson(`${API_BASE_URL}/tables/cafe/${mentionedCafe.id}`, []))
    : context.tables;
  const activeEvents = activeCafeId
    ? readJson('cafe_connect_events').filter((event) => String(event.cafeId) === String(activeCafeId))
    : context.events;
  const cafeName = activeCafe?.cafeName || activeCafe?.name || 'this cafe';

  if (isInternalQuestion(text)) {
    return 'I can explain project features and flow, but I cannot share private credentials, API keys, database schema, table names, SQL, or source-code internals.';
  }

  if (text.includes('how many') && text.includes('cafe')) {
    return `There ${context.cafes.length === 1 ? 'is' : 'are'} ${context.cafes.length} cafe${context.cafes.length === 1 ? '' : 's'} available in this project${context.cafes.length ? `: ${getTopNames(context.cafes, ['cafeName', 'name'], 6)}.` : '.'}`;
  }

  if (text.includes('which cafe') || text.includes('cafe list') || text.includes('available cafe') || text.includes('show cafe')) {
    const names = getTopNames(context.cafes, ['cafeName', 'name'], 8);
    return names
      ? `Available cafes include ${names}. Open the customer dashboard to search cafes by name or location and view each cafe menu.`
      : 'No cafes are loaded right now. Please open the customer dashboard and refresh once the backend is running.';
  }

  if (text.includes('current cafe') || text.includes('this cafe') || mentionedCafe) {
    return activeCafe
      ? `${cafeName} has ${activeMenuItems.length} menu item${activeMenuItems.length === 1 ? '' : 's'}, ${activeTables.length} table${activeTables.length === 1 ? '' : 's'}, and ${activeEvents.length} event option${activeEvents.length === 1 ? '' : 's'} available for customers.`
      : 'Open any cafe from the customer dashboard and I can tell you about its menu, tables, and events.';
  }

  if (/(timing|time|open|close|closing|opening|hours|when.*cafe)/i.test(text)) {
    if (!activeCafe) {
      return 'Open or mention a cafe first, then I can tell you its working hours.';
    }
    const opening = activeCafe.openingTime || activeCafe.openTime || '--';
    const closing = activeCafe.closingTime || activeCafe.closeTime || '--';
    return `${cafeName} working hours are ${opening} to ${closing}.`;
  }

  if (/(logic|how.*work|feature)/i.test(text)) {
    const featureReplies = [];
    if (/(multi.?language|language|translate)/i.test(text)) {
      featureReplies.push('Multi-language feature: the language selector saves the selected language in localStorage, sets the Google Translate cookie, loads the Google Translate widget, and triggers the matching language option so customer-facing pages translate without changing stored data.');
    }
    if (/(seasonal|offer|discount)/i.test(text)) {
      featureReplies.push('Seasonal offer: the owner sets an offer season and percentage on a menu item. The customer menu detects the current season, applies the discount only when the configured season matches, shows the offer badge, and passes the discounted price to cart and bill.');
    }
    if (/(ai|assistant|chat)/i.test(text)) {
      featureReplies.push('AI assistant: it reads customer context like cafes, menu, cart, orders, table bookings, events, and local offer data, matches the customer question to safe project intents, and returns customer-help answers while blocking owner/admin, database, and private system details.');
    }
    if (featureReplies.length) return featureReplies.join(' ');
  }

  if (/(offer|discount|deal|today)/i.test(text)) {
    const offerItems = activeMenuItems.map(getOfferDetails).filter(Boolean);
    if (offerItems.length) {
      const offers = offerItems
        .slice(0, 5)
        .map(({ item, percentage, discountedPrice }) => `${getItemName(item)}: ${percentage}% off, now ${formatMoney(discountedPrice)}`)
        .join(', ');
      return `Today's active menu offers at ${cafeName}: ${offers}.`;
    }
    return activeCafeId
      ? `No active seasonal menu offers are available at ${cafeName} right now.`
      : 'Open or mention a cafe first and I can check today\'s offers for that cafe.';
  }

  if (text.includes('menu') || text.includes('food') || text.includes('drink') || text.includes('coffee') || text.includes('item')) {
    if (!activeCafeId) {
      const names = getTopNames(context.cafes, ['cafeName', 'name'], 6);
      return names
        ? `Please open or mention a cafe name first. Available cafes include ${names}. Then I can list that cafe's menu items.`
        : 'Please open a cafe first to view its menu. From the customer dashboard, choose View Cafe, then browse menu categories and add items to cart.';
    }
    const matchingItems = getMatchingMenuItems(activeMenuItems, text);
    const mentionedCategory = getMentionedMenuCategory(text);
    if (mentionedCategory && /(how many|types?|list|available|show|which|what)/i.test(text)) {
      const categoryLabel = mentionedCategory[0] === 'milkshake' ? 'milkshake' : mentionedCategory[0];
      const itemList = matchingItems.map(describeMenuItem).join(', ');
      return matchingItems.length
        ? `${cafeName} has ${matchingItems.length} ${categoryLabel} item${matchingItems.length === 1 ? '' : 's'} available: ${itemList}.`
        : `${cafeName} has no ${categoryLabel} items available right now.`;
    }
    if (/(cheap|cheapest|low price|lowest|budget|less cost|less price|minimum|affordable)/i.test(text)) {
      const cheapest = getCheapestItems(matchingItems, text.includes('one') || text.includes('1') ? 1 : 3);
      if (cheapest.length) {
        return cheapest.length === 1
          ? `The cheapest matching option at ${cafeName} is ${describeMenuItem(cheapest[0])}.`
          : `The cheapest matching options at ${cafeName} are ${cheapest.map(describeMenuItem).join(', ')}.`;
      }
      return `I could not find a priced matching item at ${cafeName}.`;
    }
    if (/(recommend|suggest|best|give me|which)/i.test(text) && matchingItems.length) {
      const pricedItems = getCheapestItems(matchingItems, 5);
      const first = pricedItems[0] || matchingItems[0];
      return `I suggest ${describeMenuItem(first)} from ${cafeName}. ${pricedItems.length > 1 ? `Other good budget options are ${pricedItems.slice(1, 4).map(describeMenuItem).join(', ')}.` : 'You can add it from the cafe menu.'}`;
    }
    const items = getDetailedItems(activeMenuItems);
    return activeMenuItems.length
      ? `${cafeName} has ${activeMenuItems.length} menu item${activeMenuItems.length === 1 ? '' : 's'}: ${items}. You can add items to cart from the cafe menu.`
      : `${cafeName} has no menu items published right now.`;
  }

  if (text.includes('cart')) {
    const itemCount = context.cartItems.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
    return context.user
      ? `Your cart currently has ${itemCount} item${itemCount === 1 ? '' : 's'}. Open Cart to review items, check total amount, pay, and place the order.`
      : 'Please login as a customer first. Then you can add menu items to cart and checkout.';
  }

  if (text.includes('cancel') || text.includes('refund')) {
    if (text.includes('policy') || text.includes('refund')) {
      return 'Refund policy: orders, table bookings, and event bookings get 100% refund if cancelled within 2 minutes. After that, menu orders can be cancelled only before ready/served/delivered/completed status and refund depends on preparation status. Table bookings get 80% before 24 hours, 50% before 6 hours, 20% before start time, and 0% after start time. Event bookings get 80% normally, 50% after approval or preparation starts, 0% after completed/served, and 100% if cancelled/postponed by the organizer.';
    }
    return 'Yes, you can cancel eligible orders, table bookings, and event bookings from Customer Account. Cancelled, served, delivered, completed, or expired items cannot be cancelled again.';
  }

  if (text.includes('order') || text.includes('track') || text.includes('status')) {
    const latest = getLatestByTime(context.orders, ['createdAt', 'orderDate', 'updatedAt', 'id']);
    if (!context.user) return 'Please login as a customer first to view and track your orders.';
    if (!context.orders.length) return 'You do not have any customer orders loaded right now. After checkout, orders appear in Customer Account under Orders.';
    return `You have ${context.orders.length} order${context.orders.length === 1 ? '' : 's'}. Latest order status is ${getStatus(latest, ['orderStatus', 'status'])}. You can track all orders in Customer Account under Orders.`;
  }

  if (text.includes('table') || text.includes('book')) {
    if (text.includes('cancel')) {
      const latestBooking = getLatestByTime(context.tableBookings, ['createdAt', 'bookingDate', 'id']);
      return latestBooking
        ? `Yes, you can cancel eligible table bookings before the start time from Customer Account. Your latest table booking status is ${getStatus(latestBooking, ['status', 'bookingStatus'])}. Refund is calculated by time left before the booking.`
        : 'Yes, you can cancel eligible table bookings before the start time from Customer Account. I do not see a table booking loaded for you right now.';
    }
    if (text.includes('how many') && activeCafeId) {
      return `${cafeName} has ${activeTables.length} table${activeTables.length === 1 ? '' : 's'} available for customers to view. Open the Tables section to choose one and continue booking.`;
    }
    if (/(guest|people|person|seat|capacity)/i.test(text)) {
      const maxSeats = activeTables.reduce((max, table) => Math.max(max, Number(table.seats || table.capacity || 0)), 0);
      return activeCafeId
        ? `${cafeName} tables can seat up to ${maxSeats || 'the available table capacity'} guests per table. The booking form allows up to 20 guests and shows only tables that fit your guest count.`
        : 'For table bookings, the form lets you enter guest count and then shows tables that can fit those guests.';
    }
    return 'To book a table, open a cafe, choose the Tables section or Book Table, select date, time, guest count, table, and complete the advance payment.';
  }

  if (text.includes('event') || text.includes('package') || eventTypes.some((eventType) => text.includes(eventType))) {
    const matchingEventType = eventTypes.find((eventType) => text.includes(eventType));
    const matchingEvents = matchingEventType
      ? activeEvents.filter((event) => getEventText(event).includes(matchingEventType))
      : activeEvents;
    if (/(decoration|theme|decor|decorate)/i.test(text)) {
      if (/(price|cost|rate|amount)/i.test(text)) {
        const pricedEvents = getCheapestItems(matchingEvents.length ? matchingEvents : activeEvents, 3);
        return pricedEvents.length
          ? `Decoration/event pricing is set by the cafe package. Matching options: ${pricedEvents.map((event) => `${event.title || event.eventType || 'Event'} - ${formatMoney(event.price)}`).join(', ')}. Available decoration themes are ${decorationThemes.join(', ')}.`
          : `Available decoration themes are ${decorationThemes.join(', ')}. Open an event package to see its cafe-set price.`;
      }
      return `Available decoration themes are ${decorationThemes.join(', ')}. Event booking also supports cake, music, food package, balloons, photo corner, candlelight setup, welcome board, custom message, and special requests.`;
    }
    if (/(baby shower|birthday|anniversary|farewell|proposal)/i.test(text)) {
      const typeLabel = matchingEventType ? matchingEventType.replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'event';
      if (matchingEvents.length) {
        return `Yes, you can book a ${typeLabel} event at ${cafeName}. Options include ${getEventOptionsText(matchingEvents)}.`;
      }
      return `The event booking form supports ${typeLabel}, but I do not see a matching published package at ${cafeName} right now. You can still check the Event Booking section for available packages.`;
    }
    if (/(guest|people|person|seat|capacity|how many)/i.test(text)) {
      const maxCapacity = activeEvents.reduce((max, event) => Math.max(max, Number(event.capacity || 0)), 0);
      return activeCafeId
        ? `${cafeName} event packages allow up to ${maxCapacity || 'the capacity set by the cafe'} guests, depending on the selected event.`
        : 'Guest capacity depends on the selected cafe event package. Open a cafe event to see its available seats.';
    }
    if (text.includes('how many') && activeCafeId) {
      return `${cafeName} has ${activeEvents.length} event option${activeEvents.length === 1 ? '' : 's'} available right now.`;
    }
    return activeEvents.length
      ? `For events at ${cafeName}, choose a package, guest count, decoration theme, cake, music, food package, tables, and pay the advance amount. Available options include ${getEventOptionsText(activeEvents)}.`
      : 'For events, choose guest count first, then select decoration theme, cake, music, food package, tables, and pay the fixed advance amount shown in the form.';
  }

  if (text.includes('receipt') || text.includes('payment') || text.includes('bill')) {
    const latestOrder = getLatestByTime(context.orders, ['createdAt', 'orderDate', 'updatedAt', 'id']);
    const latestTableBooking = getLatestByTime(context.tableBookings, ['createdAt', 'bookingDate', 'id']);
    const latestEventBooking = getLatestByTime(context.eventBookings, ['bookedAt', 'bookingDate', 'id']);
    if (/(successful|success|paid|done|complete)/i.test(text)) {
      const latestPayment = latestOrder || latestEventBooking || latestTableBooking;
      const paymentStatus = getStatus(latestPayment, ['paymentStatus', 'advancePaymentStatus', 'status', 'bookingStatus', 'orderStatus']);
      return latestPayment
        ? `Your latest payment-related status is ${paymentStatus}. Receipts are saved in Customer Account under Receipts after successful payment.`
        : 'I do not see a recent payment record loaded. After successful payment, the receipt appears in Customer Account under Receipts.';
    }
    return 'After payment, receipts are saved in Customer Account under Receipts. Refund receipts are also recorded there after eligible cancellations.';
  }

  if (text.includes('favourite') || text.includes('favorite')) {
    return 'You can mark menu items as favourites from the cafe menu. Your saved favourites are available in Customer Account under Favourites.';
  }

  if (text.includes('profile') || text.includes('address') || text.includes('phone') || text.includes('email')) {
    return 'Customer Account lets you manage profile details, phone, email, addresses, payment method, orders, bookings, events, receipts, favourites, and settings.';
  }

  if (text.includes('login') || text.includes('signup') || text.includes('account')) {
    return 'Use Login or Sign Up from the home page. After login, your account shows orders, table bookings, event bookings, receipts, and profile settings.';
  }

  const projectFeatureReply = getProjectFeatureReply(text);
  if (projectFeatureReply) return projectFeatureReply;

  return 'I can answer questions about this cafe project, including customer, owner, admin, chef, waiter, menu, cart, orders, table booking, event booking, payments, refunds, feedback, receipts, seasonal offers, budget filter, multi-language, and AI assistant features. Ask about any project feature and I will explain the flow.';
};

const AiChatAssistant = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [chatSessions, setChatSessions] = useState(readChatSessions);
  const [activeChatId, setActiveChatId] = useState('');
  const activeChat = chatSessions.find((session) => session.id === activeChatId) || chatSessions[0];
  const currentChatId = activeChatId || activeChat?.id;
  const messages = activeChat?.messages || [createWelcomeMessage()];

  useEffect(() => {
    if (!activeChatId && chatSessions[0]?.id) {
      setActiveChatId(chatSessions[0].id);
    }
  }, [activeChatId, chatSessions]);

  useEffect(() => {
    try {
      window.localStorage.setItem(AI_CHAT_SESSIONS_KEY, JSON.stringify(chatSessions.slice(0, 10)));
      window.localStorage.setItem(AI_CHAT_HISTORY_KEY, JSON.stringify(messages.slice(-50)));
    } catch {}
  }, [chatSessions, messages]);

  const updateActiveMessages = (updater) => {
    setChatSessions((prev) =>
      prev.map((session) => {
        if (session.id !== currentChatId) return session;
        const nextMessages = typeof updater === 'function' ? updater(session.messages) : updater;
        const firstUserMessage = nextMessages.find((message) => message.sender === 'user')?.text;
        return {
          ...session,
          title: firstUserMessage ? firstUserMessage.slice(0, 36) : session.title,
          messages: nextMessages.slice(-50),
          updatedAt: Date.now(),
        };
      })
    );
  };

  const startNewChat = () => {
    const nextSession = createChatSession();
    setChatSessions((prev) => [nextSession, ...prev]);
    setActiveChatId(nextSession.id);
    setInput('');
  };

  const sendMessage = async (text = input) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    updateActiveMessages((prev) => [...prev, { sender: 'user', text: trimmed }]);
    setInput('');

    const reply = await getAssistantReply(trimmed);
    updateActiveMessages((prev) => [...prev, { sender: 'assistant', text: reply }]);
  };

  return (
    <div className="ai-chat-assistant">
      {open && (
        <section className="ai-chat-panel" aria-label="AI cafe assistant">
          <div className="ai-chat-header">
            <div>
              <strong>AI Cafe Assistant</strong>
              <span>Instant help</span>
            </div>
            <div className="ai-chat-header-actions">
              <button type="button" className="ai-chat-new" onClick={startNewChat}>
                New Chat
              </button>
              <button type="button" aria-label="Close assistant" onClick={() => setOpen(false)}>
                <FaTimes />
              </button>
            </div>
          </div>

          {chatSessions.length > 1 && (
            <div className="ai-chat-history" aria-label="Past chats">
              {chatSessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  className={session.id === currentChatId ? 'active' : ''}
                  onClick={() => setActiveChatId(session.id)}
                >
                  {session.title}
                </button>
              ))}
            </div>
          )}

          <div className="ai-chat-messages">
            {messages.map((message, index) => (
              <div key={`${message.sender}-${index}`} className={`ai-chat-message ${message.sender}`}>
                {message.text}
              </div>
            ))}
          </div>

          <div className="ai-chat-quick">
            {quickQuestions.map((question) => (
              <button key={question} type="button" onClick={() => sendMessage(question)}>
                {question}
              </button>
            ))}
          </div>

          <form
            className="ai-chat-input"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <input
              type="text"
              value={input}
              placeholder="Ask something..."
              onChange={(event) => setInput(event.target.value)}
            />
            <button type="submit" aria-label="Send message">
              <FaPaperPlane />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className="ai-chat-toggle"
        aria-label="Open AI cafe assistant"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="ai-chat-logo" aria-hidden="true">
          <span className="ai-chat-logo-bot">
            <span className="ai-chat-logo-eye" />
            <span className="ai-chat-logo-eye" />
          </span>
        </span>
      </button>
    </div>
  );
};

export default AiChatAssistant;
