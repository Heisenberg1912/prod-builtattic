import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Heart,
  MessageSquare,
  Share2,
  Calendar,
  Clock,
  CheckCircle,
  Star,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import StatusBadge from "../../../components/associate/StatusBadge";
import { getServiceById, deleteService, duplicateService, togglePublishStatus } from "../../../services/associateServices";
import toast from "react-hot-toast";

export default function SkillStudioDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Component state
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);

  // Load service data on mount
  useEffect(() => {
    loadService();
  }, [id]);

  /**
   * Load service from localStorage
   */
  const loadService = () => {
    const serviceData = getServiceById(id);
    if (!serviceData) {
      toast.error("Service not found");
      navigate("/associates/skill-studio");
      return;
    }
    setService(serviceData);
    setLoading(false);
  };

  /**
   * Delete service with confirmation
   */
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    const result = deleteService(id);
    if (result.success) {
      toast.success("Service deleted successfully");
      navigate("/associates/skill-studio");
    } else {
      toast.error("Failed to delete service");
    }
  };

  /**
   * Duplicate service and navigate to edit
   */
  const handleDuplicate = async () => {
    const result = duplicateService(id);
    if (result.success) {
      toast.success("Service duplicated successfully");
      navigate(`/associates/skill-studio/${result.service.id}/edit`);
    } else {
      toast.error("Failed to duplicate service");
    }
  };

  /**
   * Toggle publish status between draft and published
   */
  const handleToggleStatus = async () => {
    const result = togglePublishStatus(id);
    if (result.success) {
      const newStatus = result.service.status;
      toast.success(`Service ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`);
      loadService();
    } else {
      toast.error("Failed to update status");
    }
  };

  /**
   * Copy service link to clipboard
   */
  const handleShare = () => {
    const url = `${window.location.origin}/services/${id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!service) return null;

  // Prepare images array
  const images = service.images && service.images.length > 0 ? service.images : [service.thumbnail];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header with Actions */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/associates/skill-studio")}
              className="text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Skill Studio
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
                className="border-slate-300"
              >
                {previewMode ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Edit View
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="border-slate-300"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Status Banner (only in edit mode) */}
          {!previewMode && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusBadge status={service.status} />
                  <span className="text-sm text-slate-600">
                    {service.status === 'published' ? 'Visible to buyers' : 'Only visible to you'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleStatus}
                    className="border-purple-300 text-purple-700"
                  >
                    {service.status === 'published' ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/associates/skill-studio/${id}/edit`)}
                    className="border-purple-300 text-purple-700"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDuplicate}
                    className="border-slate-300"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold text-slate-900 mb-2">{service.title}</h1>
                      <div className="flex items-center gap-3 text-sm text-slate-600 mb-4">
                        <span className="font-medium">{service.category}</span>
                        {service.rating && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                              <span className="font-semibold">{service.rating}</span>
                              {service.reviewCount && (
                                <span className="text-slate-500">({service.reviewCount} reviews)</span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="prose max-w-none mb-6">
                    <p className="text-slate-700 leading-relaxed">{service.description}</p>
                  </div>

                  {service.tags && service.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {service.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Pricing Packages */}
            {service.packages && service.packages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Pricing Packages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {service.packages.map((pkg, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-lg border-2 ${
                            pkg.popular
                              ? "border-purple-500 bg-purple-50"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          {pkg.popular && (
                            <Badge className="mb-2 bg-purple-600">Most Popular</Badge>
                          )}
                          <h3 className="font-semibold text-slate-900 mb-2">{pkg.name}</h3>
                          <div className="mb-3">
                            <span className="text-3xl font-bold text-purple-600">${pkg.price}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                            <Clock className="w-4 h-4" />
                            <span>{pkg.deliveryTime}</span>
                          </div>
                          <ul className="space-y-2">
                            {pkg.features.map((feature, featureIdx) => (
                              <li key={featureIdx} className="flex items-start gap-2 text-sm text-slate-700">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Requirements */}
            {service.requirements && service.requirements.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>What I Need From You</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {service.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-slate-700">
                          <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Portfolio Examples */}
            {service.portfolio && service.portfolio.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Portfolio Examples</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {service.portfolio.map((img, idx) => (
                        <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-slate-100">
                          <img src={img} alt={`Example ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Performance Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Performance</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">Views</span>
                      </div>
                      <span className="font-semibold text-slate-900">{service.views || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Heart className="w-4 h-4" />
                        <span className="text-sm">Saves</span>
                      </div>
                      <span className="font-semibold text-slate-900">{service.saves || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-600">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-sm">Inquiries</span>
                      </div>
                      <span className="font-semibold text-slate-900">{service.inquiries || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Service Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Created</span>
                      <span className="text-slate-900">
                        {new Date(service.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Last Updated</span>
                      <span className="text-slate-900">
                        {new Date(service.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {service.rating && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Rating</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="text-slate-900 font-semibold">{service.rating}/5</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
