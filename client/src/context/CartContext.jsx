import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

// Helpers: env, url join, storage, normalization
const trimEndSlash = (s) => (s || "").replace(/\/+$/, "");
const leadSlash = (s) => (s?.startsWith("/") ? s : `/${s || ""}`);
const API_BASE = trimEndSlash(import.meta?.env?.VITE_API_BASE_URL || "");
const withBase = (path) => (API_BASE ? `${API_BASE}${leadSlash(path)}` : leadSlash(path));

const demoHeaders = { headers: { "x-demo-user": "demo-user" } };
const CART_LS_KEY = "cart";
const safeParse = (s, fb) => { try { return JSON.parse(s); } catch { return fb; } };
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
  return base ? `item-${String(base).replace(/\s+/g, "-").toLowerCase()}` : null;
};

const normalizeForLocal = (item) => {
  if (!item) return null;
  const resolvedId = keyOf(item) ?? fallbackIdFromItem(item);
  if (!resolvedId) return null;
  const price = coerceNumber(item?.price, 0);
  const quantity = coerceQuantity(item?.quantity, 1);
  const normalized = {
    id: resolvedId,
    productId: resolvedId,
    title: item?.title ?? item?.name ?? "Untitled",
    price,
    image: item?.image ?? item?.img ?? "",
    quantity,
    seller: item?.seller || null,
    variation: item?.variation || null,
    addons: Array.isArray(item?.addons) ? item.addons : [],
    giftMessage: item?.giftMessage || "",
    gstInvoice: Boolean(item?.gstInvoice),
    subscriptionPlan: item?.subscriptionPlan || null,
    kind: item?.kind || item?.source || "product",
    schedule: item?.schedule || null,
    totalPrice: coerceNumber(item?.totalPrice, price * quantity),
    metadata: typeof item?.metadata === "object" && item?.metadata !== null ? item.metadata : {},
    addressId: item?.addressId || null,
    notes: item?.notes || "",
  };
  return normalized;
};

const normalizeList = (items) =>
  (Array.isArray(items) ? items : [])
    .map(normalizeForLocal)
    .filter(Boolean);

const getLocalState = () => normalizeList(readLocal());
const commitLocalState = (items) => {
  const normalized = normalizeList(items);
  writeLocal(normalized);
  return normalized;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  // If no API base set, start in local mode
  const [apiAvailable, setApiAvailable] = useState(Boolean(API_BASE));

  const fetchCart = async () => {
    if (!apiAvailable) {
      setCartItems(getLocalState());
      return;
    }
    try {
      const { data } = await axios.get(withBase("/api/cart"), demoHeaders);
      const payload = Array.isArray(data?.items) ? normalizeList(data.items) : [];
      setCartItems(payload);
    } catch (e) {
      console.warn("Cart API unavailable, switching to localStorage:", e?.message || e);
      setApiAvailable(false);
      setCartItems(getLocalState());
    }
  };

  const addToCart = async (item) => {
    const resolvedId = keyOf(item) ?? fallbackIdFromItem(item);
    if (!apiAvailable) {
      const normalized = normalizeForLocal(item);
      if (!normalized) return;
      const items = getLocalState();
      const idx = items.findIndex((it) => it.id === normalized.id);
      let next = [];
      if (idx >= 0) {
        const existing = items[idx];
        const nextQuantity = existing.quantity + normalized.quantity;
        next = [...items];
        next[idx] = {
          ...existing,
          ...normalized,
          quantity: nextQuantity,
          price: normalized.price ?? existing.price,
          totalPrice: coerceNumber(
            normalized.totalPrice,
            (normalized.price ?? existing.price ?? 0) * nextQuantity,
          ),
        };
      } else {
        next = [...items, normalized];
      }
      const committed = commitLocalState(next);
      setCartItems(committed);
      return;
    }
    try {
      await axios.post(
        withBase("/api/cart/add"),
        {
          productId: resolvedId,
          source: item?.source || "Studio",
          name: item?.title ?? item?.name ?? "Untitled",
          image: item?.image ?? item?.img ?? "",
          price: coerceNumber(item?.price, 0),
          quantity: coerceQuantity(item?.quantity, 1),
          seller: item?.seller || null,
          variation: item?.variation || null,
          addons: item?.addons || [],
          giftMessage: item?.giftMessage || "",
          gstInvoice: Boolean(item?.gstInvoice),
          subscriptionPlan: item?.subscriptionPlan || null,
          kind: item?.kind || "product",
          schedule: item?.schedule || null,
          totalPrice: coerceNumber(
            item?.totalPrice,
            coerceNumber(item?.price, 0) * coerceQuantity(item?.quantity, 1),
          ),
          addressId: item?.addressId || null,
          notes: item?.notes || "",
        },
        demoHeaders
      );
      await fetchCart();
    } catch (e) {
      console.warn("addToCart API failed, switching to localStorage:", e?.message || e);
      setApiAvailable(false);
      return addToCart({ ...item, productId: resolvedId }); // retry locally
    }
  };

  const updateQuantity = async (item, quantity) => {
    if (!apiAvailable) {
      const items = getLocalState();
      const id = keyOf(item) ?? fallbackIdFromItem(item);
      const idx = items.findIndex((it) => it.id === id);
      if (idx >= 0) {
        let next = [...items];
        if (quantity <= 0) {
          next.splice(idx, 1);
        } else {
          const parsedQuantity = coerceQuantity(quantity, 1);
          const current = next[idx];
          next[idx] = {
            ...current,
            quantity: parsedQuantity,
            totalPrice: (current.price ?? 0) * parsedQuantity,
          };
        }
        const committed = commitLocalState(next);
        setCartItems(committed);
      }
      return;
    }
    try {
      await axios.post(
        withBase("/api/cart/update"),
        {
          productId: keyOf(item) ?? fallbackIdFromItem(item),
          source: item?.source || "Studio",
          quantity: coerceQuantity(quantity, 1),
        },
        demoHeaders
      );
      await fetchCart();
    } catch (e) {
      console.warn("updateQuantity API failed, switching to localStorage:", e?.message || e);
      setApiAvailable(false);
      return updateQuantity(item, quantity); // retry locally
    }
  };

  const removeFromCart = async (item) => {
    if (!apiAvailable) {
      const targetId = keyOf(item) ?? fallbackIdFromItem(item);
      const next = getLocalState().filter((it) => it.id !== targetId);
      const committed = commitLocalState(next);
      setCartItems(committed);
      return;
    }
    try {
      await axios.post(
        withBase("/api/cart/remove"),
        {
          productId: keyOf(item) ?? fallbackIdFromItem(item),
          source: item?.source || "Studio",
        },
        demoHeaders
      );
      await fetchCart();
    } catch (e) {
      console.warn("removeFromCart API failed, switching to localStorage:", e?.message || e);
      setApiAvailable(false);
      return removeFromCart(item); // retry locally
    }
  };

  useEffect(() => { fetchCart(); }, []);

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, updateQuantity, removeFromCart, fetchCart, apiAvailable }}
    >
      {children}
    </CartContext.Provider>
  );
};
