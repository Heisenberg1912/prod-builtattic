import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Star,
  MapPin,
  Ruler,
  Bed,
  Bath,
  Layers,
  Mail,
  Phone,
  Globe,
  Heart,
  Share2,
  Download,
  Calendar,
  DollarSign,
  Tag,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import Footer from "../components/Footer";
import toast from "react-hot-toast";
import { getAllPublishedDesigns } from "../services/associateDesigns";

export default function StudioDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadDesign();
  }, [id]);

  const loadDesign = async () => {
    setLoading(true);
    try {
      // Get from localStorage first
      const localDesigns = getAllPublishedDesigns();
      const localDesign = localDesigns.find(d => d.id === id);

      if (localDesign) {
        // Convert to display format
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
          rating: 4.5,
        });
      } else {
        // Try fetching from API (future implementation)
        toast.error("Design not found");
        navigate("/studio");
      }
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
    toast.success(saved ? "Removed from wishlist" : "Added to wishlist");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const handleContact = () => {
    if (design?.firm?.contact?.email) {
      window.location.href = `mailto:${design.firm.contact.email}?subject=Inquiry about ${design.title}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading design...</p>
        </div>
      </div>
    );
  }

  if (!design) {
    return null;
  }

  const images = design.images && design.images.length > 0 ? design.images : [design.thumbnail].filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/studio")}
            className="text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Studio Marketplace
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative aspect-video bg-slate-200 rounded-2xl overflow-hidden"
            >
              {images[selectedImage] ? (
                <img
                  src={images[selectedImage]}
                  alt={design.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <Layers className="w-16 h-16" />
                </div>
              )}

              {/* Image Actions */}
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="bg-white/90 backdrop-blur-sm"
                  onClick={handleSave}
                >
                  <Heart className={`w-4 h-4 ${saved ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="bg-white/90 backdrop-blur-sm"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Status Badge */}
              {design.status === 'published' && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-emerald-500 text-white">
                    Published
                  </Badge>
                </div>
              )}
            </motion.div>

            {/* Image Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-video rounded-lg overflow-hidden border-2 transition ${
                      selectedImage === idx
                        ? 'border-blue-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`View ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Description</h2>
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {design.description || 'No description available'}
                </p>
              </CardContent>
            </Card>

            {/* Specifications */}
            {design.specifications && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Specifications</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {design.specifications.area && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Ruler className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Area</p>
                          <p className="font-semibold text-slate-900">{design.specifications.area} sqft</p>
                        </div>
                      </div>
                    )}
                    {design.specifications.bedrooms && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Bed className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Bedrooms</p>
                          <p className="font-semibold text-slate-900">{design.specifications.bedrooms}</p>
                        </div>
                      </div>
                    )}
                    {design.specifications.bathrooms && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                          <Bath className="w-5 h-5 text-cyan-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Bathrooms</p>
                          <p className="font-semibold text-slate-900">{design.specifications.bathrooms}</p>
                        </div>
                      </div>
                    )}
                    {design.specifications.floors && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <Layers className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Floors</p>
                          <p className="font-semibold text-slate-900">{design.specifications.floors}</p>
                        </div>
                      </div>
                    )}
                    {design.specifications.parking && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Parking</p>
                          <p className="font-semibold text-slate-900">{design.specifications.parking}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Details */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {design.category && (
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Category</p>
                      <Badge variant="outline">{design.category}</Badge>
                    </div>
                  )}
                  {design.style && (
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Style</p>
                      <Badge variant="outline">{design.style}</Badge>
                    </div>
                  )}
                  {design.climate && (
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Climate</p>
                      <Badge variant="outline">{design.climate}</Badge>
                    </div>
                  )}
                  {design.typology && (
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Typology</p>
                      <Badge variant="outline">{design.typology}</Badge>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {design.tags && design.tags.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-slate-600 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {design.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-slate-100">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Pricing & Contact */}
          <div className="lg:col-span-1 space-y-6">
            {/* Pricing Card */}
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">{design.title}</h1>
                  {design.firm?.name && (
                    <p className="text-slate-600 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {design.firm.name}
                    </p>
                  )}
                </div>

                {/* Rating */}
                {design.rating && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(design.rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-slate-200 text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-slate-600">{design.rating} / 5.0</span>
                  </div>
                )}

                <div className="border-t border-slate-200 pt-6">
                  {design.priceSqft && (
                    <div className="mb-4">
                      <p className="text-sm text-slate-600 mb-1">Price per Sq. Ft.</p>
                      <p className="text-3xl font-bold text-slate-900">
                        ${design.priceSqft.toLocaleString()}
                        <span className="text-lg text-slate-600 font-normal"> / sqft</span>
                      </p>
                    </div>
                  )}

                  {design.totalPrice && (
                    <div className="bg-slate-50 rounded-lg p-4 mb-4">
                      <p className="text-sm text-slate-600 mb-1">Estimated Total</p>
                      <p className="text-2xl font-bold text-slate-900">
                        ${design.totalPrice.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {design.deliveryTime && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                      <Calendar className="w-4 h-4" />
                      <span>Delivery: {design.deliveryTime}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleContact}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Designer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSave}
                    className="w-full"
                    size="lg"
                  >
                    <Heart className={`w-4 h-4 mr-2 ${saved ? 'fill-red-500 text-red-500' : ''}`} />
                    {saved ? 'Saved' : 'Save to Wishlist'}
                  </Button>
                </div>

                {/* Stats */}
                <div className="border-t border-slate-200 pt-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{design.views || 0}</p>
                      <p className="text-sm text-slate-600">Views</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{design.saves || 0}</p>
                      <p className="text-sm text-slate-600">Saves</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Designer Info Card */}
            {design.firm && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-slate-900 mb-4">About the Designer</h3>

                  {design.firm.logo && (
                    <img
                      src={design.firm.logo}
                      alt={design.firm.name}
                      className="w-16 h-16 rounded-full mb-4"
                    />
                  )}

                  <p className="font-semibold text-slate-900 mb-2">{design.firm.name}</p>

                  {design.firm.bio && (
                    <p className="text-sm text-slate-600 mb-4">{design.firm.bio}</p>
                  )}

                  {design.firm.services && design.firm.services.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-slate-700 mb-2">Services</p>
                      <div className="space-y-1">
                        {design.firm.services.map((service, idx) => (
                          <p key={idx} className="text-sm text-slate-600">• {service}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {design.firm.contact && (
                    <div className="space-y-2 border-t border-slate-200 pt-4">
                      {design.firm.contact.email && (
                        <a
                          href={`mailto:${design.firm.contact.email}`}
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                        >
                          <Mail className="w-4 h-4" />
                          Send Email
                        </a>
                      )}
                      {design.firm.contact.phone && (
                        <a
                          href={`tel:${design.firm.contact.phone}`}
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                        >
                          <Phone className="w-4 h-4" />
                          {design.firm.contact.phone}
                        </a>
                      )}
                      {design.firm.website && (
                        <a
                          href={design.firm.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                        >
                          <Globe className="w-4 h-4" />
                          Visit Website
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
