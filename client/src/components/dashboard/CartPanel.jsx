import React from "react";
import { Link } from "react-router-dom";

const asCurrency = (value, currency = "USD") => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return `${currency} 0`;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(numeric);
  } catch {
    return `${currency} ${numeric.toFixed(0)}`;
  }
};

const asQuantity = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? Math.max(1, Math.round(numeric)) : 1;
};

export default function CartPanel({
  items = [],
  onRemove,
  title = "Ready to buy",
  description = "Studios, associates, and materials you add to cart show up here.",
  limit = 3,
}) {
  const limited = items.slice(0, limit);
  const itemCount = items.length;
  const subtotal = items.reduce((sum, item) => {
    const price = Number(item?.totalPrice ?? item?.price ?? 0);
    const qty = asQuantity(item?.quantity);
    return sum + price * qty;
  }, 0);
  const currency = items[0]?.currency || "USD";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-1 mb-4">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
        <p className="text-xs text-slate-400">
          {itemCount ? `${itemCount} ${itemCount === 1 ? 'item' : 'items'} • Subtotal ${asCurrency(subtotal, currency)}` : 'Cart empty'}
        </p>
      </div>

      {itemCount === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          <p>Add studios, associates, or materials from the marketplace to kick off an order.</p>
          <Link
            to="/products"
            className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
          >
            Browse marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
            {limited.map((item) => (
              <li key={item.cartItemId || item.id || item._id || item.title} className="flex items-start justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.title || item.name || 'Cart item'}</p>
                  <p className="text-xs text-slate-500">
                    {asCurrency(item?.price ?? item?.totalPrice ?? 0, item.currency || currency)} · Qty {asQuantity(item?.quantity)}
                  </p>
                </div>
                {onRemove ? (
                  <button
                    type="button"
                    onClick={() => onRemove(item)}
                    className="text-xs text-slate-400 hover:text-rose-600"
                  >
                    Remove
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          {itemCount > limited.length ? (
            <p className="text-xs text-slate-500">+{itemCount - limited.length} more saved in your cart</p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Link
              to="/cart"
              className="flex-1 min-w-[120px] rounded-lg border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-700 transition hover:border-slate-300"
            >
              View cart
            </Link>
            <Link
              to="/buy"
              className="flex-1 min-w-[120px] rounded-lg bg-slate-900 px-3 py-2 text-center text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
