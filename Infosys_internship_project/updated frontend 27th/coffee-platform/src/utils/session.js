const USER_KEY = "user";
const TOKEN_KEY = "token";
const CAFE_ID_KEY = "cafeId";

const readStorage = (storage, key) => {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

const writeStorage = (storage, key, value) => {
  try {
    storage?.setItem(key, value);
  } catch {}
};

const removeStorageKey = (storage, key) => {
  try {
    storage?.removeItem(key);
  } catch {}
};

export const getSessionItem = (key) => {
  const sessionValue = readStorage(window.sessionStorage, key);
  if (sessionValue !== null) return sessionValue;
  return readStorage(window.localStorage, key);
};

export const setSessionItem = (key, value) => {
  writeStorage(window.sessionStorage, key, value);
  removeStorageKey(window.localStorage, key);
};

export const removeSessionItem = (key) => {
  removeStorageKey(window.sessionStorage, key);
  removeStorageKey(window.localStorage, key);
};

export const getCurrentUser = () => {
  const raw = getSessionItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setCurrentUser = (user) => {
  setSessionItem(USER_KEY, JSON.stringify(user));
};

export const clearCurrentUser = () => {
  removeSessionItem(USER_KEY);
};

export const getAuthToken = () => getSessionItem(TOKEN_KEY);
export const setAuthToken = (token) => setSessionItem(TOKEN_KEY, token);
export const clearAuthToken = () => removeSessionItem(TOKEN_KEY);

export const getCurrentCafeId = () => getSessionItem(CAFE_ID_KEY);
export const setCurrentCafeId = (cafeId) => setSessionItem(CAFE_ID_KEY, String(cafeId));
export const clearCurrentCafeId = () => removeSessionItem(CAFE_ID_KEY);

export const clearActiveSession = () => {
  clearAuthToken();
  clearCurrentUser();
  clearCurrentCafeId();
};
