import React, { createContext, useContext, useEffect, useState } from "react";
import apiClient from "../config/axios.jsx";
import { hasStoredAuthToken, isPortalApiEnabled } from "../utils/portalApi.js";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

const CART_LS_KEY = "cart";

const safeParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const readLocal = () => safeParse(localStorage.getItem(CART_LS_KEY), []);
const writeLocal = (items) => localStorage.setItem(CART_LS_KEY, JSON.stringify(items || []));

const coerceNumber = (value, fallback = 0) => {
  if (value == null || value === "") return fallback;
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const parsed = parseFloat(value.replace(/[^0-9.-]+/g, ""));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const coerceQuantity = (value, fallback = 1) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return Math.max(1, Math.trunc(numeric));
};

const keyOf = (item) => {
  if (item == null) return null;
  if (typeof item === "string" || typeof item === "number") return String(item);
  return (
    item?.cartItemId ??
    item?.productId ??
    item?.id ??
    item?._id ??
    item?.slug ??
    item?.sku ??
    item?.code ??
    (typeof item?.key === "string" ? item.key : null)
  );
};

const fallbackIdFromItem = (item) => {
  if (!item) return null;
  const base = item?.title || item?.name || item?.slug || item?.sku || item?.code;
  return base ? 'item-' + String(base).replace(/\s+/g, '-').toLowerCase() : null;
};

const normalizeForLocal = (item) => {
  if (!item) return null;
  const resolvedId = keyOf(item) ?? fallbackIdFromItem(item);
  if (!resolvedId) return null;
  const price = coerceNumber(item?.price, 0);
  const quantity = coerceQuantity(item?.quantity, 1);
  return {
    id: resolvedId,
    productId: resolvedId,
    title: item?.title ?? item?.name ?? "Untitled",
    price,
    currency: item?.currency || "USD",
    image: item?.image ?? item?.img ?? "",
    quantity,
    totalPrice: coerceNumber(item?.totalPrice, price * quantity),
    source: item?.source || item?.kind || "product",
    metadata: typeof item?.metadata === "object" && item.metadata !== null ? item.metadata : {},
  };
};

const normalizeList = (items) => (Array.isArray(items) ? items : []).map(normalizeForLocal).filter(Boolean);

const getLocalState = () => normalizeList(readLocal());
const commitLocalState = (items) => {
  const normalized = normalizeList(items);
  writeLocal(normalized);
  return normalized;
};

const mapServerCart = (cartPayload) => {
  if (!cartPayload || !Array.isArray(cartPayload.items)) return [];
  return cartPayload.items.map((item) => {
    const price = coerceNumber(item.price, 0);
    const quantity = coerceQuantity(item.quantity ?? item.qty ?? 1, 1);
    const id = item.cartItemId || item.id || item._id || keyOf(item) || fallbackIdFromItem(item);
    return {
      id,
      cartItemId: item.cartItemId || item.id || item._id || null,
      productId: item.productId || item.product || id,
      title: item.title || "Untitled",
      price,
      currency: item.currency || "USD",
      quantity,
      totalPrice: Number((price * quantity).toFixed(2)),
      image: item.image || "",
      source: item.source || item.kind || "product",
      metadata: item.metadata || {},
    };
  });
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [apiAvailable, setApiAvailable] = useState(false);

  const applyLocalAdd = (normalized) => {
    if (!normalized) return;
    const items = getLocalState();
    const idx = items.findIndex((entry) => entry.id === normalized.id);
    let next;
    if (idx >= 0) {
      next = [...items];
      const mergedQuantity = next[idx].quantity + normalized.quantity;
      next[idx] = {
        ...next[idx],
        ...normalized,
        quantity: mergedQuantity,
        totalPrice: (normalized.price || next[idx].price || 0) * mergedQuantity,
      };
    } else {
      next = [...items, normalized];
    }
    const committed = commitLocalState(next);
    setCartItems(committed);
  };

  const applyLocalUpdate = (targetId, quantity) => {
    if (!targetId) return;
    const items = getLocalState();
    const idx = items.findIndex((entry) => entry.id === targetId);
    if (idx < 0) return;
    const next = [...items];
    if (quantity <= 0) {
      next.splice(idx, 1);
    } else {
      next[idx] = {
        ...next[idx],
        quantity,
        totalPrice: (next[idx].price ?? 0) * quantity,
      };
    }
    const committed = commitLocalState(next);
    setCartItems(committed);
  };

  const applyLocalRemove = (targetId) => {
    if (!targetId) return;
    const next = getLocalState().filter((entry) => entry.id !== targetId);
    const committed = commitLocalState(next);
    setCartItems(committed);
  };

  const shouldUseApi = () => isPortalApiEnabled() && hasStoredAuthToken();

  const syncLocalSnapshot = () => {
    const snapshot = getLocalState();
    setCartItems(snapshot);
    return snapshot;
  };

  const fetchCart = async () => {
    if (!shouldUseApi()) {
      setApiAvailable(false);
      syncLocalSnapshot();
      return;
    }
    try {
      const { data } = await apiClient.get('/cart');
      const payload = mapServerCart(data?.cart);
      setCartItems(payload);
      setApiAvailable(true);
    } catch (error) {
      console.warn('cart_fetch_failed', error?.message || error);
      setApiAvailable(false);
      syncLocalSnapshot();
    }
  };

  const buildServerPayload = (item) => {
    const normalized = normalizeForLocal(item);
    if (!normalized) return null;
    return {
      productId: normalized.productId,
      title: normalized.title,
      price: normalized.price,
      currency: normalized.currency,
      image: normalized.image,
      source: normalized.source,
      metadata: normalized.metadata,
      quantity: normalized.quantity,
    };
  };

  const syncLocalCartToServer = async () => {
    if (!shouldUseApi()) return;
    const localItems = getLocalState();
    if (!localItems.length) {
      await fetchCart();
      return;
    }
    try {
      for (const localItem of localItems) {
        const payload = buildServerPayload(localItem);
        if (!payload) continue;
        await apiClient.post('/cart/items', payload);
      }
      commitLocalState([]);
      await fetchCart();
    } catch (error) {
      console.warn('cart_sync_failed', error?.message || error);
    }
  };

  const addToCart = async (item) => {
    const normalized = normalizeForLocal(item);
    if (!normalized) return;

    if (!shouldUseApi() || !apiAvailable) {
      applyLocalAdd(normalized);
      return;
    }

    try {
      const payload = buildServerPayload(item);
      await apiClient.post('/cart/items', payload);
      await fetchCart();
    } catch (error) {
      console.warn('addToCart API failed, falling back to local mode:', error?.message || error);
      setApiAvailable(false);
      applyLocalAdd(normalized);
    }
  };

  const updateQuantity = async (item, quantity) => {
    const parsedQuantity = coerceQuantity(quantity, 1);
    if (!shouldUseApi() || !apiAvailable) {
      const targetId = keyOf(item) ?? fallbackIdFromItem(item);
      applyLocalUpdate(targetId, parsedQuantity);
      return;
    }

    try {
      const identifier = item.cartItemId || item.id;
      if (identifier) {
        await apiClient.patch('/cart/items/' + identifier, { qty: parsedQuantity });
      } else {
        await apiClient.post('/cart/update', {
          productId: keyOf(item) ?? fallbackIdFromItem(item),
          quantity: parsedQuantity,
        });
      }
      await fetchCart();
    } catch (error) {
      console.warn('updateQuantity API failed:', error?.message || error);
      if (error?.response?.status === 401) {
        setApiAvailable(false);
      }
      const targetId = keyOf(item) ?? fallbackIdFromItem(item);
      applyLocalUpdate(targetId, parsedQuantity);
    }
  };

  const removeFromCart = async (item) => {
    if (!shouldUseApi() || !apiAvailable) {
      const targetId = keyOf(item) ?? fallbackIdFromItem(item);
      applyLocalRemove(targetId);
      return;
    }

    try {
      if (item.cartItemId || item.id) {
        await apiClient.delete('/cart/items/' + (item.cartItemId || item.id));
      } else {
        await apiClient.post('/cart/remove', {
          productId: keyOf(item) ?? fallbackIdFromItem(item),
        });
      }
      await fetchCart();
    } catch (error) {
      console.warn('removeFromCart API failed:', error?.message || error);
      if (error?.response?.status === 401) {
        setApiAvailable(false);
      }
      const targetId = keyOf(item) ?? fallbackIdFromItem(item);
      applyLocalRemove(targetId);
    }
  };

  useEffect(() => {
    if (shouldUseApi()) {
      syncLocalCartToServer();
    } else {
      fetchCart();
    }
  }, []);

  useEffect(() => {
    const handleLogin = () => {
      setApiAvailable(true);
      syncLocalCartToServer();
    };
    const handleLogout = () => {
      setApiAvailable(false);
      syncLocalSnapshot();
    };
    window.addEventListener('auth:login', handleLogin);
    window.addEventListener('auth:logout', handleLogout);
    return () => {
      window.removeEventListener('auth:login', handleLogin);
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, updateQuantity, removeFromCart, fetchCart, apiAvailable }}>
      {children}
    </CartContext.Provider>
  );
};
