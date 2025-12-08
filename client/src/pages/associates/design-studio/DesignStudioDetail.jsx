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
  DollarSign,
  Maximize2,
  MapPin,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import StatusBadge from "../../../components/associate/StatusBadge";
import { getDesignById, deleteDesign, duplicateDesign, togglePublishStatus } from "../../../services/associateDesigns";
import toast from "react-hot-toast";

export default function DesignStudioDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    loadDesign();
  }, [id]);

  const loadDesign = () => {
    const designData = getDesignById(id);
    if (!designData) {
      toast.error("Design plan not found");
      navigate("/associates/design-studio");
      return;
    }
    setDesign(designData);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this design plan?")) return;

    const result = deleteDesign(id);
    if (result.success) {
      toast.success("Design plan deleted successfully");
      navigate("/associates/design-studio");
    } else {
      toast.error("Failed to delete design plan");
    }
  };

  const handleDuplicate = async () => {
    const result = duplicateDesign(id);
    if (result.success) {
      toast.success("Design plan duplicated successfully");
      navigate(`/associates/design-studio/${result.design.id}/edit`);
    } else {
      toast.error("Failed to duplicate design plan");
    }
  };

  const handleToggleStatus = async () => {
    const result = togglePublishStatus(id);
    if (result.success) {
      const newStatus = result.design.status;
      toast.success(`Design plan ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`);
      loadDesign();
    } else {
      toast.error("Failed to update status");
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/studio/${id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!design) return null;

  const images = design.images && design.images.length > 0 ? design.images : [design.thumbnail];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/associates/design-studio")}
              className="text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Design Studio
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

          {!previewMode && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusBadge status={design.status} />
                  <span className="text-sm text-slate-600">
                    {design.status === 'published' ? 'Visible to buyers' : 'Only visible to you'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleStatus}
                    className="border-blue-300 text-blue-700"
                  >
                    {design.status === 'published' ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/associates/design-studio/${id}/edit`)}
                    className="border-blue-300 text-blue-700"
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
            {/* Image Gallery */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="overflow-hidden">
                <div className="relative aspect-video bg-slate-100">
                  {images[selectedImage] ? (
                    <img
                      src={images[selectedImage]}
                      alt={design.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Maximize2 className="w-16 h-16 text-slate-300" />
                    </div>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="p-4 grid grid-cols-4 gap-2">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        className={`aspect-video rounded-lg overflow-hidden border-2 ${
                          selectedImage === idx ? "border-blue-600" : "border-slate-200"
                        }`}
                      >
                        <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900 mb-2">{design.title}</h1>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <span className="font-medium">{design.category}</span>
                        {design.typology && (
                          <>
                            <span>•</span>
                            <span>{design.typology}</span>
                          </>
                        )}
                        {design.style && (
                          <>
                            <span>•</span>
                            <span>{design.style}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="prose max-w-none mb-6">
                    <p className="text-slate-700 leading-relaxed">{design.description}</p>
                  </div>

                  {design.tags && design.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {design.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Specifications */}
            {design.specifications && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Specifications</h2>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(design.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center py-2 border-b border-slate-200">
                          <span className="text-slate-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="font-semibold text-slate-900">{value}</span>
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
            {/* Stats */}
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
                      <span className="font-semibold text-slate-900">{design.views || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Heart className="w-4 h-4" />
                        <span className="text-sm">Saves</span>
                      </div>
                      <span className="font-semibold text-slate-900">{design.saves || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-600">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-sm">Inquiries</span>
                      </div>
                      <span className="font-semibold text-slate-900">{design.inquiries || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pricing */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Pricing</h3>
                  <div className="space-y-3">
                    {design.priceSqft && (
                      <div className="flex items-center justify-between py-2 border-b border-slate-200">
                        <span className="text-slate-600">Per Sq. Ft.</span>
                        <span className="text-2xl font-bold text-slate-900">${design.priceSqft}</span>
                      </div>
                    )}
                    {design.totalPrice && (
                      <div className="flex items-center justify-between py-2 border-b border-slate-200">
                        <span className="text-slate-600">Total Price</span>
                        <span className="text-xl font-bold text-blue-600">
                          ${design.totalPrice.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {design.deliveryTime && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 pt-2">
                        <Calendar className="w-4 h-4" />
                        <span>Delivery: {design.deliveryTime}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Metadata */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Created</span>
                      <span className="text-slate-900">
                        {new Date(design.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Last Updated</span>
                      <span className="text-slate-900">
                        {new Date(design.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {design.climate && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Climate</span>
                        <span className="text-slate-900">{design.climate}</span>
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
