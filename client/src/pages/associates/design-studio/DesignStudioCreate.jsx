import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Eye,
  Upload,
  X,
  Plus,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Label } from "../../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { createDesign, updateDesign, getDesignById } from "../../../services/associateDesigns";
import toast from "react-hot-toast";

const CATEGORIES = ["Residential", "Commercial", "Mixed-Use", "Institutional", "Industrial", "Infrastructure"];
const STYLES = ["Modern", "Contemporary", "Minimalist", "Industrial", "Scandinavian", "Classical", "Traditional"];
const CLIMATES = ["Tropical", "Temperate", "Cold", "Hot & Dry", "Mediterranean"];

export default function DesignStudioCreate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    title: "",
    category: "Residential",
    typology: "",
    style: "",
    climate: "",
    description: "",
    thumbnail: "",
    images: [],
    specifications: {
      area: "",
      bedrooms: "",
      bathrooms: "",
      floors: "",
      parking: "",
    },
    priceSqft: "",
    totalPrice: "",
    deliveryTime: "",
    tags: [],
    status: "draft",
  });

  const [tagInput, setTagInput] = useState("");
  const [imageUrls, setImageUrls] = useState([""]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      loadDesign();
    }
  }, [id]);

  const loadDesign = () => {
    const design = getDesignById(id);
    if (!design) {
      toast.error("Design plan not found");
      navigate("/associates/design-studio");
      return;
    }

    setFormData({
      ...design,
      specifications: design.specifications || {
        area: "",
        bedrooms: "",
        bathrooms: "",
        floors: "",
        parking: "",
      },
    });

    setImageUrls(design.images && design.images.length > 0 ? design.images : [""]);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSpecChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [field]: value,
      },
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim().toLowerCase()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const addImageUrl = () => {
    setImageUrls(prev => [...prev, ""]);
  };

  const updateImageUrl = (index, value) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
  };

  const removeImageUrl = (index) => {
    if (imageUrls.length > 1) {
      const newUrls = imageUrls.filter((_, i) => i !== index);
      setImageUrls(newUrls);
    }
  };

  const handleSubmit = async (publishStatus = "draft") => {
    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!formData.category) {
      toast.error("Please select a category");
      return;
    }

    setLoading(true);

    const validImages = imageUrls.filter(url => url.trim());
    const designData = {
      ...formData,
      thumbnail: validImages[0] || "",
      images: validImages,
      status: publishStatus,
      priceSqft: formData.priceSqft ? parseFloat(formData.priceSqft) : null,
      totalPrice: formData.totalPrice ? parseFloat(formData.totalPrice) : null,
    };

    try {
      let result;
      if (isEditMode) {
        result = updateDesign(id, designData);
      } else {
        result = createDesign(designData);
      }

      if (result.success) {
        toast.success(
          isEditMode
            ? `Design plan ${publishStatus === 'published' ? 'published' : 'saved'} successfully`
            : `Design plan ${publishStatus === 'published' ? 'published' : 'created'} successfully`
        );
        navigate("/associates/design-studio");
      } else {
        toast.error(result.error || "Failed to save design plan");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/associates/design-studio")}
            className="mb-4 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Design Studio
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {isEditMode ? "Edit Design Plan" : "Create Design Plan"}
              </h1>
              <p className="text-slate-600">
                {isEditMode ? "Update your design plan details" : "Add a new design plan to your portfolio"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <div className="space-y-6">
          {/* Basic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="e.g., Modern Coastal Villa Design"
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="category">
                      Category <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleInputChange("category", e.target.value)}
                      className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="style">Style</Label>
                    <select
                      id="style"
                      value={formData.style}
                      onChange={(e) => handleInputChange("style", e.target.value)}
                      className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select style</option>
                      {STYLES.map(style => (
                        <option key={style} value={style}>{style}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="climate">Climate</Label>
                    <select
                      id="climate"
                      value={formData.climate}
                      onChange={(e) => handleInputChange("climate", e.target.value)}
                      className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select climate</option>
                      {CLIMATES.map(climate => (
                        <option key={climate} value={climate}>{climate}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="typology">Typology</Label>
                  <Input
                    id="typology"
                    value={formData.typology}
                    onChange={(e) => handleInputChange("typology", e.target.value)}
                    placeholder="e.g., Villa, Apartment, Office"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe your design plan..."
                    rows={5}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Images */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  Add image URLs for your design plan. The first image will be used as the thumbnail.
                </p>

                {imageUrls.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={url}
                      onChange={(e) => updateImageUrl(index, e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1"
                    />
                    {imageUrls.length > 1 && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeImageUrl(index)}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={addImageUrl}
                  className="w-full border-dashed"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Image URL
                </Button>

                {imageUrls[0] && (
                  <div className="mt-4">
                    <Label>Preview</Label>
                    <div className="mt-2 aspect-video bg-slate-100 rounded-lg overflow-hidden">
                      <img
                        src={imageUrls[0]}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Specifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="area">Area (sqft)</Label>
                    <Input
                      id="area"
                      value={formData.specifications.area}
                      onChange={(e) => handleSpecChange("area", e.target.value)}
                      placeholder="e.g., 3500"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input
                      id="bedrooms"
                      value={formData.specifications.bedrooms}
                      onChange={(e) => handleSpecChange("bedrooms", e.target.value)}
                      placeholder="e.g., 4"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input
                      id="bathrooms"
                      value={formData.specifications.bathrooms}
                      onChange={(e) => handleSpecChange("bathrooms", e.target.value)}
                      placeholder="e.g., 3"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="floors">Floors</Label>
                    <Input
                      id="floors"
                      value={formData.specifications.floors}
                      onChange={(e) => handleSpecChange("floors", e.target.value)}
                      placeholder="e.g., 2"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="parking">Parking</Label>
                    <Input
                      id="parking"
                      value={formData.specifications.parking}
                      onChange={(e) => handleSpecChange("parking", e.target.value)}
                      placeholder="e.g., 2 cars"
                      className="mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pricing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Delivery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="priceSqft">Price per Sq. Ft. ($)</Label>
                    <Input
                      id="priceSqft"
                      type="number"
                      value={formData.priceSqft}
                      onChange={(e) => handleInputChange("priceSqft", e.target.value)}
                      placeholder="e.g., 450"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="totalPrice">Total Price ($)</Label>
                    <Input
                      id="totalPrice"
                      type="number"
                      value={formData.totalPrice}
                      onChange={(e) => handleInputChange("totalPrice", e.target.value)}
                      placeholder="e.g., 1575000"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="deliveryTime">Delivery Time</Label>
                    <Input
                      id="deliveryTime"
                      value={formData.deliveryTime}
                      onChange={(e) => handleInputChange("deliveryTime", e.target.value)}
                      placeholder="e.g., 45-60 days"
                      className="mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tags */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add a tag and press Enter"
                    className="flex-1"
                  />
                  <Button onClick={addTag} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        #{tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="hover:text-blue-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex justify-between items-center pt-4"
          >
            <Button
              variant="outline"
              onClick={() => navigate("/associates/design-studio")}
              disabled={loading}
            >
              Cancel
            </Button>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => handleSubmit("draft")}
                disabled={loading}
                className="border-slate-300"
              >
                <Save className="w-4 h-4 mr-2" />
                Save as Draft
              </Button>

              <Button
                onClick={() => handleSubmit("published")}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
              >
                <Eye className="w-4 h-4 mr-2" />
                {loading ? "Saving..." : isEditMode ? "Update & Publish" : "Publish"}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
