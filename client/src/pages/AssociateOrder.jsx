import React, { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useCart } from "../context/CartContext.jsx";
import { buyNow } from "../services/orders.js";
import Footer from "../components/Footer.jsx";

const buildMailtoLink = (email, subject, body) => {
  if (!email) return null;
  const params = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  const query = params.length ? `?${params.join("&")}` : "";
  return `mailto:${email}${query}`;
};

const buildCartItem = ({ associate, fallbackId, price, currency, cover, title, contactEmail }) => {
  if (!associate && !title) return null;
  const resolvedId =
    associate?.id ||
    associate?._id ||
    associate?.slug ||
    fallbackId ||
    (title ? `associate-${title.replace(/\s+/g, "-").toLowerCase()}` : null);
  if (!resolvedId) return null;
  const numericPrice = Number.isFinite(Number(price)) ? Number(price) : 0;
  return {
    id: resolvedId,
    productId: resolvedId,
    title: title || associate?.title || "Associate",
    price: numericPrice,
    currency: currency || "USD",
    image: cover || associate?.heroImage || associate?.profileImage || "",
    quantity: 1,
    source: "associate",
    metadata: {
      associateId: resolvedId,
      contactEmail: contactEmail || associate?.user?.email,
    },
  };
};

const AssociateOrder = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const state = location.state || {};
  const associate = state.associate || state.profile || null;
  const title = state.title || associate?.title || "Associate";
  const price = state.price || associate?.priceLabel || associate?.rates?.daily || associate?.rates?.hourly || "";
  const currency = state.currency || associate?.currency || associate?.rates?.currency || "USD";
  const cover = state.cover || associate?.heroImage || associate?.coverImage || associate?.profileImage || "";
  const contactEmail = state.contactEmail || associate?.contactEmail || associate?.user?.email || "";

  const [form, setForm] = useState({
    name: "",
    email: contactEmail,
    project: "",
    budget: price ? String(price) : "",
  });

  const mailto = buildMailtoLink(
    contactEmail,
    `Order enquiry for ${title}`,
    `Hi ${title},\n\nI’d like to start an order. Here are the project details:\n\n- Scope: ${form.project || ""}\n- Budget: ${form.budget || price || "TBD"} ${currency}\n- Timeline:\n\nThanks!`
  );

  const cartItem = useMemo(
    () => buildCartItem({ associate, fallbackId: id, price, currency, cover, title, contactEmail }),
    [associate, id, price, currency, cover, title, contactEmail]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      if (state.buyHref) {
        window.open(state.buyHref, "_blank", "noopener,noreferrer");
        toast.success("Opening service pack");
      }
      if (!cartItem) {
        toast.error("Unable to prepare cart item. Try again.");
        return;
      }

      const payload = {
        items: [
          {
            productId: cartItem.productId,
            quantity: 1,
            title: cartItem.title,
            price: cartItem.price,
            currency: cartItem.currency,
            metadata: {
              source: "associate",
              associateId: cartItem.productId,
              brief: form.project,
              budget: form.budget,
              contactName: form.name,
              contactEmail: form.email,
            },
          },
        ],
        ownerType: "associate",
        note: form.project,
        budget: form.budget,
        contact: {
          name: form.name,
          email: form.email,
        },
      };

      try {
        await buyNow(payload);
        toast.success("Order submitted to backend");
        navigate("/orders");
        return;
      } catch (error) {
        console.error("buy_now_failed", error);
        toast.error(error?.message || "Buy now failed, adding to cart instead");
      }

      await addToCart(cartItem);
      toast.success("Added to cart");
      navigate("/cart");
    } catch (error) {
      console.error("associate_order_submit_failed", error);
      toast.error(error?.message || "Could not start order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white text-slate-900">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Start order</p>
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className="text-sm text-slate-600">
            Share a brief to kick off a scoped quote. We will route it to the associate and operations.
          </p>
        </div>

        <div className="rounded-3xl bg-white shadow-lg ring-1 ring-slate-100 p-6 space-y-4">
          <div className="flex items-center gap-4">
            {cover ? <img src={cover} alt={title} className="h-16 w-16 rounded-2xl object-cover" /> : null}
            <div>
              <p className="text-sm font-semibold text-slate-900">{title}</p>
              <p className="text-sm text-slate-600">
                {price ? `Starting at ${price}` : "Set pricing will be shared after review."} {currency ? `(${currency})` : ""}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-slate-700">Your name</span>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-slate-700">Email</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
                />
              </label>
            </div>
            <label className="space-y-1 text-sm block">
              <span className="text-slate-700">Project summary</span>
              <textarea
                name="project"
                value={form.project}
                onChange={handleChange}
                rows={4}
                placeholder="Scope, timeline, site details, or links."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
                required
              />
            </label>
            <label className="space-y-1 text-sm block">
              <span className="text-slate-700">Budget or target price</span>
              <input
                type="text"
                name="budget"
                value={form.budget}
                onChange={handleChange}
                placeholder="e.g., 1500"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {state.buyHref ? "Open pack & submit" : "Submit order"}
              </button>
              <button
                type="button"
                disabled={!mailto}
                onClick={() => {
                  if (!mailto) return;
                  window.location.href = mailto;
                }}
                className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Email {title.split(" ")[0] || "associate"}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                Back
              </button>
            </div>
            {contactEmail ? (
              <p className="text-xs text-slate-500">We’ll also notify {contactEmail} about your brief.</p>
            ) : null}
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AssociateOrder;
