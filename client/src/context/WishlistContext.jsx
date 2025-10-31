import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const WishlistContext = createContext();
export const useWishlist = () => useContext(WishlistContext);

// Helpers
const WISHLIST_LS_KEY = "wishlist";
const trimEndSlash = (s) => (s || "").replace(/\/+$/, "");
const leadSlash = (s) => (s?.startsWith("/") ? s : `/${s || ""}`);
const API_BASE = trimEndSlash(import.meta?.env?.VITE_API_BASE_URL || "");
const withBase = (path) => (API_BASE ? `${API_BASE}${leadSlash(path)}` : leadSlash(path));
const demoHeaders = { headers: { "x-demo-user": "demo-user" } };

const safeParse = (s, fb) => { try { return JSON.parse(s); } catch { return fb; } };
const readLocal = () => safeParse(localStorage.getItem(WISHLIST_LS_KEY), []);
const writeLocal = (items) => localStorage.setItem(WISHLIST_LS_KEY, JSON.stringify(items || []));
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
  return base ? `wish-${String(base).replace(/\s+/g, "-").toLowerCase()}` : null;
};
const coercePrice = (value, fallback = 0) => {
  if (value == null || value === "") return fallback;
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const parsed = parseFloat(value.replace(/[^0-9.-]+/g, ""));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

// Client normalized item (local mode)
const normalize = (item) => {
  if (!item) return null;
  const resolvedId = keyOf(item) ?? fallbackIdFromItem(item);
  if (!resolvedId) return null;
  const pid = String(resolvedId);
  return {
    id: pid,            // string id for consistent Set checks
    productId: pid,     // include productId for API/remove compatibility
    title: item?.title ?? item?.name ?? "Untitled",
    price: coercePrice(item?.price, 0),
    image: item?.image ?? item?.img ?? "",
    source: item?.source || "Studio",
  };
};

// Server item -> client normalized (API mode)
const normalizeServerItem = (it) => {
  if (!it) return null;
  const resolvedId = keyOf(it) ?? fallbackIdFromItem(it);
  if (!resolvedId) return null;
  const pid = String(resolvedId);
  return {
    id: pid,
    productId: pid,
    title: it?.name ?? it?.title ?? "Untitled",
    price: coercePrice(it?.price, 0),
    image: it?.image ?? it?.img ?? "",
    source: it?.source || "Studio",
  };
};

const normalizeList = (items) =>
  (Array.isArray(items) ? items : [])
    .map(normalize)
    .filter(Boolean);
const normalizeServerList = (items) =>
  (Array.isArray(items) ? items : [])
    .map(normalizeServerItem)
    .filter(Boolean);
const readNormalizedLocal = () => normalizeList(readLocal());

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [apiAvailable, setApiAvailable] = useState(Boolean(API_BASE));

  const fetchWishlist = async () => {
    if (!apiAvailable) {
      // normalize local items for consistent shape
      setWishlistItems(readNormalizedLocal());
      return;
    }
    try {
      const { data } = await axios.get(withBase("/api/wishlist"), demoHeaders);
      setWishlistItems(normalizeServerList(data?.items));
    } catch (e) {
      console.warn("Wishlist API unavailable, using localStorage:", e?.message || e);
      setApiAvailable(false);
      setWishlistItems(readNormalizedLocal());
    }
  };

  const addToWishlist = async (item) => {
    const resolvedId = keyOf(item) ?? fallbackIdFromItem(item);
    if (!apiAvailable) {
      const norm = normalize(item);
      if (!norm) return;
      const items = readNormalizedLocal();
      if (items.some((it) => it.productId === norm.productId)) {
        setWishlistItems(items);
        return;
      }
      const next = [...items, norm];
      writeLocal(next);
      setWishlistItems(next);
      return;
    }
    try {
      await axios.post(
        withBase("/api/wishlist/add"),
        {
          productId: resolvedId,
          source: item?.source || "Studio",
          name: item?.title ?? item?.name ?? "Untitled",
          image: item?.image ?? item?.img ?? "",
          price: coercePrice(item?.price, 0),
        },
        demoHeaders
      );
      await fetchWishlist();
    } catch (e) {
      console.warn("addToWishlist API failed, using localStorage:", e?.message || e);
      setApiAvailable(false);
      return addToWishlist({ ...item, productId: resolvedId }); // retry locally
    }
  };

  const removeFromWishlist = async (item) => {
    if (!apiAvailable) {
      const targetId = keyOf(item) ?? fallbackIdFromItem(item);
      if (!targetId) return;
      const next = readNormalizedLocal().filter(
        (entry) => entry.productId !== String(targetId),
      );
      writeLocal(next);
      setWishlistItems(next);
      return;
    }
    try {
      await axios.post(
        withBase("/api/wishlist/remove"),
        { productId: keyOf(item) ?? fallbackIdFromItem(item), source: item?.source || "Studio" },
        demoHeaders
      );
      await fetchWishlist();
    } catch (e) {
      console.warn("removeFromWishlist API failed, using localStorage:", e?.message || e);
      setApiAvailable(false);
      return removeFromWishlist(item); // retry locally
    }
  };

  useEffect(() => { fetchWishlist(); }, []);

  const isInWishlist = (candidate) => {
    const target = keyOf(candidate) ?? fallbackIdFromItem(candidate);
    if (!target) return false;
    const pid = String(target);
    return wishlistItems.some((entry) => entry.productId === pid);
  };

  return (
    <WishlistContext.Provider
      value={{ wishlistItems, addToWishlist, removeFromWishlist, fetchWishlist, isInWishlist, apiAvailable }}
    >
      {children}
    </WishlistContext.Provider>
  );
};
