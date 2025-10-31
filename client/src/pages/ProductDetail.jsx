import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  HiOutlineTruck,
  HiOutlineShieldCheck,
  HiOutlineHeart,
  HiHeart,
  HiOutlineClipboardDocumentList,
  HiOutlineQuestionMarkCircle,
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineArrowRightCircle,
} from "react-icons/hi2";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { fetchProductBySlug } from "../services/marketplace.js";
import { recordRecentView } from "../utils/productDiscovery.js";
import { productCatalog } from "../data/products.js";

const formatCurrency = (value, currency = "INR") => {
  if (!Number.isFinite(value)) return "On request";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};

const getDefaultVariation = (product) =>
  product?.variations?.find((variation) => variation.isDefault) || product?.variations?.[0] || null;

const getOfferForVariation = (product, variationId) => {
  if (!product?.offers?.length) return null;
  const priced = product.offers
    .map((offer) => ({
      ...offer,
      pricing: offer.pricingByVariation?.[variationId],
      basePrice: offer.pricingByVariation?.[variationId]?.price ?? product.pricing?.basePrice ?? null,
    }))
    .filter((offer) => Number.isFinite(offer.basePrice));
  if (!priced.length) return product.offers[0];
  return priced.sort((a, b) => a.basePrice - b.basePrice)[0];
};

const computeAddonsTotal = (addons = [], selected = []) =>
  addons
    .filter((addon) => selected.includes(addon.id))
    .reduce((sum, addon) => sum + Number(addon.price || 0), 0);

const buildComparisonPeers = (product) =>
  productCatalog.filter((candidate) => candidate._id !== product?._id).slice(0, 2);

const computeAverageRating = (product) => {
  if (!product) return null;
  if (Array.isArray(product.reviews) && product.reviews.length) {
    const total = product.reviews.reduce(
      (sum, review) => sum + Number(review.rating || 0),
      0,
    );
    const average = total / product.reviews.length;
    return Number.isFinite(average) ? average : null;
  }
  const offerRatings = (product.offers || [])
    .map((offer) => Number(offer.rating || 0))
    .filter((rating) => Number.isFinite(rating));
  if (!offerRatings.length) return null;
  const aggregate =
    offerRatings.reduce((sum, rating) => sum + rating, 0) / offerRatings.length;
  return Number.isFinite(aggregate) ? aggregate : null;
};

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, wishlistItems } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedVariationId, setSelectedVariationId] = useState(null);
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [gstInvoice, setGstInvoice] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const remote = await fetchProductBySlug(id);
        const fallback = productCatalog.find((entry) => entry.slug === id);
        const matched = remote || fallback || null;
        if (!cancelled) {
          if (!matched) {
            setError("Product not found");
            setProduct(null);
            return;
          }
          setProduct(matched);
          const defaultVariation = getDefaultVariation(matched);
          const variationId = defaultVariation?.id || null;
          setSelectedVariationId(variationId);
          const offer = getOfferForVariation(matched, variationId);
          setSelectedOfferId(offer?.id || null);
          setQuantity(defaultVariation?.minQty || matched.pricing?.minQuantity || 1);
          recordRecentView({
            slug: matched.slug || matched._id,
            title: matched.title,
            heroImage: matched.heroImage,
            price: defaultVariation?.price || matched.pricing?.basePrice || 0,
            currency: matched.pricing?.currency || "INR",
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Unable to load this listing right now.");
          setProduct(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);
  useEffect(() => {
    setActiveImageIndex(0);
  }, [product?.slug]);
  const selectedVariation = useMemo(() => {
    if (!product) return null;
    return product.variations?.find((variation) => variation.id === selectedVariationId) || getDefaultVariation(product);
  }, [product, selectedVariationId]);

  const selectedOffer = useMemo(() => {
    if (!product) return null;
    return (
      product.offers?.find((offer) => offer.id === selectedOfferId) ||
      getOfferForVariation(product, selectedVariation?.id)
    );
  }, [product, selectedOfferId, selectedVariation]);

  const variationOptions = product?.variations || [];
  const comparisonPeers = useMemo(() => buildComparisonPeers(product || {}), [product]);

  const basePrice = useMemo(() => {
    if (!product) return 0;
    const offerPrice = selectedOffer?.pricingByVariation?.[selectedVariation?.id]?.price;
    return offerPrice ?? selectedVariation?.price ?? product.pricing?.basePrice ?? 0;
  }, [product, selectedOffer, selectedVariation]);

  const addonsTotal = useMemo(() => computeAddonsTotal(product?.addons, selectedAddons), [product, selectedAddons]);
  const minQty = useMemo(
    () => Math.max(1, selectedVariation?.minQty || product?.pricing?.minQuantity || 1),
    [selectedVariation, product],
  );
  const averageRating = useMemo(() => computeAverageRating(product), [product]);

  const subscriptionPlan = useMemo(() => {
    if (!selectedSubscription || !product?.subscribeOptions?.length) return null;
    return product.subscribeOptions.find((option) => option.id === selectedSubscription) || null;
  }, [product, selectedSubscription]);

  const subtotal = useMemo(() => {
    const qty = Math.max(1, quantity);
    return basePrice * qty + addonsTotal;
  }, [basePrice, addonsTotal, quantity]);

  const subscriptionPrice = subscriptionPlan
    ? subtotal * (1 - Number(subscriptionPlan.discountPercent || 0) / 100)
    : null;

  const isInWishlist = useMemo(
    () =>
      product &&
      wishlistItems.some((entry) => String(entry.productId) === String(product._id)),
    [wishlistItems, product],
  );
  useEffect(() => {
    setQuantity((prev) => (prev < minQty ? minQty : prev));
  }, [minQty]);
  const handleToggleWishlist = () => {
    if (!product) return;
    if (isInWishlist) {
      removeFromWishlist({ productId: product._id });
      toast.success("Removed from wishlist");
    } else {
      addToWishlist({
        productId: product._id,
        title: product.title,
        image: product.heroImage,
        price: basePrice,
      });
      toast.success("Added to wishlist");
    }
  };

  const handleAddToCart = () => {
    if (!product || !selectedVariation) return;
    const qty = Math.max(1, quantity);
    addToCart({
      productId: product._id,
      title: product.title,
      image: product.heroImage,
      price: basePrice,
      quantity: qty,
      seller: selectedOffer?.sellerName || "Marketplace seller",
      variation: selectedVariation.label,
      addons: product.addons?.filter((addon) => selectedAddons.includes(addon.id)) || [],
      giftMessage: giftMessage.trim(),
      gstInvoice,
      subscriptionPlan: subscriptionPlan?.id || null,
      kind: "product",
      totalPrice: subtotal,
      source: "Product detail",
    });
    toast.success("Added to cart");
  };

  const toggleAddon = (addonId) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId)
        ? prev.filter((entry) => entry !== addonId)
        : [...prev, addonId],
    );
  };
  const handleSelectVariation = (variation) => {
    if (!variation) return;
    setSelectedVariationId(variation.id);
    const bestOffer = getOfferForVariation(product, variation.id);
    setSelectedOfferId((current) =>
      current && bestOffer && current === bestOffer.id ? current : bestOffer?.id || current,
    );
    setQuantity((prev) => Math.max(variation.minQty || minQty || 1, prev));
  };

  const handleSelectOffer = (offerId) => {
    setSelectedOfferId(offerId);
  };

  const incrementQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const decrementQuantity = () => {
    setQuantity((prev) => Math.max(minQty, prev - 1));
  };

  const handleQuantityInput = (event) => {
    const value = Number(event.target.value);
    if (!Number.isFinite(value)) return;
    setQuantity(Math.max(minQty, value));
  };

  const handleSubscriptionSelect = (optionId) => {
    setSelectedSubscription((prev) => (prev === optionId ? null : optionId));
  };
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        Loading product overview...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 px-4">
        <h1 className="text-2xl font-semibold mb-3">{error || "Product unavailable"}</h1>
        <p className="text-sm text-slate-500 mb-6 text-center max-w-md">
          We could not load this listing at the moment. Return to the marketplace to continue browsing materials.
        </p>
        <Link
          to="/products"
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
        >
          Back to marketplace
        </Link>
      </div>
    );
  }

  const variationBadges = selectedVariation?.attributes || {};
  const comparisonRows = (product.comparisonMetrics || []).map((metric) => {
    const peerValues = comparisonPeers.map((peer) => {
      const match = peer.comparisonMetrics?.find((entry) => entry.key === metric.key);
      return match?.value ?? "-";
    });
    return {
      label: metric.label,
      unit: metric.unit,
      values: [metric.value, ...peerValues],
    };
  });
  const gallery = (product.gallery && product.gallery.length
    ? product.gallery
    : [product.heroImage].filter(Boolean));
  const activeImage =
    gallery[activeImageIndex] || gallery[0] || product.heroImage || "";
  const currency =
    selectedOffer?.pricingByVariation?.[selectedVariation?.id]?.currency ||
    selectedVariation?.currency ||
    product.pricing?.currency ||
    "INR";
  const unitLabel =
    selectedOffer?.pricingByVariation?.[selectedVariation?.id]?.unitLabel ||
    selectedVariation?.priceUnit ||
    product.pricing?.unitLabel ||
    "";
  const formattedBasePrice = formatCurrency(basePrice, currency);
  const formattedSubtotal = formatCurrency(subtotal, currency);
  const formattedSubscription =
    subscriptionPrice != null ? formatCurrency(subscriptionPrice, currency) : null;
  const leadTimeDays =
    selectedVariation?.leadTimeDays ||
    selectedOffer?.deliveryEstimate?.maxDays ||
    product.pricing?.leadTimeDays ||
    null;
  const shippingBadges = product.shippingBadges || [];
  const specs = product.specs || [];
  const docs = product.documentation || [];
  const faqs = product.faqs || [];
  const questions = product.questions || [];
  const reviews = product.reviews || [];
  const recommendedServices = product.recommendedServices || [];
  const bestFor = product.bestFor || [];
  const variationDimensions = product.variationDimensions || [];
  const returnPolicy = product.returnPolicy || null;
  const otherOffers = (product.offers || []).filter(
    (offer) => offer.id !== selectedOffer?.id,
  );
  const comparisonHeaders = [
    "This product",
    ...comparisonPeers.map((peer) => peer.title || peer.slug || "Peer"),
  ];
  const reviewCount = product.reviews?.length || selectedOffer?.reviewCount || 0;
  const sellerName =
    selectedOffer?.sellerName || product.seller || "Marketplace seller";
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        <header className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              {(product.categories?.length || product.category) && (
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  {(product.categories && product.categories.length
                    ? product.categories
                    : [product.category]
                  )
                    .filter(Boolean)
                    .join(" / ")}
                </p>
              )}
              <h1 className="text-3xl font-semibold text-slate-900">
                {product.title}
              </h1>
              {product.subtitle && (
                <p className="text-sm text-slate-500">{product.subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleToggleWishlist}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300"
            >
              {isInWishlist ? (
                <HiHeart className="h-5 w-5 text-rose-500" />
              ) : (
                <HiOutlineHeart className="h-5 w-5" />
              )}
              {isInWishlist ? "Saved to wishlist" : "Save to wishlist"}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
            {product.brand && <span>Brand: {product.brand}</span>}
            <span>Seller: {sellerName}</span>
            <span>MOQ: {minQty}</span>
            {unitLabel && <span>Unit: {unitLabel}</span>}
            {leadTimeDays && (
              <span className="inline-flex items-center gap-1">
                <HiOutlineClock className="h-4 w-4 text-slate-400" />
                Lead time {leadTimeDays} day{leadTimeDays > 1 ? "s" : ""}
              </span>
            )}
            {averageRating != null && (
              <span className="inline-flex items-center gap-1">
                <span className="text-amber-400">*</span>
                <span>{averageRating.toFixed(1)}</span>
                <span className="text-slate-400">
                  ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                </span>
              </span>
            )}
          </div>
          {bestFor.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {bestFor.map((useCase) => (
                <span
                  key={useCase}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                >
                  <HiOutlineCheckCircle className="h-4 w-4" />
                  {useCase}
                </span>
              ))}
            </div>
          )}
        </header>
        <section className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-8">
            <section className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                  {activeImage ? (
                    <img
                      src={activeImage}
                      alt={product.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                      No imagery available
                    </div>
                  )}
                </div>
                {gallery.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {gallery.map((image, index) => (
                      <button
                        type="button"
                        key={image + index}
                        onClick={() => setActiveImageIndex(index)}
                        className={`h-20 w-28 flex-shrink-0 overflow-hidden rounded-xl border ${
                          index === activeImageIndex
                            ? "border-slate-900"
                            : "border-transparent"
                        } bg-slate-100`}
                      >
                        <img
                          src={image}
                          alt={`${product.title} preview ${index + 1}`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-6">
                <section className="space-y-3">
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-800">
                      Configuration
                    </h2>
                    <p className="text-xs text-slate-500">
                      Select the variation that matches your project requirement.
                    </p>
                  </div>
                  {variationOptions.length ? (
                    <div className="space-y-3">
                      {variationDimensions.length > 0 && (
                        <div className="space-y-1 text-xs text-slate-500">
                          {variationDimensions.map((dimension) => (
                            <div key={dimension.code}>
                              <span className="font-semibold text-slate-700">
                                {dimension.label}:
                              </span>{" "}
                              {dimension.values
                                ?.map((value) => value.value)
                                .join(", ")}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {variationOptions.map((variation) => (
                          <button
                            type="button"
                            key={variation.id}
                            onClick={() => handleSelectVariation(variation)}
                            className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                              selectedVariation?.id === variation.id
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <div className="font-medium">{variation.label}</div>
                            <div className="text-xs opacity-80">
                              {variation.price
                                ? formatCurrency(
                                    variation.price,
                                    variation.currency || currency,
                                  )
                                : "Price on request"}
                            </div>
                            {variation.minQty && (
                              <div className="mt-1 text-[11px] uppercase tracking-widest">
                                MOQ {variation.minQty}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      This listing is available as a single configuration.
                    </p>
                  )}
                </section>
                {Object.keys(variationBadges).length > 0 && (
                  <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                    {Object.entries(variationBadges).map(([key, value]) => (
                      <span
                        key={key}
                        className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1"
                      >
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                )}
                {(product.offers || []).length > 0 && (
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-800">
                      Seller offers
                    </h3>
                    <div className="space-y-3">
                      {product.offers.map((offer) => {
                        const offerPrice =
                          offer.pricingByVariation?.[selectedVariation?.id]?.price;
                        return (
                          <label
                            key={offer.id}
                            className={`flex items-start justify-between gap-4 rounded-xl border p-4 text-sm transition ${
                              selectedOffer?.id === offer.id
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="font-semibold">{offer.sellerName}</div>
                              <div className="text-xs opacity-80">
                                {offer.fulfilment || "Seller fulfilled"}
                              </div>
                              <div className="text-xs opacity-80">
                                MOQ {offer.moq || minQty}
                                {offer.deliveryEstimate?.minDays && (
                                  <>
                                    {" "}
                                    • {offer.deliveryEstimate.minDays}-
                                    {offer.deliveryEstimate.maxDays ||
                                      offer.deliveryEstimate.minDays}{" "}
                                    day delivery
                                  </>
                                )}
                              </div>
                              {offer.badges?.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {offer.badges.map((badge) => (
                                    <span
                                      key={badge}
                                      className={`rounded-full px-2 py-1 text-[11px] ${
                                        selectedOffer?.id === offer.id
                                          ? "bg-white/10"
                                          : "border border-slate-200 bg-slate-100 text-slate-600"
                                      }`}
                                    >
                                      {badge}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="space-y-1 text-right">
                              <input
                                type="radio"
                                name="offer"
                                value={offer.id}
                                checked={selectedOffer?.id === offer.id}
                                onChange={() => handleSelectOffer(offer.id)}
                                className="mt-1"
                              />
                              <div className="font-semibold">
                                {offerPrice
                                  ? formatCurrency(offerPrice, currency)
                                  : formattedBasePrice}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </section>
                )}
                {product.addons?.length ? (
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-800">
                      Add-ons
                    </h3>
                    <div className="space-y-2">
                      {product.addons.map((addon) => (
                        <label
                          key={addon.id}
                          className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition hover:border-slate-300"
                        >
                          <input
                            type="checkbox"
                            checked={selectedAddons.includes(addon.id)}
                            onChange={() => toggleAddon(addon.id)}
                            className="mt-1"
                          />
                          <div className="space-y-1">
                            <div className="font-medium text-slate-800">
                              {addon.name}
                            </div>
                            <p className="text-xs text-slate-500">
                              {addon.description}
                            </p>
                            <p className="text-xs text-slate-600">
                              {formatCurrency(addon.price, addon.currency || currency)}
                              {addon.priceUnit ? ` / ${addon.priceUnit}` : ""}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </section>
                ) : null}
                {product.subscribeOptions?.length ? (
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-800">
                      Subscribe & save
                    </h3>
                    <div className="space-y-2">
                      {product.subscribeOptions.map((option) => (
                        <label
                          key={option.id}
                          className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                            selectedSubscription === option.id
                              ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-slate-500">
                              {option.discountPercent}% off • every{" "}
                              {option.cadenceDays} days
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={selectedSubscription === option.id}
                            onChange={() => handleSubscriptionSelect(option.id)}
                          />
                        </label>
                      ))}
                    </div>
                  </section>
                ) : null}
                {returnPolicy && (
                  <section className="space-y-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                      <HiOutlineShieldCheck className="h-4 w-4" />
                      Returns & claims
                    </div>
                    <div>
                      {returnPolicy.windowDays
                        ? `${returnPolicy.windowDays}-day window`
                        : "Flexible returns"}
                      {returnPolicy.restockingFeePercent
                        ? ` • ${returnPolicy.restockingFeePercent}% restocking`
                        : ""}
                    </div>
                    {returnPolicy.conditions?.length ? (
                      <ul className="list-inside list-disc text-xs">
                        {returnPolicy.conditions.map((condition) => (
                          <li key={condition}>{condition}</li>
                        ))}
                      </ul>
                    ) : null}
                    {returnPolicy.contactEmail && (
                      <p className="text-xs text-slate-500">
                        Contact: {returnPolicy.contactEmail}
                      </p>
                    )}
                  </section>
                )}
              </div>
            </section>
            {product.description && (
              <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-slate-900">Overview</h2>
                <p className="whitespace-pre-line text-sm text-slate-600">
                  {product.description}
                </p>
              </section>
            )}
            {shippingBadges.length > 0 && (
              <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-2">
                  <HiOutlineTruck className="h-5 w-5 text-slate-500" />
                  <h2 className="text-lg font-semibold text-slate-900">
                    Shipping & fulfilment
                  </h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {shippingBadges.map((badge) => (
                    <div
                      key={badge.id || badge.label}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                    >
                      <p className="font-semibold text-slate-800">{badge.label}</p>
                      <p className="text-xs text-slate-500">{badge.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {specs.length > 0 && (
              <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-2">
                  <HiOutlineClipboardDocumentList className="h-5 w-5 text-slate-500" />
                  <h2 className="text-lg font-semibold text-slate-900">
                    Specifications
                  </h2>
                </div>
                <dl className="grid gap-x-6 gap-y-3 text-sm text-slate-600 sm:grid-cols-2">
                  {specs.map((spec) => (
                    <div key={spec.label}>
                      <dt className="font-medium text-slate-800">{spec.label}</dt>
                      <dd>{spec.value || spec.description || "-"}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
            {comparisonRows.length > 0 && (
              <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-2">
                  <HiOutlineQuestionMarkCircle className="h-5 w-5 text-slate-500" />
                  <h2 className="text-lg font-semibold text-slate-900">
                    Benchmark against peers
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm text-slate-600">
                    <thead className="text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2 font-medium text-slate-700">Metric</th>
                        {comparisonHeaders.map((header) => (
                          <th
                            key={header}
                            className="px-3 py-2 font-medium text-slate-700"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonRows.map((row) => (
                        <tr key={row.label} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-medium text-slate-800">
                            {row.label}
                            {row.unit ? (
                              <span className="ml-1 text-xs text-slate-400">
                                ({row.unit})
                              </span>
                            ) : null}
                          </td>
                          {row.values.map((value, index) => (
                            <td key={`${row.label}-${index}`} className="px-3 py-2">
                              {value}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
            {docs.length > 0 && (
              <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-2">
                  <HiOutlineDocumentText className="h-5 w-5 text-slate-500" />
                  <h2 className="text-lg font-semibold text-slate-900">Documentation</h2>
                </div>
                <ul className="space-y-2 text-sm text-slate-600">
                  {docs.map((doc) => (
                    <li key={doc.id || doc.url}>
                      <Link
                        to={doc.url}
                        className="flex items-center gap-2 text-slate-700 underline hover:text-slate-900"
                      >
                        <HiOutlineArrowRightCircle className="h-4 w-4" />
                        {doc.label || doc.url}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {faqs.length > 0 && (
              <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-2">
                  <HiOutlineQuestionMarkCircle className="h-5 w-5 text-slate-500" />
                  <h2 className="text-lg font-semibold text-slate-900">FAQs</h2>
                </div>
                <div className="space-y-3">
                  {faqs.map((faq, index) => (
                    <div key={faq.question || index} className="text-sm text-slate-600">
                      <p className="font-medium text-slate-800">{faq.question}</p>
                      <p className="text-xs text-slate-500">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {questions.length > 0 && (
              <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-2">
                  <HiOutlineQuestionMarkCircle className="h-5 w-5 text-slate-500" />
                  <h2 className="text-lg font-semibold text-slate-900">
                    Community questions
                  </h2>
                </div>
                <div className="space-y-4">
                  {questions.map((item) => (
                    <div key={item.id} className="text-sm text-slate-600">
                      <p className="font-medium text-slate-800">
                        {item.askedBy} • {item.askedOn}
                      </p>
                      <p className="text-slate-600">{item.question}</p>
                      {item.answer && (
                        <p className="mt-2 text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">
                            {item.answeredBy}:
                          </span>{" "}
                          {item.answer}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
            {reviews.length > 0 && (
              <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-2">
                  <HiOutlineHeart className="h-5 w-5 text-slate-500" />
                  <h2 className="text-lg font-semibold text-slate-900">Reviews</h2>
                </div>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <article
                      key={review.id}
                      className="space-y-2 rounded-xl border border-slate-100 p-4 text-sm text-slate-600"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-800">
                          {review.author?.name || "Anonymous"}
                        </span>
                        {review.author?.company && (
                          <span className="text-xs text-slate-400">
                            {review.author.company}
                          </span>
                        )}
                        {review.createdAt && (
                          <span className="text-xs text-slate-400">
                            {review.createdAt}
                          </span>
                        )}
                        <span className="text-amber-400">
                          {"*".repeat(review.rating || 0)}
                          <span className="text-slate-300">
                            {"*".repeat(Math.max(0, 5 - (review.rating || 0)))}
                          </span>
                        </span>
                      </div>
                      <p className="font-medium text-slate-800">{review.title}</p>
                      <p>{review.body}</p>
                      {review.helpful?.up != null && (
                        <p className="text-xs text-slate-500">
                          Helpful: {review.helpful.up} 👍 •{" "}
                          {review.helpful.down || 0} 👎
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )}
            {recommendedServices.length > 0 && (
              <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-2">
                  <HiOutlineArrowRightCircle className="h-5 w-5 text-slate-500" />
                  <h2 className="text-lg font-semibold text-slate-900">
                    Recommended services
                  </h2>
                </div>
                <ul className="space-y-3 text-sm text-slate-600">
                  {recommendedServices.map((service) => (
                    <li
                      key={service.ref || service.title}
                      className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-slate-800">{service.title}</p>
                        <p className="text-xs text-slate-500">
                          {service.justification}
                        </p>
                      </div>
                      {service.ref && (
                        <Link
                          to={`/associates/${service.ref}`}
                          className="text-xs text-slate-600 underline hover:text-slate-900"
                        >
                          View profile
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {comparisonPeers.length > 0 && (
              <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-2">
                  <HiOutlineArrowRightCircle className="h-5 w-5 text-slate-500" />
                  <h2 className="text-lg font-semibold text-slate-900">
                    Alternative picks
                  </h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {comparisonPeers.map((peer) => (
                    <Link
                      key={peer._id || peer.slug}
                      to={`/products/${peer.slug || peer._id}`}
                      className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 text-sm text-slate-600 transition hover:border-slate-300"
                    >
                      {peer.heroImage && (
                        <img
                          src={peer.heroImage}
                          alt={peer.title}
                          className="h-32 w-full rounded-lg object-cover"
                          loading="lazy"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-slate-800">{peer.title}</p>
                        {peer.pricing?.basePrice && (
                          <p className="text-xs text-slate-500">
                            Starting at{" "}
                            {formatCurrency(
                              peer.pricing.basePrice,
                              peer.pricing.currency || currency,
                            )}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
          <aside className="space-y-6">
            <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Live offer
                </p>
                <p className="text-2xl font-semibold text-slate-900">
                  {formattedBasePrice}
                  {unitLabel ? ` / ${unitLabel}` : ""}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedOffer?.fulfilment || "Seller fulfilled"} • {sellerName}
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={decrementQuantity}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-lg hover:border-slate-300"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={minQty}
                    value={quantity}
                    onChange={handleQuantityInput}
                    className="w-16 rounded-lg border border-slate-200 py-1 text-center text-sm"
                  />
                  <button
                    type="button"
                    onClick={incrementQuantity}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-lg hover:border-slate-300"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  MOQ {minQty} • Adjust per site requirements
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">
                    {formattedSubtotal}
                  </span>
                </div>
                {formattedSubscription && (
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>With subscription</span>
                    <span>{formattedSubscription}</span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Add to cart
                </button>
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300"
                >
                  {isInWishlist ? (
                    <HiHeart className="h-5 w-5 text-rose-500" />
                  ) : (
                    <HiOutlineHeart className="h-5 w-5" />
                  )}
                  {isInWishlist ? "Remove from wishlist" : "Save for later"}
                </button>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={gstInvoice}
                  onChange={() => setGstInvoice((prev) => !prev)}
                />
                Need GST invoice
              </label>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Gift / delivery note
                </label>
                <textarea
                  value={giftMessage}
                  onChange={(event) => setGiftMessage(event.target.value)}
                  rows={3}
                  maxLength={300}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                  placeholder="Add installation instructions or client note"
                />
              </div>
            </section>
            {otherOffers.length > 0 && (
              <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-900">
                  Alternative sellers
                </h3>
                <ul className="space-y-2">
                  {otherOffers.map((offer) => {
                    const offerPrice =
                      offer.pricingByVariation?.[selectedVariation?.id]?.price ??
                      (offer.pricingByVariation
                        ? Object.values(offer.pricingByVariation)[0]?.price
                        : null);
                    return (
                      <li
                        key={offer.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-slate-800">
                            {offer.sellerName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {offer.fulfilment || "Seller fulfilled"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">
                            {offerPrice
                              ? formatCurrency(offerPrice, currency)
                              : "Contact"}
                          </p>
                          {offer.rating && (
                            <p className="text-xs text-slate-500">
                              * {offer.rating.toFixed(1)}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
            {product.compliance?.length > 0 && (
              <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-900">
                  Compliance & certifications
                </h3>
                <ul className="list-inside list-disc space-y-1">
                  {product.compliance.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </section>
      </main>
    </div>
  );
};

export default ProductDetail;

