import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  DollarSign,
  Mail,
  Heart,
  Share2,
  CheckCircle,
  Award,
  Calendar,
  Briefcase,
  Tag,
  Globe,
  Phone,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import Footer from "../components/Footer";
import toast from "react-hot-toast";
import { getAllPublishedServices } from "../services/associateServices";

export default function AssociateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadService();
  }, [id]);

  const loadService = async () => {
    setLoading(true);
    try {
      // Get from localStorage
      const localServices = getAllPublishedServices();
      const localService = localServices.find(s => s.id === id);

      if (localService) {
        // Convert to display format
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setService({
          ...localService,
          name: user.name || user.fullName || 'Independent Professional',
          firmName: user.firmName || 'Independent',
          avatar: user.profileImage || null,
          email: user.email || 'contact@example.com',
          location: localService.location || 'Remote',
          rating: 4.5,
          reviewCount: 0,
          completedProjects: localService.completedProjects || 0,
          responseTime: localService.responseTime || '24 hours',
          availability: localService.availability || 'Available',
        });
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
    toast.success(saved ? "Removed from wishlist" : "Added to wishlist");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const handleContact = () => {
    if (service?.email) {
      window.location.href = `mailto:${service.email}?subject=Inquiry about ${service.title}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900 mx-auto mb-4"></div>
          <p className="text-stone-600">Loading service...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return null;
  }

  const portfolio = service.portfolio && service.portfolio.length > 0 ? service.portfolio : [];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/associates")}
            className="text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Associates Marketplace
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Service Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-6 mb-6">
                  {service.avatar && (
                    <img
                      src={service.avatar}
                      alt={service.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-stone-100"
                    />
                  )}
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-stone-900 mb-2">{service.title}</h1>
                    <div className="flex items-center gap-4 text-stone-600 mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{service.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Globe className="w-4 h-4" />
                        <span>{service.location}</span>
                      </div>
                    </div>
                    {service.rating && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(service.rating)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'fill-stone-200 text-stone-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-stone-600">{service.rating} / 5.0</span>
                        <span className="text-sm text-stone-400">({service.reviewCount} reviews)</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleSave}
                    >
                      <Heart className={`w-4 h-4 ${saved ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleShare}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Status Badge */}
                {service.status === 'published' && service.availability && (
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className="bg-emerald-500 text-white">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {service.availability}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-stone-900 mb-4">About This Service</h2>
                <p className="text-stone-700 leading-relaxed whitespace-pre-line">
                  {service.description || 'No description available'}
                </p>
              </CardContent>
            </Card>

            {/* Skills & Tools */}
            {(service.skills?.length > 0 || service.tools?.length > 0) && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-stone-900 mb-4">Skills & Tools</h2>

                  {service.skills && service.skills.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-stone-700 mb-2">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {service.skills.map((skill, idx) => (
                          <Badge key={idx} variant="secondary" className="bg-purple-100 text-purple-700">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {service.tools && service.tools.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-stone-700 mb-2">Tools</p>
                      <div className="flex flex-wrap gap-2">
                        {service.tools.map((tool, idx) => (
                          <Badge key={idx} variant="outline" className="border-stone-300">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Portfolio */}
            {portfolio.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-stone-900 mb-4">Portfolio</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {portfolio.map((img, idx) => (
                      <div key={idx} className="aspect-video rounded-lg overflow-hidden bg-stone-100">
                        <img
                          src={img}
                          alt={`Portfolio ${idx + 1}`}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Pricing & Contact */}
          <div className="lg:col-span-1 space-y-6">
            {/* Pricing Card */}
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-6">
                <div>
                  <p className="text-sm text-stone-600 mb-2">Service Rate</p>
                  <p className="text-4xl font-bold text-stone-900">
                    ${service.rate?.toLocaleString() || '0'}
                    <span className="text-lg text-stone-600 font-normal">
                      / {service.rateType || 'hour'}
                    </span>
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-stone-200">
                  {service.experience && (
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-stone-400" />
                      <div className="flex-1">
                        <p className="text-sm text-stone-600">Experience</p>
                        <p className="font-semibold text-stone-900">{service.experience}</p>
                      </div>
                    </div>
                  )}

                  {service.responseTime && (
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-stone-400" />
                      <div className="flex-1">
                        <p className="text-sm text-stone-600">Response Time</p>
                        <p className="font-semibold text-stone-900">{service.responseTime}</p>
                      </div>
                    </div>
                  )}

                  {service.completedProjects > 0 && (
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-5 h-5 text-stone-400" />
                      <div className="flex-1">
                        <p className="text-sm text-stone-600">Completed Projects</p>
                        <p className="font-semibold text-stone-900">{service.completedProjects}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-4 border-t border-stone-200">
                  <Button
                    onClick={handleContact}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    size="lg"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Professional
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSave}
                    className="w-full"
                    size="lg"
                  >
                    <Heart className={`w-4 h-4 mr-2 ${saved ? 'fill-red-500 text-red-500' : ''}`} />
                    {saved ? 'Saved' : 'Save for Later'}
                  </Button>
                </div>

                {/* Stats */}
                <div className="border-t border-stone-200 pt-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-stone-900">{service.views || 0}</p>
                      <p className="text-sm text-stone-600">Views</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-stone-900">{service.saves || 0}</p>
                      <p className="text-sm text-stone-600">Saves</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Info */}
            {service.category && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-stone-900 mb-4">Service Details</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-stone-600 mb-1">Category</p>
                      <Badge variant="outline">{service.category}</Badge>
                    </div>
                    {service.specialization && (
                      <div>
                        <p className="text-sm text-stone-600 mb-1">Specialization</p>
                        <Badge variant="outline">{service.specialization}</Badge>
                      </div>
                    )}
                  </div>
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
