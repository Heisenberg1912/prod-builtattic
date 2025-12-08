import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Building2,
  Package,
  FileText,
  Truck,
  Upload,
  X,
  MapPin
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import toast from "react-hot-toast";

const steps = [
  {
    id: 1,
    title: "Business Information",
    subtitle: "Tell us about your company",
    icon: Building2
  },
  {
    id: 2,
    title: "Product Catalog",
    subtitle: "What materials do you supply?",
    icon: Package
  },
  {
    id: 3,
    title: "Logistics & Compliance",
    subtitle: "Shipping and legal details",
    icon: Truck
  },
  {
    id: 4,
    title: "Review & Submit",
    subtitle: "Confirm your details",
    icon: FileText
  }
];

export default function VendorOnboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Business Info
    companyLogo: null,
    companyLogoPreview: null,
    companyName: "",
    registrationNumber: "",
    gstin: "",
    email: "",
    phone: "",
    website: "",
    businessAddress: "",
    city: "",
    state: "",
    pincode: "",

    // Step 2: Product Catalog
    productCategories: [],
    catalogDescription: "",
    minimumOrderValue: "",
    catalogFiles: [],
    productImages: [],

    // Step 3: Logistics & Compliance
    shippingRegions: [],
    deliveryTimeframe: "",
    returnPolicy: "",
    gstCertificate: null,
    tradeLicense: null,
    bankAccountDetails: "",
    panCard: null
  });

  const productCategories = [
    "Cement & Concrete",
    "Steel & Metal",
    "Bricks & Blocks",
    "Sand & Aggregates",
    "Tiles & Flooring",
    "Paint & Coatings",
    "Plumbing Materials",
    "Electrical Supplies",
    "Hardware & Tools",
    "Wood & Timber",
    "Glass & Glazing",
    "Insulation Materials"
  ];

  const shippingRegions = [
    "Local (Same City)",
    "State-wide",
    "Regional (Multi-state)",
    "Pan-India",
    "International"
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (category) => {
    setFormData(prev => ({
      ...prev,
      productCategories: prev.productCategories.includes(category)
        ? prev.productCategories.filter(c => c !== category)
        : [...prev.productCategories, category]
    }));
  };

  const toggleRegion = (region) => {
    setFormData(prev => ({
      ...prev,
      shippingRegions: prev.shippingRegions.includes(region)
        ? prev.shippingRegions.filter(r => r !== region)
        : [...prev.shippingRegions, region]
    }));
  };

  const handleFileUpload = (field, files, isMultiple = false) => {
    if (isMultiple) {
      const fileArray = Array.from(files);
      const filePreviews = fileArray.map(file => ({
        file,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        name: file.name,
        size: file.size
      }));

      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], ...filePreviews]
      }));
    } else {
      const file = files[0];
      if (field === "companyLogo") {
        setFormData(prev => ({
          ...prev,
          companyLogo: file,
          companyLogoPreview: URL.createObjectURL(file)
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [field]: file
        }));
      }
    }
  };

  const removeFile = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.companyName || !formData.gstin || !formData.email || !formData.phone) {
          toast.error("Please fill in all required fields");
          return false;
        }
        break;
      case 2:
        if (formData.productCategories.length === 0) {
          toast.error("Please select at least one product category");
          return false;
        }
        break;
      case 3:
        if (formData.shippingRegions.length === 0 || !formData.deliveryTimeframe) {
          toast.error("Please complete shipping and logistics details");
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: "Setting up your vendor account...",
        success: "Vendor profile created successfully!",
        error: "Something went wrong"
      }
    ).then(() => {
      setTimeout(() => {
        navigate("/portal/vendor");
      }, 1000);
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <BusinessInfoStep formData={formData} onChange={handleInputChange} onFileUpload={handleFileUpload} />;
      case 2:
        return <ProductCatalogStep formData={formData} onChange={handleInputChange} toggleCategory={toggleCategory} categories={productCategories} onFileUpload={handleFileUpload} removeFile={removeFile} />;
      case 3:
        return <LogisticsStep formData={formData} onChange={handleInputChange} toggleRegion={toggleRegion} regions={shippingRegions} onFileUpload={handleFileUpload} />;
      case 4:
        return <ReviewStep formData={formData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full mb-4 shadow-lg">
            <Package className="h-4 w-4" />
            <span className="font-semibold text-sm">Vendor Onboarding</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            {steps[currentStep - 1].title}
          </h1>
          <p className="text-slate-600">{steps[currentStep - 1].subtitle}</p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : isActive
                          ? "bg-purple-500 text-white shadow-lg"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {isCompleted ? <Check className="h-6 w-6" /> : <StepIcon className="h-6 w-6" />}
                    </motion.div>
                    <span className={`text-xs mt-2 font-medium hidden md:block ${isActive ? "text-purple-600" : "text-slate-500"}`}>
                      Step {step.id}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-1 mx-2 bg-slate-200 rounded relative overflow-hidden">
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: isCompleted ? "100%" : "0%" }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-green-500"
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-xl border-slate-200">
              <CardContent className="p-8">
                {renderStepContent()}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-between items-center mt-8"
        >
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          {currentStep === steps.length ? (
            <Button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8"
            >
              Complete Setup
              <Check className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8"
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// Step Components
function BusinessInfoStep({ formData, onChange, onFileUpload }) {
  return (
    <div className="space-y-6">
      {/* Company Logo */}
      <div className="flex flex-col items-center mb-6">
        <Label className="text-sm font-medium text-slate-700 mb-3">Company Logo</Label>
        <div className="relative">
          <div className="w-32 h-32 rounded-lg bg-slate-100 border-4 border-white shadow-lg overflow-hidden">
            {formData.companyLogoPreview ? (
              <img src={formData.companyLogoPreview} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="h-12 w-12 text-slate-400" />
              </div>
            )}
          </div>
          <label className="absolute bottom-0 right-0 bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition">
            <Upload className="h-4 w-4" />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onFileUpload("companyLogo", e.target.files)}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="companyName" className="text-sm font-medium text-slate-700">
            Company Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="companyName"
            value={formData.companyName}
            onChange={(e) => onChange("companyName", e.target.value)}
            placeholder="ABC Materials Ltd."
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="registrationNumber" className="text-sm font-medium text-slate-700">
            Company Registration Number
          </Label>
          <Input
            id="registrationNumber"
            value={formData.registrationNumber}
            onChange={(e) => onChange("registrationNumber", e.target.value)}
            placeholder="CIN/LLPIN Number"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="gstin" className="text-sm font-medium text-slate-700">
            GSTIN <span className="text-red-500">*</span>
          </Label>
          <Input
            id="gstin"
            value={formData.gstin}
            onChange={(e) => onChange("gstin", e.target.value)}
            placeholder="22AAAAA0000A1Z5"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="email" className="text-sm font-medium text-slate-700">
            Business Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="business@example.com"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
            Phone Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            placeholder="+91 98765 43210"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="website" className="text-sm font-medium text-slate-700">
            Website (Optional)
          </Label>
          <Input
            id="website"
            value={formData.website}
            onChange={(e) => onChange("website", e.target.value)}
            placeholder="www.yourcompany.com"
            className="mt-2"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="businessAddress" className="text-sm font-medium text-slate-700">
          Business Address
        </Label>
        <Textarea
          id="businessAddress"
          value={formData.businessAddress}
          onChange={(e) => onChange("businessAddress", e.target.value)}
          placeholder="Street address, building name, floor"
          rows={2}
          className="mt-2"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <Label htmlFor="city" className="text-sm font-medium text-slate-700">
            City
          </Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => onChange("city", e.target.value)}
            placeholder="Mumbai"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="state" className="text-sm font-medium text-slate-700">
            State
          </Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => onChange("state", e.target.value)}
            placeholder="Maharashtra"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="pincode" className="text-sm font-medium text-slate-700">
            PIN Code
          </Label>
          <Input
            id="pincode"
            value={formData.pincode}
            onChange={(e) => onChange("pincode", e.target.value)}
            placeholder="400001"
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
}

function ProductCatalogStep({ formData, onChange, toggleCategory, categories, onFileUpload, removeFile }) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-3 block">
          Product Categories <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map((category) => (
            <motion.button
              key={category}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleCategory(category)}
              className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                formData.productCategories.includes(category)
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              {category}
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="catalogDescription" className="text-sm font-medium text-slate-700">
          Catalog Description
        </Label>
        <Textarea
          id="catalogDescription"
          value={formData.catalogDescription}
          onChange={(e) => onChange("catalogDescription", e.target.value)}
          placeholder="Describe your product range, quality standards, and what makes your materials unique..."
          rows={4}
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="minimumOrderValue" className="text-sm font-medium text-slate-700">
          Minimum Order Value (₹)
        </Label>
        <Input
          id="minimumOrderValue"
          type="number"
          value={formData.minimumOrderValue}
          onChange={(e) => onChange("minimumOrderValue", e.target.value)}
          placeholder="5000"
          className="mt-2"
        />
      </div>

      {/* Product Images */}
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-3 block">
          Product Images
        </Label>
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-purple-400 transition">
          <label className="cursor-pointer">
            <Upload className="h-10 w-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600 mb-1">Upload product images</p>
            <p className="text-xs text-slate-500">PNG, JPG up to 5MB each</p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => onFileUpload("productImages", e.target.files, true)}
              className="hidden"
            />
          </label>
        </div>

        {formData.productImages.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-4">
            {formData.productImages.map((file, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                  <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                </div>
                <button
                  onClick={() => removeFile("productImages", index)}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LogisticsStep({ formData, onChange, toggleRegion, regions, onFileUpload }) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-3 block">
          Shipping Regions <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {regions.map((region) => (
            <motion.button
              key={region}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleRegion(region)}
              className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                formData.shippingRegions.includes(region)
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <MapPin className="h-4 w-4 inline mr-1" />
              {region}
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="deliveryTimeframe" className="text-sm font-medium text-slate-700">
          Typical Delivery Timeframe <span className="text-red-500">*</span>
        </Label>
        <Input
          id="deliveryTimeframe"
          value={formData.deliveryTimeframe}
          onChange={(e) => onChange("deliveryTimeframe", e.target.value)}
          placeholder="e.g., 3-5 business days"
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="returnPolicy" className="text-sm font-medium text-slate-700">
          Return & Refund Policy
        </Label>
        <Textarea
          id="returnPolicy"
          value={formData.returnPolicy}
          onChange={(e) => onChange("returnPolicy", e.target.value)}
          placeholder="Describe your return policy, warranty terms, and conditions..."
          rows={3}
          className="mt-2"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-2 block">
            GST Certificate
          </Label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-purple-400 transition">
            <label className="cursor-pointer">
              <FileText className="h-8 w-8 text-slate-400 mx-auto mb-1" />
              <p className="text-xs text-slate-600">Upload GST Certificate</p>
              <input
                type="file"
                accept=".pdf,.jpg,.png"
                onChange={(e) => onFileUpload("gstCertificate", e.target.files)}
                className="hidden"
              />
            </label>
          </div>
          {formData.gstCertificate && (
            <p className="text-xs text-green-600 mt-1">✓ Uploaded</p>
          )}
        </div>

        <div>
          <Label className="text-sm font-medium text-slate-700 mb-2 block">
            Trade License
          </Label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-purple-400 transition">
            <label className="cursor-pointer">
              <FileText className="h-8 w-8 text-slate-400 mx-auto mb-1" />
              <p className="text-xs text-slate-600">Upload Trade License</p>
              <input
                type="file"
                accept=".pdf,.jpg,.png"
                onChange={(e) => onFileUpload("tradeLicense", e.target.files)}
                className="hidden"
              />
            </label>
          </div>
          {formData.tradeLicense && (
            <p className="text-xs text-green-600 mt-1">✓ Uploaded</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="bankAccountDetails" className="text-sm font-medium text-slate-700">
          Bank Account Details (for payments)
        </Label>
        <Textarea
          id="bankAccountDetails"
          value={formData.bankAccountDetails}
          onChange={(e) => onChange("bankAccountDetails", e.target.value)}
          placeholder="Account holder name, account number, IFSC code, bank name"
          rows={3}
          className="mt-2"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-700 mb-2 block">
          PAN Card
        </Label>
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-purple-400 transition max-w-xs">
          <label className="cursor-pointer">
            <FileText className="h-8 w-8 text-slate-400 mx-auto mb-1" />
            <p className="text-xs text-slate-600">Upload PAN Card</p>
            <input
              type="file"
              accept=".pdf,.jpg,.png"
              onChange={(e) => onFileUpload("panCard", e.target.files)}
              className="hidden"
            />
          </label>
        </div>
        {formData.panCard && (
          <p className="text-xs text-green-600 mt-1">✓ Uploaded</p>
        )}
      </div>
    </div>
  );
}

function ReviewStep({ formData }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-24 h-24 rounded-lg bg-slate-100 mx-auto mb-4 overflow-hidden border-4 border-white shadow-lg">
          {formData.companyLogoPreview ? (
            <img src={formData.companyLogoPreview} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 className="h-12 w-12 text-slate-400" />
            </div>
          )}
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{formData.companyName}</h2>
        <p className="text-slate-600">GSTIN: {formData.gstin}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <ReviewSection title="Business Information">
          <ReviewItem label="Registration No." value={formData.registrationNumber || "Not provided"} />
          <ReviewItem label="Email" value={formData.email} />
          <ReviewItem label="Phone" value={formData.phone} />
          <ReviewItem label="Website" value={formData.website || "Not provided"} />
          <ReviewItem label="Location" value={`${formData.city || ""}, ${formData.state || ""}`} />
        </ReviewSection>

        <ReviewSection title="Product Catalog">
          <ReviewItem label="Categories" value={`${formData.productCategories.length} selected`} />
          <ReviewItem label="Min. Order Value" value={formData.minimumOrderValue ? `₹${formData.minimumOrderValue}` : "Not specified"} />
          <ReviewItem label="Product Images" value={`${formData.productImages.length} uploaded`} />
        </ReviewSection>
      </div>

      <ReviewSection title="Logistics & Shipping">
        <ReviewItem label="Shipping Regions" value={formData.shippingRegions.join(", ") || "None selected"} />
        <ReviewItem label="Delivery Time" value={formData.deliveryTimeframe} />
        <ReviewItem label="GST Certificate" value={formData.gstCertificate ? "Uploaded ✓" : "Not uploaded"} />
        <ReviewItem label="Trade License" value={formData.tradeLicense ? "Uploaded ✓" : "Not uploaded"} />
        <ReviewItem label="PAN Card" value={formData.panCard ? "Uploaded ✓" : "Not uploaded"} />
      </ReviewSection>

      {formData.catalogDescription && (
        <ReviewSection title="Catalog Description">
          <p className="text-sm text-slate-600">{formData.catalogDescription}</p>
        </ReviewSection>
      )}

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-6">
        <p className="text-sm text-purple-800">
          <strong>Note:</strong> Our team will review your application within 2-3 business days. You'll receive an email once approved.
        </p>
      </div>
    </div>
  );
}

function ReviewSection({ title, children }) {
  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
      <h3 className="font-semibold text-slate-900 mb-3">{title}</h3>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

function ReviewItem({ label, value }) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-sm font-medium text-slate-600">{label}:</span>
      <span className="text-sm text-slate-900 text-right">{value}</span>
    </div>
  );
}
