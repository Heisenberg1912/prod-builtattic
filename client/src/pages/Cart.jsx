import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  HiOutlineInformationCircle,
  HiOutlineReceiptPercent,
  HiOutlineTruck,
  HiOutlineShieldCheck,
  HiOutlineClock,
  HiOutlineArrowPathRoundedSquare,
} from "react-icons/hi2";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { associateCatalog } from "../data/services.js";
import { placeOrder } from "../services/orders.js";

const ADDRESS_STORAGE_KEY = "builtattic_profile_addresses";

const readStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const COUPONS = [
  {
    code: "BULK5",
    description: "5% off on material carts above INR 50,000",
    type: "percent",
    value: 5,
    condition: (subtotal) => subtotal >= 50000,
  },
  {
    code: "FREIGHT1000",
    description: "INR 1,000 freight credit on multi-seller orders",
    type: "flat",
    value: 1000,
    condition: (_subtotal, sellers) => sellers > 1,
  },
];
const formatCurrency = (value, currency = "INR") => {
  if (!Number.isFinite(value)) return "On request";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};

const getItemKey = (item) => {
  const key =
    item?.productId ??
    item?.id ??
    item?._id ??
    item?.slug ??
    item?.code ??
    item?.sku ??
    item?.metadata?.id;
  if (key != null) return String(key);
  if (item?.title) return `title-${item.title}`;
  return null;
};

const toWishlistPayload = (item) => ({
  productId: item?.productId ?? item?.id ?? item?._id ?? item?.slug ?? item?.code,
  source: item?.source || item?.kind || "Studio",
  title: item?.title ?? item?.name ?? "Untitled",
  name: item?.title ?? item?.name ?? "Untitled",
  price: Number(item?.price ?? item?.totalPrice ?? 0),
  image: item?.image ?? item?.img ?? "",
});

const getScheduleKey = (item, index = 0) => {
  const base =
    getItemKey(item) ??
    item?.id ??
    item?.serviceId ??
    item?.metadata?.scheduleId;
  if (base != null) return String(base);
  if (item?.title) return `slot-${item.title}-${index}`;
  return `slot-${index}`;
};

const Cart = () => {
  const navigate = useNavigate();
  const [placingOrder, setPlacingOrder] = useState(false);
  const { cartItems, updateQuantity, removeFromCart, fetchCart, apiAvailable } = useCart();
  const { addToWishlist } = useWishlist();
  const safeCartItems = useMemo(
    () => (Array.isArray(cartItems) ? cartItems : []),
    [cartItems],
  );
  const demoMessage =
    "This is a demo, we are unable to serve you right now, apologies for the inconvenience caused!";
  const addresses = readStorage(ADDRESS_STORAGE_KEY, []);

  const [selectedIds, setSelectedIds] = useState(() =>
    safeCartItems.map(getItemKey).filter(Boolean),
  );
  const [selectedAddressId, setSelectedAddressId] = useState(
    addresses.find((addr) => addr.isDefault)?.id || addresses[0]?.id || null,
  );
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [gstInvoice, setGstInvoice] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [serviceSchedules, setServiceSchedules] = useState({});

  useEffect(() => {
    const ids = safeCartItems.map(getItemKey).filter(Boolean);
    setSelectedIds((prev) => {
      if (!prev?.length) return ids;
      const prevSet = new Set(prev);
      const preserved = ids.filter((id) => prevSet.has(id));
      const newly = ids.filter((id) => !prevSet.has(id));
      return [...preserved, ...newly];
    });
  }, [safeCartItems]);

  useEffect(() => {
    setCouponError("");
  }, [couponCode]);

  const groupedItems = useMemo(() => {
    const map = new Map();
    safeCartItems.forEach((item) => {
      const seller = item.seller || "Builtattic Fulfilled";
      if (!map.has(seller)) map.set(seller, []);
      map.get(seller).push(item);
    });
    return Array.from(map.entries()).map(([seller, items]) => ({ seller, items }));
  }, [safeCartItems]);

  const selectedItems = useMemo(
    () => safeCartItems.filter((item) => selectedIds.includes(getItemKey(item))),
    [safeCartItems, selectedIds],
  );

  const subtotal = useMemo(() => {
    return safeCartItems.reduce((sum, item) => {
      const lineTotal = Number(item.totalPrice ?? item.price * item.quantity);
      const addonTotal = Array.isArray(item.addons)
        ? item.addons.reduce((acc, addon) => acc + Number(addon.price || 0), 0)
        : 0;
      return sum + lineTotal + addonTotal;
    }, 0);
  }, [safeCartItems]);

  const selectionSubtotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => {
      const lineTotal = Number(item.totalPrice ?? item.price * item.quantity);
      const addonTotal = Array.isArray(item.addons)
        ? item.addons.reduce((acc, addon) => acc + Number(addon.price || 0), 0)
        : 0;
      return sum + lineTotal + addonTotal;
    }, 0);
  }, [selectedItems]);

  const sellersCount = groupedItems.length;
  const selectedSellerCount = useMemo(() => {
    const sellers = new Set();
    selectedItems.forEach((item) => sellers.add(item.seller || "Builtattic Fulfilled"));
    return sellers.size;
  }, [selectedItems]);

  const computedCoupon = useMemo(() => {
    if (!appliedCoupon) return null;
    const entry = COUPONS.find((coupon) => coupon.code === appliedCoupon);
    if (!entry) return null;
    if (entry.condition && !entry.condition(selectionSubtotal, selectedSellerCount)) return null;
    return entry;
  }, [appliedCoupon, selectionSubtotal, selectedSellerCount]);

  const couponValue = computedCoupon
    ? computedCoupon.type === "percent"
      ? (selectionSubtotal * computedCoupon.value) / 100
      : computedCoupon.value
    : 0;

  const tax = gstInvoice ? selectionSubtotal * 0.18 : 0;
  const grandTotal = Math.max(selectionSubtotal - couponValue + tax, 0);
  const allSelectableIds = useMemo(
    () => safeCartItems.map(getItemKey).filter(Boolean),
    [safeCartItems],
  );
  const allSelected = allSelectableIds.length > 0 && selectedIds.length === allSelectableIds.length;
  const hasSelection = selectedItems.length > 0;

  const toggleSelectAll = (checked) => {
    setSelectedIds(checked ? allSelectableIds : []);
  };

  const toggleItemSelection = (item) => {
    const id = getItemKey(item);
    if (!id) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id],
    );
  };

  const handleUpdateQuantity = (item, nextQuantity) => {
    const qty = Math.max(1, Number(nextQuantity) || 1);
    updateQuantity(item, qty);
  };

  const handleRemoveSelected = async () => {
    if (!hasSelection) return;
    const targets = safeCartItems.filter((item) => selectedIds.includes(getItemKey(item)));
    const targetIds = new Set(targets.map(getItemKey));
    try {
      for (const target of targets) {
        await removeFromCart(target);
      }
      setSelectedIds((prev) => prev.filter((id) => !targetIds.has(id)));
      toast.success("Selected items removed from cart");
    } catch (err) {
      console.error(err);
      toast.error("Could not remove selected items");
    }
  };

  const canWishlist = typeof addToWishlist === "function";

  const handleRemoveItem = async (item) => {
    try {
      await removeFromCart(item);
      const id = getItemKey(item);
      if (id) setSelectedIds((prev) => prev.filter((existing) => existing !== id));
      toast.success("Removed from cart");
    } catch (err) {
      console.error(err);
      toast.error("Could not remove item");
    }
  };

  const toOrderItemPayload = (item) => {
    if (!item) return null;
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const parsedPrice = Number(item.price ?? 0);
    const parsedTotal = Number(item.totalPrice ?? parsedPrice * quantity);
    const unitPrice = parsedTotal && quantity ? parsedTotal / quantity : parsedPrice;
    const productIdentifier = item.productId || item.id || item._id || item.slug || null;
    const normalizedId =
      productIdentifier && /^[0-9a-fA-F]{24}$/.test(String(productIdentifier))
        ? String(productIdentifier)
        : null;
    const normalizedSlug =
      !normalizedId && productIdentifier ? String(productIdentifier) : item.slug || item.productSlug || null;

    return {
      productId: normalizedId,
      productSlug: normalizedSlug,
      quantity,
      unitPrice: Number(unitPrice.toFixed(2)),
      currency: item.currency || item.pricing?.currency || 'INR',
      cartItemId: item._id ? String(item._id) : item.cartItemId || null,
      source: item.kind || item.source || null,
      title: item.title || item.name || null,
    };
  };

  const handlePlaceOrder = async () => {
    if (!hasSelection) {
      toast.error("Select at least one item to continue.");
      return;
    }
    if (!apiAvailable) {
      toast(demoMessage, { duration: 4000, style: { maxWidth: "420px" } });
      return;
    }

    const itemsPayload = selectedItems
      .map(toOrderItemPayload)
      .filter((item) => item && (item.productId || item.productSlug));

    if (!itemsPayload.length) {
      toast.error("Unable to resolve selected items for checkout.");
      return;
    }

    const cartItemIds = itemsPayload
      .map((item) => item.cartItemId)
      .filter(Boolean)
      .map(String);

    setPlacingOrder(true);
    try {
      const order = await placeOrder({
        items: itemsPayload,
        checkout: {
          addressId: selectedAddressId || null,
          gstInvoice,
          notes: orderNotes || '',
          couponCode: computedCoupon?.code || null,
          metadata: { addressBookSize: addresses.length },
        },
        metadata: {
          selectionSubtotal,
          couponValue,
          tax,
          grandTotal,
          selectedIds,
        },
        pricing: { discount: couponValue, tax },
        cartItemIds,
        removeFromCart: true,
      });

      const label = order?._id ? `Order #${order._id}` : 'Order';
      toast.success(`${label} placed successfully`);
      await fetchCart();
      setSelectedIds([]);
      navigate('/orders');
    } catch (error) {
      const message =
        error?.response?.message ||
        error?.response?.error ||
        error?.message ||
        'Unable to place order right now.';
      toast.error(message);
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleMoveToWishlist = async (item) => {
    if (!canWishlist) {
      toast.error("Wishlist unavailable");
      return;
    }
    try {
      await addToWishlist(toWishlistPayload(item));
      await removeFromCart(item);
      const id = getItemKey(item);
      if (id) setSelectedIds((prev) => prev.filter((existing) => existing !== id));
      toast.success("Moved to wishlist");
    } catch (err) {
      console.error(err);
      toast.error("Could not move item to wishlist");
    }
  };

  const handleMoveSelectedToWishlist = async () => {
    if (!hasSelection) return;
    if (!canWishlist) {
      toast.error("Wishlist unavailable");
      return;
    }
    const targets = safeCartItems.filter((item) => selectedIds.includes(getItemKey(item)));
    const targetIds = new Set(targets.map(getItemKey));
    try {
      for (const target of targets) {
        await addToWishlist(toWishlistPayload(target));
        await removeFromCart(target);
      }
      setSelectedIds((prev) => prev.filter((id) => !targetIds.has(id)));
      toast.success("Moved selected items to wishlist");
    } catch (err) {
      console.error(err);
      toast.error("Could not move selected items to wishlist");
    }
  };

  const handleApplyCoupon = () => {
    if (!hasSelection) {
      setCouponError("Select at least one item to apply a coupon");
      return;
    }
    const entry = COUPONS.find((coupon) => coupon.code === couponCode.toUpperCase());
    if (!entry) {
      setCouponError("Coupon not recognized");
      return;
    }
    if (entry.condition && !entry.condition(selectionSubtotal, selectedSellerCount)) {
      setCouponError("Cart does not meet coupon criteria");
      return;
    }
    setAppliedCoupon(entry.code);
    setCouponError("");
    toast.success(`Coupon ${entry.code} applied`);
  };

  const handleScheduleChange = (itemRef, slot) => {
    const id = typeof itemRef === "string" ? itemRef : getItemKey(itemRef);
    if (!id) return;
    setServiceSchedules((prev) => ({ ...prev, [id]: slot }));
  };

  const getServiceDetails = (item) => {
    if (!item) return null;
    const id = item.serviceId || item.productId || item.id;
    return associateCatalog.find((associate) => associate._id === id) || null;
  };

  useEffect(() => {
    setServiceSchedules((prev) => {
      const next = { ...prev };
      safeCartItems.forEach((item, index) => {
        if (item.kind !== "service") return;
        const key = getScheduleKey(item, index);
        if (!key || next[key]) return;
        const fallback = item.schedule || getServiceDetails(item)?.booking?.slots?.[0] || null;
        if (fallback) next[key] = fallback;
      });
      return next;
    });
  }, [safeCartItems]);
  if (safeCartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500">
        <HiOutlineInformationCircle className="w-10 h-10 mb-3" />
        <p>Your cart is empty. Explore the marketplace to add materials or service engagements.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm">
          {demoMessage}
        </div>
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="uppercase tracking-[0.35em] text-xs text-slate-400">
              checkout
            </p>
            <h1 className="text-3xl font-semibold">Order review</h1>
            <p className="text-sm text-slate-600">
              {safeCartItems.length} line items across {sellersCount} seller{sellersCount > 1 ? "s" : ""}.
            </p>
            <p className="text-xs text-slate-500">
              Selected {selectedItems.length} item{selectedItems.length === 1 ? "" : "s"} for checkout.
            </p>
          </div>
          <div className="text-sm text-slate-500 flex items-center gap-2">
            <HiOutlineShieldCheck className="w-5 h-5" />
            Payment secured with escrow release on QA approval.
          </div>
        </header>

        <section className="grid lg:grid-cols-[1.6fr_0.8fr] gap-6">
          <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-slate-900"
                  checked={allSelected}
                  onChange={(event) => toggleSelectAll(event.target.checked)}
                />
                <span>Select all ({selectedItems.length}/{safeCartItems.length})</span>
              </label>
              <div className="flex flex-wrap gap-2 text-sm">
                <button
                  type="button"
                  onClick={handleRemoveSelected}
                  disabled={!hasSelection}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Remove selected
                </button>
                {canWishlist && (
                  <button
                    type="button"
                    onClick={handleMoveSelectedToWishlist}
                    disabled={!hasSelection}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Move selected to wishlist
                  </button>
                )}
              </div>
            </div>
            {groupedItems.map(({ seller, items }) => {
              const isMultiSeller = groupedItems.length > 1;
              return (
                <article key={seller} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                  <header className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-[0.3em]">
                        Seller
                      </p>
                      <h2 className="text-base font-semibold text-slate-900">{seller}</h2>
                    </div>
                    {isMultiSeller && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <HiOutlineTruck className="w-4 h-4" /> Consolidated freight available
                      </span>
                    )}
                  </header>

                  <div className="space-y-4">
                    {items.map((item, itemIndex) => {
                      const itemKey = getItemKey(item) || `${seller}-${itemIndex}`;
                      const isSelected = itemKey ? selectedIds.includes(itemKey) : false;
                      const quantity = Math.max(1, Number(item.quantity) || 1);
                      const priceEach = Number(item.price ?? 0);
                      const addonTotal = Array.isArray(item.addons)
                        ? item.addons.reduce((acc, addon) => acc + Number(addon.price || 0), 0)
                        : 0;
                      const baseLineTotal = Number(item.totalPrice ?? priceEach * quantity);
                      const lineTotal = baseLineTotal + addonTotal;
                      const serviceDetails = item.kind === "service" ? getServiceDetails(item) : null;
                      const slots = serviceDetails?.booking?.slots || [];
                      const scheduleKey = itemKey || item.id || item.serviceId || String(itemIndex);
                      const selectedSlot = serviceSchedules[scheduleKey] || slots[0];
                      return (
                        <div
                          key={scheduleKey}
                          className={`border border-slate-200 rounded-xl px-4 py-3 ${isSelected ? "ring-1 ring-slate-300" : ""}`}
                        >
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="flex flex-1 gap-3">
                              <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 accent-slate-900"
                                checked={isSelected}
                                onChange={() => toggleItemSelection(item)}
                              />
                              <div className="flex-1 space-y-1">
                                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                                {item.variation && (
                                  <p className="text-xs text-slate-500">Variation: {item.variation}</p>
                                )}
                                <p className="text-xs text-slate-500">
                                  Qty {quantity} × {formatCurrency(priceEach)} each
                                </p>
                                {addonTotal > 0 && (
                                  <p className="text-xs text-slate-500">
                                    Add-ons: {item.addons.map((addon) => addon.name || addon.title).join(", ")}
                                  </p>
                                )}
                                {item.giftMessage && (
                                  <p className="text-xs text-slate-500">Gift note: {item.giftMessage}</p>
                                )}
                                {item.subscriptionPlan && (
                                  <p className="text-xs text-emerald-600">
                                    Subscription plan: {item.subscriptionPlan}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 text-sm text-slate-700">
                              <span className="font-semibold text-slate-900">
                                {formatCurrency(lineTotal)}
                              </span>
                              <div className="inline-flex items-center border border-slate-200 rounded-lg overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(item, quantity - 1)}
                                  className="px-3 py-1 text-slate-600 hover:bg-slate-100"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={quantity}
                                  onChange={(event) => handleUpdateQuantity(item, event.target.value)}
                                  className="w-16 border-l border-r border-slate-200 px-3 py-1 text-center text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(item, quantity + 1)}
                                  className="px-3 py-1 text-slate-600 hover:bg-slate-100"
                                >
                                  +
                                </button>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-slate-500">
                                {canWishlist && (
                                  <button
                                    type="button"
                                    onClick={() => handleMoveToWishlist(item)}
                                    className="hover:text-slate-700"
                                  >
                                    Move to wishlist
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(item)}
                                  className="hover:text-slate-700"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>

                          {serviceDetails && (
                            <div className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-600 space-y-2">
                              <p className="uppercase tracking-[0.2em] text-slate-400">
                                Service schedule
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {slots.map((slot) => {
                                  const active =
                                    selectedSlot?.date === slot.date && selectedSlot?.start === slot.start;
                                  return (
                                    <button
                                      key={`${slot.date}-${slot.start}`}
                                      onClick={() => handleScheduleChange(scheduleKey, slot)}
                                      className={`px-3 py-1.5 rounded-lg border text-xs ${
                                        active
                                          ? "border-slate-900 bg-slate-900 text-white"
                                          : "border-slate-200 bg-white hover:border-slate-300"
                                      }`}
                                    >
                                      {slot.date} · {slot.start} - {slot.end} ({slot.type})
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="flex items-center gap-2 text-slate-500">
                                <HiOutlineClock className="w-4 h-4" />
                                Lead time {serviceDetails.booking?.leadTimeHours || 24} hours · Reschedule window {serviceDetails.booking?.rescheduleWindowHours || 6} hours
                              </div>
                              <div className="flex items-center gap-2 text-slate-500">
                                <HiOutlineArrowPathRoundedSquare className="w-4 h-4" />
                                Cancel up to {serviceDetails.booking?.cancelWindowHours || 12} hours before slot start
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="space-y-6">
            <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-slate-900">Delivery & billing</h2>
              <div className="space-y-2 text-sm text-slate-600">
                <label className="uppercase tracking-[0.3em] text-xs text-slate-400">
                  Deliver to
                </label>
                <select
                  value={selectedAddressId || ""}
                  onChange={(event) => setSelectedAddressId(event.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                >
                  {addresses.map((address) => (
                    <option key={address.id} value={address.id}>
                      {address.label} · {address.city}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={gstInvoice}
                    onChange={(event) => setGstInvoice(event.target.checked)}
                  />
                  Generate GST invoice with order
                </label>
                <textarea
                  value={orderNotes}
                  onChange={(event) => setOrderNotes(event.target.value)}
                  placeholder="Delivery instructions or compliance notes"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <HiOutlineReceiptPercent className="w-5 h-5 text-slate-500" />
                Apply coupon
              </h2>
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value)}
                  placeholder="Enter code"
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold"
                >
                  Apply
                </button>
              </div>
              {couponError && <p className="text-xs text-rose-500">{couponError}</p>}
              <ul className="text-xs text-slate-500 space-y-1">
                {COUPONS.map((coupon) => (
                  <li key={coupon.code}>
                    <span className="font-medium text-slate-700">{coupon.code}</span> · {coupon.description}
                  </li>
                ))}
              </ul>
            </section>

            <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2 text-sm text-slate-600">
              <h2 className="text-base font-semibold text-slate-900">Order summary</h2>
              <div className="flex justify-between">
                <span>Cart subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Selected subtotal</span>
                <span>{formatCurrency(selectionSubtotal)}</span>
              </div>
              {computedCoupon && (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon {computedCoupon.code}</span>
                  <span>-{formatCurrency(couponValue)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{gstInvoice ? "GST (18%)" : "Taxes (estimated)"}</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-slate-900 border-t border-slate-200 pt-2">
                <span>Net payable (incl. taxes)</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
                          <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={!hasSelection || placingOrder}
                className="w-full mt-4 inline-flex justify-center items-center gap-2 px-4 py-3 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {placingOrder ? 'Placing order�' : 'Place order'}
              </button>
              {!hasSelection && (
                <p className="text-xs text-rose-500">Select at least one item to continue.</p>
              )}
              <p className="text-xs text-slate-500">
                Escrow released once QA certificates and delivery milestones are acknowledged.
              </p>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
};

export default Cart;








