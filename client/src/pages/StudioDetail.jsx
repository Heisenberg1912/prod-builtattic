import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  ArrowLeft,
  Star,
  MapPin,
  Mail,
  Heart,
  Share2,
  Ruler,
  Bed,
  Bath,
  Layers,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Shield,
  Zap,
  MessageCircle,
  Globe,
  Phone,
  Tag,
  Home,
  Building2,
  Palette,
} from "lucide-react";
import { Button } from "../components/ui/button";
import Footer from "../components/Footer";
import toast from "react-hot-toast";
import { getAllPublishedDesigns } from "../services/associateDesigns";
import { fallbackStudios } from "../data/marketplace";

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const slideInFromRight = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 50 }
};

export default function StudioDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Use window scroll for parallax (avoids ref hydration issues)
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 500], [1, 1.1]);

  useEffect(() => {
    loadDesign();
  }, [id]);

  const loadDesign = async () => {
    setLoading(true);
    try {
      // First check localStorage designs
      const localDesigns = getAllPublishedDesigns();
      const localDesign = localDesigns.find(d => d.id === id);

      if (localDesign) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setDesign({
          ...localDesign,
          firm: {
            name: user.name || user.fullName || 'Independent Designer',
            logo: user.profileImage || null,
            bio: 'Design professional offering custom architectural plans',
            services: ['Architectural Design', 'Custom Plans'],
            location: { country: 'USA' },
            contact: {
              email: user.email || 'contact@example.com',
            }
          },
          rating: 4.8,
          reviewCount: Math.floor(Math.random() * 50) + 10,
        });
        return;
      }

      // Check fallback/demo studios
      const fallbackDesign = fallbackStudios.find(
        s => s._id === id || s.id === id || s.slug === id
      );

      if (fallbackDesign) {
        setDesign({
          ...fallbackDesign,
          id: fallbackDesign._id || fallbackDesign.id,
          title: fallbackDesign.title,
          description: fallbackDesign.description || fallbackDesign.summary,
          category: fallbackDesign.categories?.[0] || fallbackDesign.category,
          style: fallbackDesign.styles?.[0] || fallbackDesign.style,
          climate: fallbackDesign.climate,
          typology: fallbackDesign.typology,
          tags: fallbackDesign.tags || [],
          images: fallbackDesign.gallery || [fallbackDesign.heroImage].filter(Boolean),
          thumbnail: fallbackDesign.heroImage,
          priceSqft: fallbackDesign.priceSqft,
          totalPrice: fallbackDesign.price,
          deliveryTime: '4-8 weeks',
          specifications: {
            area: fallbackDesign.areaSqft,
            bedrooms: fallbackDesign.specs?.find(s => s.label === 'Bedrooms')?.value,
            bathrooms: fallbackDesign.specs?.find(s => s.label === 'Bathrooms')?.value,
            floors: fallbackDesign.specs?.find(s => s.label === 'Floor plates')?.value || fallbackDesign.floors,
          },
          firm: fallbackDesign.firm || {
            name: 'Demo Design Collective',
            logo: null,
            bio: fallbackDesign.story || 'Design professional offering custom architectural plans',
            services: ['Architectural Design', 'Custom Plans'],
            location: { country: 'UAE' },
            contact: {
              email: fallbackDesign.firm?.contactEmail || 'studios@builtattic.com',
            }
          },
          rating: fallbackDesign.rating || 4.8,
          reviewCount: fallbackDesign.ratingsCount || Math.floor(Math.random() * 50) + 10,
          views: fallbackDesign.views || 0,
          saves: fallbackDesign.saves || 0,
        });
        return;
      }

      // Not found anywhere
      toast.error("Design not found");
      navigate("/studio");
    } catch (error) {
      console.error("Error loading design:", error);
      toast.error("Failed to load design");
      navigate("/studio");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    setSaved(!saved);
    toast.success(saved ? "Removed from saved" : "Saved to collection");
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleContact = () => {
    const email = design?.firm?.contact?.email || design?.firm?.contactEmail;
    if (email) {
      window.location.href = `mailto:${email}?subject=Inquiry: ${design.title}`;
    }
  };

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const nextImage = () => {
    if (images?.length > 0) {
      setLightboxIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images?.length > 0) {
      setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-slate-900 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-600 font-medium">Loading design details...</p>
        </motion.div>
      </div>
    );
  }

  if (!design) return null;

  const images = design.images?.length > 0 ? design.images : [design.thumbnail].filter(Boolean);
  const heroImage = images[0] || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80";

  // Specification items
  const specs = [
    { icon: Ruler, label: 'Area', value: design.specifications?.area, suffix: 'sqft' },
    { icon: Bed, label: 'Bedrooms', value: design.specifications?.bedrooms },
    { icon: Bath, label: 'Bathrooms', value: design.specifications?.bathrooms },
    { icon: Layers, label: 'Floors', value: design.specifications?.floors },
  ].filter(spec => spec.value);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Floating Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="fixed top-24 left-6 z-50"
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate("/studio")}
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
            alt={design.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
        </motion.div>

        {/* Hero Content */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="absolute inset-0 flex items-end"
        >
          <div className="max-w-7xl mx-auto px-6 pb-16 w-full">
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="max-w-3xl"
            >
              {/* Badge */}
              {design.category && (
                <motion.div variants={fadeInUp} className="mb-4">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-sm font-medium">
                    <Building2 className="w-4 h-4" />
                    {design.category}
                  </span>
                </motion.div>
              )}

              {/* Title */}
              <motion.h1
                variants={fadeInUp}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight"
              >
                {design.title}
              </motion.h1>

              {/* Meta Info */}
              <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-4 text-white/80 mb-6">
                <span className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  {design.style || 'Modern'}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/40" />
                <span className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  {design.firm?.name}
                </span>
                {design.rating && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-white/40" />
                    <span className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-white">{design.rating}</span>
                      <span className="text-white/60">({design.reviewCount} reviews)</span>
                    </span>
                  </>
                )}
              </motion.div>

              {/* Action Buttons */}
              <motion.div variants={fadeInUp} className="flex flex-wrap gap-3">
                <Button
                  onClick={handleContact}
                  size="lg"
                  className="bg-white text-slate-900 hover:bg-slate-100 shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Designer
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleSave}
                  className="border-white/30 text-white hover:bg-white/20 backdrop-blur-md transition-all duration-300"
                >
                  <Heart className={`w-4 h-4 mr-2 transition-all duration-300 ${saved ? 'fill-red-500 text-red-500' : ''}`} />
                  {saved ? 'Saved' : 'Save'}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShare}
                  className="border-white/30 text-white hover:bg-white/20 backdrop-blur-md transition-all duration-300"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            className="lg:col-span-2 space-y-8"
          >
            {/* Specifications Grid */}
            {specs.length > 0 && (
              <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    <p className="text-2xl font-bold text-slate-900">
                      {spec.value}
                      {spec.suffix && <span className="text-sm font-medium text-slate-500 ml-1">{spec.suffix}</span>}
                    </p>
                    <p className="text-sm text-slate-500">{spec.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Description Section */}
            <motion.div
              variants={fadeInUp}
              className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow duration-500"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                About This Design
              </h2>
              <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-line">
                {design.description || 'No description available for this design. Contact the designer for more details about this architectural plan.'}
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
                Design Details
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {design.category && (
                  <div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Category</p>
                    <span className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 font-medium text-sm inline-block">
                      {design.category}
                    </span>
                  </div>
                )}
                {design.style && (
                  <div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Style</p>
                    <span className="px-4 py-2 rounded-full bg-purple-50 text-purple-700 font-medium text-sm inline-block">
                      {design.style}
                    </span>
                  </div>
                )}
                {design.climate && (
                  <div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Climate</p>
                    <span className="px-4 py-2 rounded-full bg-cyan-50 text-cyan-700 font-medium text-sm inline-block">
                      {design.climate}
                    </span>
                  </div>
                )}
                {design.typology && (
                  <div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Typology</p>
                    <span className="px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 font-medium text-sm inline-block">
                      {design.typology}
                    </span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {design.tags?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {design.tags.map((tag, idx) => (
                      <motion.span
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        viewport={{ once: true }}
                        className="px-4 py-2 rounded-full bg-gradient-to-r from-slate-50 to-slate-100 text-slate-600 font-medium text-sm hover:shadow-md hover:scale-105 transition-all duration-300 cursor-default"
                      >
                        {tag}
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Image Gallery */}
            {images.length > 0 && (
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
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      viewport={{ once: true }}
                      onClick={() => openLightbox(idx)}
                      className="group relative aspect-video rounded-2xl overflow-hidden bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                    >
                      <img
                        src={img}
                        alt={`Gallery ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-all duration-300 flex items-center justify-center">
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
                { icon: Shield, label: 'Verified Designer' },
                { icon: Zap, label: 'Quick Delivery' },
                { icon: Sparkles, label: 'Premium Quality' },
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
          <motion.div
            variants={slideInFromRight}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.4 }}
            className="lg:col-span-1"
          >
            <div className="sticky top-24 space-y-6">
              {/* Main Pricing Card */}
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
                {/* Price */}
                {design.priceSqft && (
                  <div className="mb-6">
                    <p className="text-sm text-slate-500 font-medium mb-2">Price per Sq. Ft.</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-slate-900">
                        ${design.priceSqft?.toLocaleString()}
                      </span>
                      <span className="text-xl text-slate-500 font-medium">
                        / sqft
                      </span>
                    </div>
                  </div>
                )}

                {/* Total Estimate */}
                {design.totalPrice && (
                  <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100">
                    <p className="text-sm text-slate-500 font-medium mb-1">Estimated Total</p>
                    <p className="text-3xl font-bold text-slate-900">
                      ${design.totalPrice?.toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Delivery Time */}
                {design.deliveryTime && (
                  <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Delivery Time</p>
                      <p className="text-blue-900 font-semibold">{design.deliveryTime}</p>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-bold text-slate-900">{design.views || 0}</p>
                    <p className="text-sm text-slate-500">Views</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-bold text-slate-900">{design.saves || 0}</p>
                    <p className="text-sm text-slate-500">Saves</p>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleContact}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white h-14 text-base font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Contact Designer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSave}
                    className="w-full h-14 text-base font-semibold rounded-2xl border-2 hover:bg-slate-50 transition-all duration-300"
                  >
                    <Heart className={`w-5 h-5 mr-2 transition-all duration-300 ${saved ? 'fill-red-500 text-red-500' : ''}`} />
                    {saved ? 'Saved to Collection' : 'Save for Later'}
                  </Button>
                </div>
              </div>

              {/* Designer Info Card */}
              {design.firm && (
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-slate-400" />
                    About the Designer
                  </h3>

                  {design.firm.logo && (
                    <img
                      src={design.firm.logo}
                      alt={design.firm.name}
                      className="w-16 h-16 rounded-full mb-4 border-2 border-white/20"
                    />
                  )}

                  <p className="font-semibold text-lg mb-2">{design.firm.name}</p>

                  {design.firm.bio && (
                    <p className="text-sm text-slate-300 mb-4">{design.firm.bio}</p>
                  )}

                  {design.firm.services?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-slate-400 mb-2">Services</p>
                      <div className="space-y-1">
                        {design.firm.services.map((service, idx) => (
                          <p key={idx} className="text-sm text-slate-300">• {service}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 border-t border-white/10 pt-4">
                    {(design.firm.contact?.email || design.firm.contactEmail) && (
                      <a
                        href={`mailto:${design.firm.contact?.email || design.firm.contactEmail}`}
                        className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors group"
                      >
                        <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="text-sm">Send Email</span>
                      </a>
                    )}
                    {design.firm.contact?.phone && (
                      <a
                        href={`tel:${design.firm.contact.phone}`}
                        className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors group"
                      >
                        <Phone className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="text-sm">{design.firm.contact.phone}</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && images.length > 0 && (
          <motion.div
            variants={fadeIn}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-300"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-6 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-300"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-6 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-300"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            {/* Image */}
            <motion.img
              key={lightboxIndex}
              variants={scaleIn}
              initial="initial"
              animate="animate"
              exit="exit"
              src={images[lightboxIndex]}
              alt={`Gallery ${lightboxIndex + 1}`}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Counter */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium">
              {lightboxIndex + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
