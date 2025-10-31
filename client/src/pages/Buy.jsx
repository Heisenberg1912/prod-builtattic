import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";

import { buyNow } from "../services/orders.js";
import { fetchProductBySlug } from "../services/marketplace.js";
import { productCatalog } from "../data/products.js";

const resolveUnitPrice = (product) => {
  if (!product) return 0;
  const direct = Number(product.price ?? product.basePrice ?? product.amount);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const byPricing = Number(product?.pricing?.basePrice ?? product?.pricing?.price);
  if (Number.isFinite(byPricing) && byPricing > 0) return byPricing;
  const bySqft = Number(product.priceSqft ?? product.pricing?.priceSqft);
  if (Number.isFinite(bySqft) && bySqft > 0) return bySqft;
  return 0;
};

const resolveCurrency = (product) =>
  product?.pricing?.currency || product?.currency || product?.amount?.currency || "INR";

const defaultProduct = productCatalog?.[0] || null;

const Buy = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(defaultProduct);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    let active = true;
    const loadProduct = async () => {
      if (!id) {
        setProduct(defaultProduct);
        setLoading(false);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const item = await fetchProductBySlug(id);
        if (!active) return;
        if (item) {
          setProduct(item);
        } else {
          setProduct(null);
          setError('Product not found.');
        }
      } catch (err) {
        if (!active) return;
        setProduct(null);
        setError(err?.message || 'Unable to load product details.');
      } finally {
        if (active) setLoading(false);
      }
    };
    loadProduct();
    return () => {
      active = false;
    };
  }, [id]);

  const unitPrice = useMemo(() => resolveUnitPrice(product), [product]);
  const currency = useMemo(() => resolveCurrency(product), [product]);
  const heroImage =
    product?.heroImage ||
    product?.image ||
    product?.gallery?.[0] ||
    `https://via.placeholder.com/400x260?text=${encodeURIComponent(product?.title || 'Product')}`;

  const handleBuyNow = async () => {
    if (!product) {
      toast.error('Product unavailable for purchase.');
      return;
    }
    const qty = Math.max(1, Number(quantity) || 1);
    setPlacingOrder(true);
    try {
      const order = await buyNow({
        item: {
          productId: product._id || null,
          productSlug: product.slug || id || product?.id || null,
          quantity: qty,
          unitPrice,
          currency,
          title: product.title || product.name || 'Untitled product',
          source: product.kind || product.type || 'product',
        },
        pricing: { unitPrice },
        metadata: {
          productSnapshot: {
            id: product._id || null,
            slug: product.slug || id || null,
            title: product.title || product.name || 'Untitled product',
            unitPrice,
            currency,
          },
          fromBuyPage: true,
        },
      });
      const label = order?._id ? `Order #${order._id}` : 'Order';
      toast.success(`${label} placed successfully`);
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

  const isReady = !loading && product;
  const pricingLabel = unitPrice > 0 ? `${currency} ${unitPrice.toLocaleString()}` : 'On request';

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 flex justify-center">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl p-8 space-y-6">
        {loading && (
          <div className="text-center text-slate-500 py-16">Loading product details…</div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 text-center">
            {error}
          </div>
        )}

        {isReady && (
          <>
            <header className="flex flex-col md:flex-row gap-6">
              <img
                src={heroImage}
                alt={product.title || product.name || 'Product visual'}
                className="w-full md:w-64 h-48 md:h-56 object-cover rounded-2xl border border-slate-200"
              />
              <div className="flex-1 space-y-3">
                <div className="text-xs uppercase tracking-[0.35em] text-slate-400">
                  {product.kind || product.categories?.[0] || 'Product'}
                </div>
                <h1 className="text-3xl font-semibold text-slate-900">
                  {product.title || product.name || 'Untitled product'}
                </h1>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {product.summary ||
                    product.description ||
                    'Secure your purchase and receive tailored fulfilment support from the Builtattic operations team.'}
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Price</p>
                    <p className="text-2xl font-semibold text-slate-900">{pricingLabel}</p>
                  </div>
                  {product.pricing?.unitLabel && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Unit</p>
                      <p className="text-sm text-slate-600">{product.pricing.unitLabel}</p>
                    </div>
                  )}
                </div>
              </div>
            </header>

            <section className="grid sm:grid-cols-3 gap-4 text-sm text-slate-600">
              <div className="border border-slate-200 rounded-2xl px-4 py-3">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Delivery</p>
                <p>End-to-end logistics orchestration with milestone tracking.</p>
              </div>
              <div className="border border-slate-200 rounded-2xl px-4 py-3">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Warranty</p>
                <p>{product.warranty || 'Industry-standard safeguards and QA certificates included.'}</p>
              </div>
              <div className="border border-slate-200 rounded-2xl px-4 py-3">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Support</p>
                <p>Dedicated concierge and compliance assistance for every order.</p>
              </div>
            </section>

            <section className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex-1">
                <label className="block text-xs uppercase tracking-[0.3em] text-slate-400 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                  className="w-32 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={placingOrder}
                className="inline-flex justify-center items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white text-base font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {placingOrder ? 'Processing…' : 'Buy now'}
              </button>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default Buy;