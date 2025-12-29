import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  ArrowLeft,
  Star,
  MapPin,
  Mail,
  Heart,
  Share2,
  ShoppingCart,
  Package,
  Truck,
  Shield,
  Clock,
  CheckCircle,
  Building2,
  Tag,
  Layers,
  X,
  ChevronLeft,
  ChevronRight,
  Phone,
  Globe,
  Award,
  Box,
  Zap,
} from "lucide-react";
import { Button } from "../components/ui/button";
import Footer from "../components/Footer";
import toast from "react-hot-toast";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { fetchMaterials } from "../services/marketplace.js";
import { fallbackMaterials } from "../data/marketplace.js";
import { resolveMaterialStudioHero } from "../assets/materialStudioImages.js";

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function WarehouseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, wishlistItems = [] } = useWishlist();
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Use window scroll for parallax (avoids ref hydration issues)
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 500], [1, 1.1]);

  const materialKey = material?._id ?? material?.id ?? material?.slug ?? id;

  const isWishlisted = useMemo(() => {
    if (!materialKey) return false;
    return (wishlistItems || []).some(
      (entry) => (entry?.productId ?? entry?.id ?? entry?._id ?? entry?.slug) === materialKey,
    );
  }, [wishlistItems, materialKey]);

  useEffect(() => {
    loadMaterial();
  }, [id]);

  const loadMaterial = async () => {
    setLoading(true);
    try {
      const { items } = await fetchMaterials();
      const match =
        items.find((item) => item._id === id || item.id === id || item.slug === id) ||
        fallbackMaterials.find(
          (item) => String(item._id) === String(id) || item.id === id || item.slug === id
        );

      if (match) {
        setMaterial(match);
      } else {
        toast.error("Material not found");
        navigate("/warehouse");
      }
    } catch (error) {
      console.error("Error loading material:", error);
      // Try fallback materials
      const fallbackMatch = fallbackMaterials.find(
        (item) => String(item._id) === String(id) || item.id === id || item.slug === id
      );
      if (fallbackMatch) {
        setMaterial(fallbackMatch);
      } else {
        toast.error("Failed to load material");
        navigate("/warehouse");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    setSaved(!saved);
    toast.success(saved ? "Removed from saved" : "Saved for later");
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleAddToCart = async () => {
    if (!material) return;
    const price = Number(material.priceSqft ?? material.pricing?.basePrice ?? material.price ?? 0);
    try {
      await addToCart({
        productId: materialKey,
        title: material.title || material.name,
        image: heroImage || material.images?.[0] || "",
        price,
        quantity,
        seller: material.metafields?.vendor || "Marketplace vendor",
        source: "Material",
        kind: "material",
        metadata: {
          category: material.category,
          unit: material.pricing?.unit || material.pricing?.unitLabel || material.metafields?.unit,
        },
      });
      toast.success("Added to cart");
    } catch (err) {
      console.error(err);
      toast.error("Could not add to cart");
    }
  };

  const handleToggleWishlist = async () => {
    if (!material) return;
    const payload = {
      productId: materialKey,
      title: material.title || material.name,
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

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const nextImage = () => {
    if (images.length > 0) {
      setLightboxIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images.length > 0) {
      setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 shadow-xl border border-slate-100"
        >
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-center">Loading material...</p>
        </motion.div>
      </div>
    );
  }

  if (!material) return null;

  const heroImage = resolveMaterialStudioHero(material) || material.heroImage || material.images?.[0] || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1600&q=80";
  const images = material.gallery || material.images || [heroImage].filter(Boolean);
  const pricing = material.pricing || {};
  const vendorProfile = material.vendorProfile || null;

  // Specification items
  const specs = [
    { icon: Box, label: 'Unit', value: material.metafields?.unit || pricing.unitLabel },
    { icon: Package, label: 'MOQ', value: material.metafields?.moq || pricing.minQuantity || material.inventory },
    { icon: Truck, label: 'Lead Time', value: material.metafields?.leadTimeDays ? `${material.metafields.leadTimeDays} days` : null },
    { icon: MapPin, label: 'Origin', value: material.metafields?.location },
  ].filter(spec => spec.value);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Floating Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="fixed top-6 left-6 z-50"
      >
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="bg-white/90 backdrop-blur-md shadow-lg hover:shadow-xl hover:bg-white border border-slate-200/50 transition-all duration-300"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </motion.div>

      {/* Hero Section with Parallax */}
      <div className="relative h-[70vh] min-h-[500px] overflow-hidden">
        <motion.div
          style={{ y: heroY, scale: heroScale }}
          className="absolute inset-0"
        >
          <img
            src={heroImage}
            alt={material.title || material.name}
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

        {/* Hero Content */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="absolute bottom-0 left-0 right-0 p-8 md:p-12"
        >
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              {material.category && (
                <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white/90 text-sm font-medium mb-4 border border-white/20">
                  {material.category}
                </span>
              )}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                {material.title || material.name}
              </h1>
              <p className="text-lg text-white/80 max-w-2xl line-clamp-2">
                {material.description}
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-20 relative z-10 pb-20">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="lg:col-span-2 space-y-6"
          >
            {/* Quick Stats */}
            {specs.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {specs.map((spec, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-500 text-center"
                  >
                    <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-900 flex items-center justify-center">
                      <spec.icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-lg font-bold text-slate-900">{spec.value}</p>
                    <p className="text-sm text-slate-500">{spec.label}</p>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Description */}
            <motion.div
              variants={fadeInUp}
              className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow duration-500"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                About This Material
              </h2>
              <p className="text-slate-600 leading-relaxed text-lg">
                {material.description || "High-quality construction material sourced from verified suppliers."}
              </p>
            </motion.div>

            {/* Details & Tags */}
            <motion.div
              variants={fadeInUp}
              className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow duration-500"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-white" />
                </div>
                Material Details
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {material.category && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Category</p>
                    <p className="text-slate-900 font-medium">{material.category}</p>
                  </div>
                )}
                {material.family && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Family</p>
                    <p className="text-slate-900 font-medium">{material.family}</p>
                  </div>
                )}
                {material.metafields?.vendor && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Vendor</p>
                    <p className="text-slate-900 font-medium">{material.metafields.vendor}</p>
                  </div>
                )}
                {material.metafields?.location && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Location</p>
                    <p className="text-slate-900 font-medium">{material.metafields.location}</p>
                  </div>
                )}
              </div>

              {/* Certifications */}
              {material.certifications?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Certifications</p>
                  <div className="flex flex-wrap gap-2">
                    {material.certifications.map((cert, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Highlights */}
            {material.highlights?.length > 0 && (
              <motion.div
                variants={fadeInUp}
                className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow duration-500"
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  Highlights
                </h2>
                <ul className="space-y-3">
                  {material.highlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-slate-900 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-600">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Image Gallery */}
            {images.length > 1 && (
              <motion.div
                variants={fadeInUp}
                className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow duration-500"
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-white" />
                  </div>
                  Gallery
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((img, idx) => (
                    <motion.button
                      key={idx}
                      onClick={() => openLightbox(idx)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="aspect-[4/3] rounded-2xl overflow-hidden relative group"
                    >
                      <img
                        src={img}
                        alt={`Gallery ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-medium">
                          View
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Trust Badges */}
            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-3 gap-4"
            >
              {[
                { icon: Shield, label: 'Verified Supplier' },
                { icon: Truck, label: 'Fast Shipping' },
                { icon: Award, label: 'Quality Certified' },
              ].map((badge, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl p-6 text-center shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-500"
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-900 flex items-center justify-center">
                    <badge.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">{badge.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Column - Sticky Pricing Card */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="sticky top-24 space-y-6"
            >
              {/* Pricing Card */}
              <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-slate-400 text-sm">Price</p>
                    <p className="text-4xl font-bold">
                      {new Intl.NumberFormat(undefined, {
                        style: "currency",
                        currency: pricing.currency || "USD",
                        maximumFractionDigits: 0,
                      }).format(pricing.basePrice || material.price || 0)}
                    </p>
                    {pricing.unitLabel && (
                      <p className="text-slate-400 text-sm">per {pricing.unitLabel}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleToggleWishlist}
                      className={`p-3 rounded-xl transition-all duration-300 ${
                        isWishlisted
                          ? 'bg-red-500 text-white'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={handleShare}
                      className="p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-300"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Quantity Selector */}
                <div className="mb-6">
                  <p className="text-slate-400 text-sm mb-2">Quantity</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mb-6 text-sm">
                  <div className="flex items-center gap-3 text-slate-300">
                    <Package className="w-4 h-4" />
                    <span>MOQ: {material.metafields?.moq || pricing.minQuantity || "1"} units</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <Truck className="w-4 h-4" />
                    <span>Lead time: {material.metafields?.leadTimeDays || "7-14"} days</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <MapPin className="w-4 h-4" />
                    <span>{material.metafields?.location || "Global shipping"}</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
                  className="w-full py-4 rounded-2xl bg-white text-slate-900 font-semibold text-lg hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </motion.button>

                <button
                  onClick={handleToggleWishlist}
                  className="w-full mt-3 py-3 rounded-2xl border border-white/20 text-white font-medium hover:bg-white/10 transition-colors"
                >
                  {isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                </button>
              </div>

              {/* Vendor Card */}
              {(vendorProfile || material.metafields?.vendor) && (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Supplier
                  </h3>

                  <div className="space-y-3">
                    <p className="text-slate-900 font-semibold">
                      {vendorProfile?.companyName || material.metafields?.vendor}
                    </p>
                    {vendorProfile?.tagline && (
                      <p className="text-sm text-slate-500">{vendorProfile.tagline}</p>
                    )}
                    {(vendorProfile?.location || material.metafields?.location) && (
                      <p className="text-sm text-slate-500 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {vendorProfile?.location || material.metafields?.location}
                      </p>
                    )}

                    {vendorProfile?.contactEmail && (
                      <a
                        href={`mailto:${vendorProfile.contactEmail}`}
                        className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        {vendorProfile.contactEmail}
                      </a>
                    )}
                    {vendorProfile?.contactPhone && (
                      <a
                        href={`tel:${vendorProfile.contactPhone}`}
                        className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        {vendorProfile.contactPhone}
                      </a>
                    )}
                    {vendorProfile?.website && (
                      <a
                        href={vendorProfile.website}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        <Globe className="w-4 h-4" />
                        Visit Website
                      </a>
                    )}

                    {vendorProfile?.certifications?.length > 0 && (
                      <div className="pt-3 border-t border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Certifications</p>
                        <p className="text-sm text-slate-600">
                          {vendorProfile.certifications.slice(0, 4).join(' • ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <motion.img
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              src={images[lightboxIndex]}
              alt={`Gallery ${lightboxIndex + 1}`}
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(idx); }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === lightboxIndex ? 'bg-white w-6' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
