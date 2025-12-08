/**
 * SkillStudioCreate Component
 *
 * Handles both creating new services and editing existing ones.
 * Uses the same form for both operations - determined by URL params.
 *
 * Features:
 * - Multi-package pricing builder
 * - Requirements checklist
 * - Portfolio image URLs
 * - Tags system
 * - Draft/Publish options
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Eye,
  Plus,
  X,
  Trash2,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Label } from "../../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Checkbox } from "../../../components/ui/checkbox";
import { createService, updateService, getServiceById } from "../../../services/associateServices";
import toast from "react-hot-toast";

// Service categories
const CATEGORIES = ["Rendering", "Consulting", "Technical", "Design", "Planning", "Other"];

// Default empty package template
const EMPTY_PACKAGE = {
  name: "",
  price: "",
  deliveryTime: "",
  features: [""],
  popular: false,
};

export default function SkillStudioCreate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    category: "Rendering",
    description: "",
    thumbnail: "",
    images: [],
    packages: [{ ...EMPTY_PACKAGE }], // Start with one package
    requirements: [""],
    portfolio: [],
    tags: [],
    status: "draft",
  });

  const [tagInput, setTagInput] = useState("");
  const [imageUrls, setImageUrls] = useState([""]);
  const [portfolioUrls, setPortfolioUrls] = useState([""]);
  const [loading, setLoading] = useState(false);

  // Load service data if editing
  useEffect(() => {
    if (isEditMode) {
      loadService();
    }
  }, [id]);

  /**
   * Load existing service for editing
   */
  const loadService = () => {
    const service = getServiceById(id);
    if (!service) {
      toast.error("Service not found");
      navigate("/associates/skill-studio");
      return;
    }

    setFormData({
      ...service,
      packages: service.packages && service.packages.length > 0
        ? service.packages
        : [{ ...EMPTY_PACKAGE }],
      requirements: service.requirements && service.requirements.length > 0
        ? service.requirements
        : [""],
    });

    setImageUrls(service.images && service.images.length > 0 ? service.images : [""]);
    setPortfolioUrls(service.portfolio && service.portfolio.length > 0 ? service.portfolio : [""]);
  };

  /**
   * Update form field value
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Add a new pricing package
   */
  const addPackage = () => {
    setFormData(prev => ({
      ...prev,
      packages: [...prev.packages, { ...EMPTY_PACKAGE }],
    }));
  };

  /**
   * Remove a pricing package
   */
  const removePackage = (index) => {
    if (formData.packages.length > 1) {
      setFormData(prev => ({
        ...prev,
        packages: prev.packages.filter((_, i) => i !== index),
      }));
    }
  };

  /**
   * Update a specific package field
   */
  const updatePackage = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      packages: prev.packages.map((pkg, i) =>
        i === index ? { ...pkg, [field]: value } : pkg
      ),
    }));
  };

  /**
   * Add a feature to a package
   */
  const addPackageFeature = (packageIndex) => {
    setFormData(prev => ({
      ...prev,
      packages: prev.packages.map((pkg, i) =>
        i === packageIndex
          ? { ...pkg, features: [...pkg.features, ""] }
          : pkg
      ),
    }));
  };

  /**
   * Remove a feature from a package
   */
  const removePackageFeature = (packageIndex, featureIndex) => {
    setFormData(prev => ({
      ...prev,
      packages: prev.packages.map((pkg, i) =>
        i === packageIndex
          ? { ...pkg, features: pkg.features.filter((_, fi) => fi !== featureIndex) }
          : pkg
      ),
    }));
  };

  /**
   * Update a package feature text
   */
  const updatePackageFeature = (packageIndex, featureIndex, value) => {
    setFormData(prev => ({
      ...prev,
      packages: prev.packages.map((pkg, i) =>
        i === packageIndex
          ? {
              ...pkg,
              features: pkg.features.map((f, fi) => (fi === featureIndex ? value : f)),
            }
          : pkg
      ),
    }));
  };

  /**
   * Add a requirement
   */
  const addRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, ""],
    }));
  };

  /**
   * Remove a requirement
   */
  const removeRequirement = (index) => {
    if (formData.requirements.length > 1) {
      setFormData(prev => ({
        ...prev,
        requirements: prev.requirements.filter((_, i) => i !== index),
      }));
    }
  };

  /**
   * Update a requirement text
   */
  const updateRequirement = (index, value) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.map((req, i) => (i === index ? value : req)),
    }));
  };

  /**
   * Tag management
   */
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

  /**
   * Image URL management
   */
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
      setImageUrls(imageUrls.filter((_, i) => i !== index));
    }
  };

  /**
   * Portfolio URL management
   */
  const addPortfolioUrl = () => {
    setPortfolioUrls(prev => [...prev, ""]);
  };

  const updatePortfolioUrl = (index, value) => {
    const newUrls = [...portfolioUrls];
    newUrls[index] = value;
    setPortfolioUrls(newUrls);
  };

  const removePortfolioUrl = (index) => {
    if (portfolioUrls.length > 1) {
      setPortfolioUrls(portfolioUrls.filter((_, i) => i !== index));
    }
  };

  /**
   * Form validation
   */
  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a service title");
      return false;
    }

    if (!formData.category) {
      toast.error("Please select a category");
      return false;
    }

    // Validate at least one package with price
    const hasValidPackage = formData.packages.some(
      pkg => pkg.name.trim() && pkg.price && parseFloat(pkg.price) > 0
    );

    if (!hasValidPackage) {
      toast.error("Please add at least one pricing package with a name and price");
      return false;
    }

    return true;
  };

  /**
   * Submit form (create or update)
   */
  const handleSubmit = async (publishStatus = "draft") => {
    if (!validateForm()) return;

    setLoading(true);

    // Prepare data
    const validImages = imageUrls.filter(url => url.trim());
    const validPortfolio = portfolioUrls.filter(url => url.trim());
    const validRequirements = formData.requirements.filter(req => req.trim());

    // Clean up packages
    const validPackages = formData.packages
      .filter(pkg => pkg.name.trim() && pkg.price)
      .map(pkg => ({
        ...pkg,
        price: parseFloat(pkg.price),
        features: pkg.features.filter(f => f.trim()),
      }));

    const serviceData = {
      ...formData,
      thumbnail: validImages[0] || "",
      images: validImages,
      portfolio: validPortfolio,
      packages: validPackages,
      requirements: validRequirements,
      status: publishStatus,
    };

    try {
      let result;
      if (isEditMode) {
        result = updateService(id, serviceData);
      } else {
        result = createService(serviceData);
      }

      if (result.success) {
        toast.success(
          isEditMode
            ? `Service ${publishStatus === 'published' ? 'published' : 'saved'} successfully`
            : `Service ${publishStatus === 'published' ? 'published' : 'created'} successfully`
        );
        navigate("/associates/skill-studio");
      } else {
        toast.error(result.error || "Failed to save service");
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
            onClick={() => navigate("/associates/skill-studio")}
            className="mb-4 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Skill Studio
          </Button>

          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {isEditMode ? "Edit Service" : "Create Service"}
            </h1>
            <p className="text-slate-600">
              {isEditMode ? "Update your service details" : "Add a new service to your portfolio"}
            </p>
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
                    Service Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="e.g., 3D Architectural Visualization"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="category">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange("category", e.target.value)}
                    className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="description">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe your service in detail..."
                    rows={5}
                    className="mt-2"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Tip: Explain what you offer, your process, and what makes your service unique
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pricing Packages */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Pricing Packages <span className="text-red-500">*</span></CardTitle>
                <Button variant="outline" size="sm" onClick={addPackage}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Package
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {formData.packages.map((pkg, pkgIndex) => (
                  <div key={pkgIndex} className="p-4 border-2 border-slate-200 rounded-lg relative">
                    {formData.packages.length > 1 && (
                      <button
                        onClick={() => removePackage(pkgIndex)}
                        className="absolute top-2 right-2 p-1 hover:bg-red-50 rounded-lg text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <Label>Package Name</Label>
                        <Input
                          value={pkg.name}
                          onChange={(e) => updatePackage(pkgIndex, "name", e.target.value)}
                          placeholder="e.g., Basic, Standard, Premium"
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label>Price ($)</Label>
                        <Input
                          type="number"
                          value={pkg.price}
                          onChange={(e) => updatePackage(pkgIndex, "price", e.target.value)}
                          placeholder="e.g., 500"
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label>Delivery Time</Label>
                        <Input
                          value={pkg.deliveryTime}
                          onChange={(e) => updatePackage(pkgIndex, "deliveryTime", e.target.value)}
                          placeholder="e.g., 3-5 days"
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Checkbox
                          checked={pkg.popular}
                          onCheckedChange={(checked) => updatePackage(pkgIndex, "popular", checked)}
                        />
                        <Label className="cursor-pointer">Mark as Most Popular</Label>
                      </div>
                    </div>

                    <div>
                      <Label>Features Included</Label>
                      <div className="mt-2 space-y-2">
                        {pkg.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex gap-2">
                            <Input
                              value={feature}
                              onChange={(e) => updatePackageFeature(pkgIndex, featureIndex, e.target.value)}
                              placeholder="e.g., 2 exterior views"
                              className="flex-1"
                            />
                            {pkg.features.length > 1 && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => removePackageFeature(pkgIndex, featureIndex)}
                                className="border-red-300 text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addPackageFeature(pkgIndex)}
                          className="w-full border-dashed"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Feature
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Requirements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-600">
                  What do you need from clients to start working?
                </p>
                {formData.requirements.map((req, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={req}
                      onChange={(e) => updateRequirement(index, e.target.value)}
                      placeholder="e.g., CAD files or floor plans"
                      className="flex-1"
                    />
                    {formData.requirements.length > 1 && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeRequirement(index)}
                        className="border-red-300 text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={addRequirement}
                  className="w-full border-dashed"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Requirement
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Images */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  Add image URLs for your service. The first image will be used as the thumbnail.
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
                        className="border-red-300 text-red-600"
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

          {/* Portfolio Examples */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Examples</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  Showcase examples of your previous work
                </p>

                {portfolioUrls.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={url}
                      onChange={(e) => updatePortfolioUrl(index, e.target.value)}
                      placeholder="https://example.com/portfolio-image.jpg"
                      className="flex-1"
                    />
                    {portfolioUrls.length > 1 && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removePortfolioUrl(index)}
                        className="border-red-300 text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={addPortfolioUrl}
                  className="w-full border-dashed"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Portfolio Image
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tags */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
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
                        className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                      >
                        #{tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="hover:text-purple-900"
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
            transition={{ delay: 0.7 }}
            className="flex justify-between items-center pt-4"
          >
            <Button
              variant="outline"
              onClick={() => navigate("/associates/skill-studio")}
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
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
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
