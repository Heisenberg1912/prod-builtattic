import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { fetchMaterials } from "../services/marketplace.js";
import { fallbackMaterials } from "../data/marketplace.js";
import { resolveMaterialStudioHero } from "../assets/materialStudioImages.js";

const WarehouseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, wishlistItems = [] } = useWishlist();
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const { items } = await fetchMaterials();
        const match =
          items.find((item) => item.slug === id || item._id === id) ||
          fallbackMaterials.find(
            (item) => item.slug === id || String(item._id) === String(id)
          );
        if (!cancelled) {
          setMaterial(match || null);
          if (!match) {
            setError("Material not found.");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Unable to load this material.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const heroImage = resolveMaterialStudioHero(material);

  const gallery = useMemo(() => {
    if (!material) return [];
    const images = new Set();
    if (heroImage) images.add(heroImage);
    (material.gallery || []).forEach((img) => images.add(img));
    return Array.from(images);
  }, [material, heroImage]);

  const recommendations = useMemo(() => {
    if (!material) return fallbackMaterials.slice(0, 6);
    const pool = fallbackMaterials.filter(
      (item) =>
        item.slug !== material.slug &&
        item._id !== material._id &&
        item.category === material.category
    );
    if (pool.length < 4) {
      return fallbackMaterials.filter((item) => item.slug !== material.slug).slice(0, 6);
    }
    return pool.slice(0, 6);
  }, [material]);

  const materialKey = material?._id ?? material?.id ?? material?.slug ?? id;
  const isWishlisted = useMemo(() => {
    if (!materialKey) return false;
    return (wishlistItems || []).some(
      (entry) => (entry?.productId ?? entry?.id ?? entry?._id ?? entry?.slug) === materialKey,
    );
  }, [wishlistItems, materialKey]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white border border-slate-200 rounded-xl px-6 py-4 text-slate-500 text-sm">
            Loading material…
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 px-4">
        <h2 className="text-2xl font-semibold mb-3">{error || "Material not found"}</h2>
        <p className="text-sm text-slate-600 mb-6 max-w-md text-center">
          Return to the warehouse marketplace to browse the rest of the catalogue.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-slate-300 rounded-md text-sm text-slate-700 hover:bg-slate-100"
          >
            Go back
          </button>
          <Link
            to="/warehouse"
            className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm hover:bg-slate-800"
          >
            Warehouse
          </Link>
        </div>
      </div>
    );
  }

  const handleAddMaterialToCart = async () => {
    if (!material) return;
    const price = Number(material.priceSqft ?? material.pricing?.basePrice ?? material.price ?? 0);
    try {
      await addToCart({
        productId: materialKey,
        title: material.title,
        image: heroImage || material.images?.[0] || "",
        price,
        quantity: 1,
        seller: material.metafields?.vendor || "Marketplace vendor",
        source: "Material",
        kind: "material",
        metadata: {
          category: material.category,
          unit: material.pricing?.unit || material.pricing?.unitLabel || material.metafields?.unit,
        },
      });
      toast.success("Material added to cart");
    } catch (err) {
      console.error(err);
      toast.error("Could not add to cart");
    }
  };

  const handleToggleWishlist = async () => {
    if (!material) return;
    const payload = {
      productId: materialKey,
      title: material.title,
      image: heroImage || material.images?.[0] || "",
      price: Number(material.priceSqft ?? material.pricing?.basePrice ?? material.price ?? 0),
      source: "Material",
    };
    try {
      if (isWishlisted) {
        await removeFromWishlist(payload);
        toast.success("Removed from wishlist");
      } else {
        await addToWishlist(payload);
        toast.success("Added to wishlist");
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not update wishlist");
    }
  };

  const pricing = material.pricing || {};
  const minimumOrder =
    material.metafields?.moq || pricing.minQuantity || material.inventory || 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-3">
          <p className="uppercase tracking-[0.3em] text-xs text-slate-400">
            warehouse
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">{material.title}</h1>
          <p className="text-sm text-slate-600 max-w-3xl">
            {material.description}
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
              {material.category}
            </span>
            {material.metafields?.vendor && (
              <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                {material.metafields.vendor}
              </span>
            )}
            {material.metafields?.location && (
              <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                {material.metafields.location}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 lg:px-0 py-10 space-y-10">
          <nav className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
            <button
              onClick={() => navigate(-1)}
              className="hover:text-slate-600 transition"
            >
              Back
            </button>
            <Link to="/warehouse" className="hover:text-slate-600 transition">
              All materials
            </Link>
          </nav>

          {gallery.length > 0 && (
            <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Gallery</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {gallery.map((image) => (
                  <div
                    key={image}
                    className="rounded-xl overflow-hidden border border-slate-100"
                  >
                    <img
                      src={image}
                      alt={`${material.title} visual`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            <section className="lg:col-span-2 space-y-6">
              <article className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">Specifications</h2>
                <div className="grid sm:grid-cols-2 gap-4 text-sm text-slate-600">
                  {material.metafields?.unit && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                        Unit
                      </p>
                      <p className="mt-2 font-medium text-slate-900">
                        {material.metafields.unit}
                      </p>
                    </div>
                  )}
                  {material.metafields?.leadTimeDays && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                        Lead time
                      </p>
                      <p className="mt-2 font-medium text-slate-900">
                        {material.metafields.leadTimeDays} days
                      </p>
                    </div>
                  )}
                  {material.delivery?.items?.map((deliverable) => (
                    <div
                      key={deliverable}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-4"
                    >
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                        Deliverable
                      </p>
                      <p className="mt-2 font-medium text-slate-900">{deliverable}</p>
                    </div>
                  ))}
                </div>
              </article>

              {material.highlights?.length > 0 && (
                <article className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
                  <h2 className="text-lg font-semibold text-slate-900">Highlights</h2>
                  <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                    {material.highlights.map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                  </ul>
                </article>
              )}

              {recommendations.length > 0 && (
                <article className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">For you</h2>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mt-1">
                        Similar inventory
                      </p>
                    </div>
                    <Link
                      to="/warehouse"
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      Browse all
                    </Link>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {recommendations.map((item) => {
                      const recommendationImage =
                        resolveMaterialStudioHero(item) || item.heroImage;
                      return (
                        <Link
                          key={item._id || item.slug}
                          to={item.slug ? `/warehouse/${item.slug}` : "#"}
                          className="min-w-[220px] max-w-[240px] bg-slate-50 border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition flex-shrink-0"
                        >
                          {recommendationImage && (
                            <img
                              src={recommendationImage}
                              alt={item.title}
                              className="w-full h-32 object-cover"
                              loading="lazy"
                            />
                          )}
                          <div className="p-4 space-y-2">
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                              {item.category}
                            </p>
                            <p className="text-sm font-semibold text-slate-800 line-clamp-2">
                              {item.title}
                            </p>
                            <p className="text-xs text-slate-500 line-clamp-2">
                              {item.description}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </article>
              )}
            </section>

            <aside className="space-y-6">
              <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Price
                  </p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: pricing.currency || "USD",
                      maximumFractionDigits: 0,
                    }).format(pricing.basePrice || material.price || 0)}
                    {pricing.unitLabel ? ` / ${pricing.unitLabel}` : ""}
                  </p>
                </div>
                <div className="text-sm text-slate-600 space-y-2">
                  <p>Minimum order: {minimumOrder.toLocaleString()}</p>
                  <p>
                    Availability:{" "}
                    {material.metafields?.location || "Global distribution"}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleAddMaterialToCart}
                    className="w-full bg-slate-900 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-slate-800"
                  >
                    Add to cart
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleWishlist}
                    className="w-full rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:border-slate-300"
                  >
                    {isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  </button>
                </div>
              </section>
              {material.metafields?.vendor && (
                <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2 text-sm text-slate-600">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-[0.3em]">
                    Vendor
                  </h3>
                  <p>{material.metafields.vendor}</p>
                  {material.metafields.location && (
                    <p className="text-xs text-slate-500">
                      {material.metafields.location}
                    </p>
                  )}
                </section>
              )}
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default WarehouseDetail;
