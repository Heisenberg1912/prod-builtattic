import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
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
  Phone,
  Globe,
  Calendar,
  DollarSign,
  MessageSquare,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import Footer from "../components/Footer";
import toast from "react-hot-toast";
import { getAllPublishedServices } from "../services/associateServices";

export default function AssociateServicePortfolio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [associateData, setAssociateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('services');

  useEffect(() => {
    loadAssociateProfile();
  }, [id]);

  const loadAssociateProfile = () => {
    setLoading(true);
    try {
      // Get all services from this associate
      const allServices = getAllPublishedServices();
      const associateServices = allServices.filter(s => s.userId === id);

      if (associateServices.length === 0) {
        toast.error("Associate not found");
        navigate("/associates");
        return;
      }

      // Build profile from first service (they all share same user)
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      setAssociateData({
        id: id,
        name: user.name || user.fullName || 'Professional Associate',
        avatar: user.profileImage || null,
        bio: user.bio || 'Experienced professional offering quality services',
        email: user.email || 'contact@example.com',
        phone: user.phone || null,
        location: user.location || 'Remote',
        website: user.website || null,

        // Aggregate data from all services
        services: associateServices,
        totalServices: associateServices.length,
        totalViews: associateServices.reduce((sum, s) => sum + (s.views || 0), 0),
        totalSaves: associateServices.reduce((sum, s) => sum + (s.saves || 0), 0),

        // Get unique skills and tools across all services
        allSkills: [...new Set(associateServices.flatMap(s => s.skills || []))],
        allTools: [...new Set(associateServices.flatMap(s => s.tools || []))],

        // Rating (can be enhanced later)
        rating: 4.5,
        reviewCount: 12,
        completedProjects: associateServices.reduce((sum, s) => sum + (s.completedProjects || 0), 0),

        // Member since
        memberSince: associateServices[0]?.createdAt || new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error loading associate:", error);
      toast.error("Failed to load profile");
      navigate("/associates");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    setSaved(!saved);
    toast.success(saved ? "Removed from favorites" : "Added to favorites");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Profile link copied!");
  };

  const handleContact = () => {
    if (associateData?.email) {
      window.location.href = `mailto:${associateData.email}?subject=Service Inquiry`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-stone-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!associateData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md border-b border-stone-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/associates")}
            className="text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Associates
          </Button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            {/* Avatar */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
            >
              {associateData.avatar ? (
                <img
                  src={associateData.avatar}
                  alt={associateData.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center text-5xl font-bold">
                  {associateData.name.charAt(0)}
                </div>
              )}
              <div className="absolute bottom-0 right-0 bg-emerald-500 rounded-full p-2">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </motion.div>

            {/* Info */}
            <div className="flex-1">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <h1 className="text-4xl font-bold mb-2">{associateData.name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-white/90 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{associateData.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    <span>{associateData.totalServices} Service{associateData.totalServices !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    <span>{associateData.completedProjects} Projects Completed</span>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(associateData.rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-white/30 text-white/30'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-white/90">{associateData.rating} ({associateData.reviewCount} reviews)</span>
                </div>

                <p className="text-white/80 max-w-2xl">{associateData.bio}</p>
              </motion.div>
            </div>

            {/* Actions */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col gap-3 w-full md:w-auto"
            >
              <Button
                onClick={handleContact}
                size="lg"
                className="bg-white text-purple-600 hover:bg-white/90 w-full md:w-auto"
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact Me
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleSave}
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  <Heart className={`w-4 h-4 ${saved ? 'fill-white' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShare}
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Stats Bar */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"
          >
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-white">{associateData.totalServices}</p>
                <p className="text-white/70 text-sm">Active Services</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-white">{associateData.completedProjects}</p>
                <p className="text-white/70 text-sm">Completed Projects</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-white">{associateData.totalViews}</p>
                <p className="text-white/70 text-sm">Profile Views</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-white">{associateData.reviewCount}</p>
                <p className="text-white/70 text-sm">Client Reviews</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <Card>
              <CardContent className="p-0">
                <div className="flex border-b border-stone-200">
                  <button
                    onClick={() => setActiveTab('services')}
                    className={`flex-1 px-6 py-4 text-sm font-semibold transition ${
                      activeTab === 'services'
                        ? 'text-purple-600 border-b-2 border-purple-600'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Services ({associateData.totalServices})
                  </button>
                  <button
                    onClick={() => setActiveTab('skills')}
                    className={`flex-1 px-6 py-4 text-sm font-semibold transition ${
                      activeTab === 'skills'
                        ? 'text-purple-600 border-b-2 border-purple-600'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Skills & Tools
                  </button>
                </div>

                <div className="p-6">
                  {activeTab === 'services' && (
                    <div className="space-y-4">
                      {associateData.services.map((service) => (
                        <Link
                          key={service.id}
                          to={`/associates/skill-studio/${service.id}`}
                          className="block"
                        >
                          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-200">
                            <CardContent className="p-6">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold text-stone-900 mb-2">{service.title}</h3>
                                  <p className="text-stone-600 line-clamp-2">{service.description}</p>
                                </div>
                                {service.status === 'published' && (
                                  <Badge className="bg-emerald-100 text-emerald-700">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Active
                                  </Badge>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-2 mb-4">
                                {service.category && (
                                  <Badge variant="outline">{service.category}</Badge>
                                )}
                                {service.specialization && (
                                  <Badge variant="outline">{service.specialization}</Badge>
                                )}
                              </div>

                              <div className="flex items-center justify-between text-sm text-stone-600">
                                <div className="flex items-center gap-4">
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="w-4 h-4" />
                                    ${service.rate}/{service.rateType}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {service.responseTime || '24 hours'}
                                  </span>
                                </div>
                                <span className="text-purple-600 font-semibold">View Details →</span>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}

                  {activeTab === 'skills' && (
                    <div className="space-y-6">
                      {/* Skills */}
                      {associateData.allSkills.length > 0 && (
                        <div>
                          <h3 className="text-lg font-bold text-stone-900 mb-3">Skills</h3>
                          <div className="flex flex-wrap gap-2">
                            {associateData.allSkills.map((skill, idx) => (
                              <Badge key={idx} className="bg-purple-100 text-purple-700 px-4 py-2">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tools */}
                      {associateData.allTools.length > 0 && (
                        <div>
                          <h3 className="text-lg font-bold text-stone-900 mb-3">Tools & Software</h3>
                          <div className="flex flex-wrap gap-2">
                            {associateData.allTools.map((tool, idx) => (
                              <Badge key={idx} variant="outline" className="px-4 py-2 border-stone-300">
                                {tool}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Card */}
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-stone-900 text-lg">Get in Touch</h3>

                <div className="space-y-3">
                  {associateData.email && (
                    <a
                      href={`mailto:${associateData.email}`}
                      className="flex items-center gap-3 text-stone-600 hover:text-purple-600 transition"
                    >
                      <Mail className="w-5 h-5" />
                      <span className="text-sm">{associateData.email}</span>
                    </a>
                  )}

                  {associateData.phone && (
                    <a
                      href={`tel:${associateData.phone}`}
                      className="flex items-center gap-3 text-stone-600 hover:text-purple-600 transition"
                    >
                      <Phone className="w-5 h-5" />
                      <span className="text-sm">{associateData.phone}</span>
                    </a>
                  )}

                  {associateData.website && (
                    <a
                      href={associateData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-stone-600 hover:text-purple-600 transition"
                    >
                      <Globe className="w-5 h-5" />
                      <span className="text-sm">Visit Website</span>
                    </a>
                  )}
                </div>

                <Button
                  onClick={handleContact}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-stone-900">Quick Info</h3>

                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-stone-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-stone-600">Member Since</p>
                      <p className="font-semibold text-stone-900">
                        {new Date(associateData.memberSince).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-stone-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-stone-600">Location</p>
                      <p className="font-semibold text-stone-900">{associateData.location}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-stone-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-stone-600">Avg. Response Time</p>
                      <p className="font-semibold text-stone-900">24 hours</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
