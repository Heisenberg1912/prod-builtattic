import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Mail,
  Heart,
  Share2,
  CheckCircle,
  Award,
  Briefcase,
  Globe,
  Phone,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Shield,
  Zap,
  MessageCircle,
} from "lucide-react";
import { Button } from "../components/ui/button";
import Footer from "../components/Footer";
import toast from "react-hot-toast";
import { getAllPublishedServices, incrementViews } from "../services/associateServices";

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

export default function AssociateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
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
    loadService();
  }, [id]);

  const loadService = async () => {
    setLoading(true);
    try {
      const localServices = getAllPublishedServices();
      const localService = localServices.find(s => s.id === id);

      if (localService) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setService({
          ...localService,
          name: user.name || user.fullName || 'Independent Professional',
          firmName: user.firmName || 'Independent',
          avatar: user.profileImage || null,
          email: user.email || 'contact@example.com',
          location: localService.location || 'Remote',
          rating: 4.8,
          reviewCount: Math.floor(Math.random() * 50) + 10,
          completedProjects: localService.completedProjects || Math.floor(Math.random() * 30) + 5,
          responseTime: localService.responseTime || 'Within 24 hours',
          availability: localService.availability || 'Available',
        });
        incrementViews(id);
      } else {
        toast.error("Service not found");
        navigate("/associates");
      }
    } catch (error) {
      console.error("Error loading service:", error);
      toast.error("Failed to load service");
      navigate("/associates");
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
    if (service?.email) {
      window.location.href = `mailto:${service.email}?subject=Inquiry: ${service.title}`;
    }
  };

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const nextImage = () => {
    if (service?.portfolio?.length > 0) {
      setLightboxIndex((prev) => (prev + 1) % service.portfolio.length);
    }
  };

  const prevImage = () => {
    if (service?.portfolio?.length > 0) {
      setLightboxIndex((prev) => (prev - 1 + service.portfolio.length) % service.portfolio.length);
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
          <p className="text-slate-600 font-medium">Loading service details...</p>
        </motion.div>
      </div>
    );
  }

  if (!service) return null;

  const portfolio = service.portfolio?.length > 0 ? service.portfolio : [];
  const heroImage = portfolio[0] || service.avatar || "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80";

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
          onClick={() => navigate("/associates")}
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
            alt={service.title}
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
              {service.specialization && (
                <motion.div variants={fadeInUp} className="mb-4">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    {service.specialization}
                  </span>
                </motion.div>
              )}

              {/* Title */}
              <motion.h1
                variants={fadeInUp}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight"
              >
                {service.title}
              </motion.h1>

              {/* Meta Info */}
              <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-4 text-white/80 mb-6">
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {service.location}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/40" />
                <span className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  {service.firmName}
                </span>
                {service.rating && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-white/40" />
                    <span className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-white">{service.rating}</span>
                      <span className="text-white/60">({service.reviewCount} reviews)</span>
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
                  Get in Touch
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
            {/* About Section */}
            <motion.div
              variants={fadeInUp}
              className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow duration-500"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                About This Service
              </h2>
              <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-line">
                {service.description || 'No description available for this service. Contact the professional for more details.'}
              </p>
            </motion.div>

            {/* Skills & Tools */}
            {(service.skills?.length > 0 || service.tools?.length > 0) && (
              <motion.div
                variants={fadeInUp}
                className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow duration-500"
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  Skills & Expertise
                </h2>

                {service.skills?.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Core Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {service.skills.map((skill, idx) => (
                        <motion.span
                          key={idx}
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          viewport={{ once: true }}
                          className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 font-medium text-sm hover:shadow-md hover:scale-105 transition-all duration-300 cursor-default"
                        >
                          {skill}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )}

                {service.tools?.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Tools & Software</p>
                    <div className="flex flex-wrap gap-2">
                      {service.tools.map((tool, idx) => (
                        <motion.span
                          key={idx}
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          viewport={{ once: true }}
                          className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 font-medium text-sm hover:bg-slate-200 hover:scale-105 transition-all duration-300 cursor-default"
                        >
                          {tool}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Portfolio Gallery */}
            {portfolio.length > 0 && (
              <motion.div
                variants={fadeInUp}
                className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow duration-500"
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  Portfolio
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {portfolio.map((img, idx) => (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      viewport={{ once: true }}
                      onClick={() => openLightbox(idx)}
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                    >
                      <img
                        src={img}
                        alt={`Portfolio ${idx + 1}`}
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
                { icon: Shield, label: 'Verified Professional' },
                { icon: Clock, label: 'Quick Response' },
                { icon: CheckCircle, label: 'Quality Guaranteed' },
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
                {/* Rate */}
                <div className="mb-6">
                  <p className="text-sm text-slate-500 font-medium mb-2">Service Rate</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-slate-900">
                      ${service.rate?.toLocaleString() || '0'}
                    </span>
                    <span className="text-xl text-slate-500 font-medium">
                      / {service.rateType || 'hour'}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { label: 'Projects', value: service.completedProjects, icon: Briefcase },
                    { label: 'Response', value: service.responseTime?.split(' ')[0] || '24', suffix: 'hrs', icon: Clock },
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-2xl p-4">
                      <stat.icon className="w-5 h-5 text-slate-400 mb-2" />
                      <p className="text-2xl font-bold text-slate-900">
                        {stat.value}{stat.suffix && <span className="text-sm font-medium text-slate-500">{stat.suffix}</span>}
                      </p>
                      <p className="text-sm text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Availability */}
                {service.availability && (
                  <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-emerald-700 font-medium">{service.availability}</span>
                  </div>
                )}

                {/* Experience */}
                {service.experience && (
                  <div className="flex items-center gap-3 mb-6 text-slate-600">
                    <Award className="w-5 h-5 text-slate-400" />
                    <span className="font-medium">{service.experience} experience</span>
                  </div>
                )}

                {/* CTA Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleContact}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white h-14 text-base font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Contact Professional
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

              {/* Contact Info Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-slate-400" />
                  Contact Information
                </h3>
                <div className="space-y-3">
                  {service.email && (
                    <a
                      href={`mailto:${service.email}`}
                      className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors group"
                    >
                      <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span className="text-sm truncate">{service.email}</span>
                    </a>
                  )}
                  <div className="flex items-center gap-3 text-slate-300">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{service.location}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && portfolio.length > 0 && (
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
            {portfolio.length > 1 && (
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
              src={portfolio[lightboxIndex]}
              alt={`Portfolio ${lightboxIndex + 1}`}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Counter */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium">
              {lightboxIndex + 1} / {portfolio.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
