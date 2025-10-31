import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";

const getItemKey = (item) => {
  const key = item?.productId ?? item?.id ?? item?._id ?? item?.slug;
  return key != null ? String(key) : null;
};

const mapToCartPayload = (item) => {
  const productId = item?.productId ?? item?.id ?? item?._id ?? item?.slug;
  if (productId == null) return null;
  return {
    productId: String(productId),
    title: item?.title ?? item?.name ?? "Untitled",
    image: item?.image ?? item?.img ?? "",
    price: Number(item?.price ?? 0),
    quantity: Number(item?.quantity ?? 1),
    seller: item?.seller || item?.source || "Marketplace",
    source: item?.source || "Wishlist",
    kind: item?.kind || undefined,
    metadata: item?.metadata || {},
  };
};

const resolveDetailLink = (item) => {
  if (!item) return null;
  const slug = item.slug || item.productSlug || item.productId || item.id;
  if (!slug) return null;
  const source = (item.source || "").toLowerCase();
  if (source.includes("material")) return `/warehouse/${slug}`;
  if (source.includes("studio")) return `/studio/${slug}`;
  if (source.includes("associate")) return `/associates`;
  if (source.includes("firm")) return `/firms`;
  return null;
};

const WishlistPage = () => {
  const navigate = useNavigate();
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const items = useMemo(() => (Array.isArray(wishlistItems) ? wishlistItems : []), [wishlistItems]);

  const [selectedIds, setSelectedIds] = useState(() => items.map(getItemKey).filter(Boolean));

  useEffect(() => {
    const ids = items.map(getItemKey).filter(Boolean);
    setSelectedIds((prev) => {
      if (!prev.length) return ids;
      const prevSet = new Set(prev);
      const preserved = ids.filter((id) => prevSet.has(id));
      const newly = ids.filter((id) => !prevSet.has(id));
      return [...preserved, ...newly];
    });
  }, [items]);

  const selectedItems = useMemo(() => items.filter((item) => selectedIds.includes(getItemKey(item))), [items, selectedIds]);
  const allSelectableIds = useMemo(() => items.map(getItemKey).filter(Boolean), [items]);
  const allSelected = allSelectableIds.length > 0 && selectedIds.length === allSelectableIds.length;
  const hasSelection = selectedItems.length > 0;
  const selectedTotal = selectedItems.reduce((sum, item) => sum + Number(item.price ?? 0), 0);

  const toggleSelectAll = (checked) => {
    setSelectedIds(checked ? allSelectableIds : []);
  };

  const toggleItemSelection = (item) => {
    const id = getItemKey(item);
    if (!id) return;
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id]));
  };

  const handleRemoveItem = async (item) => {
    const payload = mapToCartPayload(item);
    if (!payload) return;
    try {
      await removeFromWishlist(payload);
      const id = getItemKey(item);
      if (id) setSelectedIds((prev) => prev.filter((existing) => existing !== id));
      toast.success("Removed from wishlist");
    } catch (err) {
      console.error(err);
      toast.error("Could not remove item");
    }
  };

  const handleAddItemToCart = async (item) => {
    const payload = mapToCartPayload(item);
    if (!payload) {
      toast.error("Cannot move this item right now");
      return;
    }
    try {
      await addToCart(payload);
      await removeFromWishlist(payload);
      const id = getItemKey(item);
      if (id) setSelectedIds((prev) => prev.filter((existing) => existing !== id));
      toast.success("Moved to cart");
    } catch (err) {
      console.error(err);
      toast.error("Could not move item to cart");
    }
  };

  const handleMoveSelectedToCart = async () => {
    if (!hasSelection) return;
    const targets = selectedItems.slice();
    try {
      for (const target of targets) {
        const payload = mapToCartPayload(target);
        if (!payload) continue;
        await addToCart(payload);
        await removeFromWishlist(payload);
      }
      const removedIds = new Set(targets.map(getItemKey));
      setSelectedIds((prev) => prev.filter((id) => !removedIds.has(id)));
      toast.success("Selected items moved to cart");
    } catch (err) {
      console.error(err);
      toast.error("Could not move selected items");
    }
  };

  const handleRemoveSelected = async () => {
    if (!hasSelection) return;
    const targets = selectedItems.slice();
    try {
      for (const target of targets) {
        const payload = mapToCartPayload(target);
        if (payload) await removeFromWishlist(payload);
      }
      const removedIds = new Set(targets.map(getItemKey));
      setSelectedIds((prev) => prev.filter((id) => !removedIds.has(id)));
      toast.success("Removed selected items");
    } catch (err) {
      console.error(err);
      toast.error("Could not remove selected items");
    }
  };

  const handleNavigateToDetails = (item) => {
    const href = resolveDetailLink(item);
    if (href) {
      navigate(href);
    } else {
      toast.error("No detail page available yet");
    }
  };

  if (!items.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500 px-4">
        <p className="text-lg font-medium">Your wishlist is empty.</p>
        <p className="text-sm text-slate-400 mt-1">Browse the marketplace and add studios, materials, or services to revisit later.</p>
        <div className="mt-6 flex gap-3">
          <Link to="/studio" className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:border-slate-300 transition">Explore studios</Link>
          <Link to="/warehouse" className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:border-slate-300 transition">Shop materials</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <header className="flex flex-col gap-2">
          <p className="uppercase tracking-[0.3em] text-xs text-slate-400">Wishlist</p>
          <h1 className="text-3xl font-semibold">Saved items</h1>
          <p className="text-sm text-slate-600">{items.length} item{items.length === 1 ? "" : "s"} saved for later.</p>
        </header>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 accent-slate-900"
              checked={allSelected}
              onChange={(event) => toggleSelectAll(event.target.checked)}
            />
            <span>Select all ({selectedItems.length}/{items.length})</span>
          </label>
          <div className="flex flex-wrap gap-2 text-sm">
            <button
              type="button"
              onClick={handleMoveSelectedToCart}
              disabled={!hasSelection}
              className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Move selected to cart
            </button>
            <button
              type="button"
              onClick={handleRemoveSelected}
              disabled={!hasSelection}
              className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Remove selected
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => {
            const key = getItemKey(item) || `wishlist-${index}`;
            const isSelected = getItemKey(item) ? selectedIds.includes(getItemKey(item)) : false;
            const priceDisplay = Number.isFinite(Number(item.price)) ? 
              new Intl.NumberFormat(undefined, { style: "currency", currency: item.currency || "USD", maximumFractionDigits: 0 }).format(Number(item.price)) : "On request";
            const detailLink = resolveDetailLink(item);
            return (
              <div
                key={key}
                className={`bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm ${isSelected ? "ring-1 ring-slate-300" : ""}`}
              >
                <div className="flex gap-3">
                  <input
                    type="checkbox"
                    className="mt-2 h-4 w-4 accent-slate-900"
                    checked={isSelected}
                    onChange={() => toggleItemSelection(item)}
                  />
                  <img
                    src={item.image || item.img || "https://placehold.co/100x100"}
                    alt={item.title || item.name || "Wishlist item"}
                    className="h-20 w-20 rounded-lg object-cover border border-slate-200"
                  />
                  <div className="flex-1 space-y-1">
                    <h2 className="text-sm font-semibold text-slate-900">{item.title || item.name || "Saved item"}</h2>
                    {item.source && (
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{item.source}</p>
                    )}
                    <p className="text-sm font-semibold text-slate-900">{priceDisplay}</p>
                    {item.metadata?.category && (
                      <p className="text-xs text-slate-500">Category: {item.metadata.category}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-600">
                      <button
                        type="button"
                        onClick={() => handleAddItemToCart(item)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 transition"
                      >
                        Move to cart
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 transition"
                      >
                        Remove
                      </button>
                      {detailLink ? (
                        <button
                          type="button"
                          onClick={() => handleNavigateToDetails(item)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 transition"
                        >
                          View details
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2 text-sm text-slate-600">
          <div className="flex justify-between">
            <span>Selected items</span>
            <span>{selectedItems.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Estimated total</span>
            <span>{new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(selectedTotal)}</span>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleMoveSelectedToCart}
              disabled={!hasSelection}
              className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Move selected to cart
            </button>
            <button
              type="button"
              onClick={handleRemoveSelected}
              disabled={!hasSelection}
              className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Remove selected
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default WishlistPage;
