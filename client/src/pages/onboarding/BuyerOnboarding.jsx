import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  Home,
  CreditCard,
  FileText,
  Upload,
  MapPin,
  Building
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
    title: "Personal Information",
    subtitle: "Tell us about yourself",
    icon: User
  },
  {
    id: 2,
    title: "Project Details",
    subtitle: "What are you building?",
    icon: Home
  },
  {
    id: 3,
    title: "Preferences & Budget",
    subtitle: "Your requirements and budget",
    icon: CreditCard
  },
  {
    id: 4,
    title: "Review & Submit",
    subtitle: "Confirm your details",
    icon: FileText
  }
];

export default function BuyerOnboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    profilePicture: null,
    profilePicturePreview: null,
    fullName: "",
    email: "",
    phone: "",
    city: "",
    state: "",

    // Step 2: Project Details
    projectType: "",
    projectDescription: "",
    projectLocation: "",
    projectTimeline: "",
    propertyType: [],
    projectSize: "",
    projectStatus: "",

    // Step 3: Preferences & Budget
    interestedCategories: [],
    budgetRange: "",
    preferredVendors: "",
    specialRequirements: "",
    paymentPreference: ""
  });

  const projectTypes = [
    "New Construction",
    "Renovation",
    "Interior Design",
    "Landscaping",
    "Commercial Project",
    "Residential Project"
  ];

  const propertyTypes = [
    "Apartment",
    "Villa",
    "Office",
    "Shop",
    "Warehouse",
    "Restaurant",
    "Hotel",
    "Educational Institution"
  ];

  const materialCategories = [
    "Building Materials",
    "Electrical & Lighting",
    "Plumbing & Sanitation",
    "Flooring & Tiles",
    "Paint & Finishes",
    "Hardware & Fittings",
    "Furniture",
    "Decor & Furnishings",
    "Kitchen & Bath",
    "Outdoor & Garden"
  ];

  const budgetRanges = [
    "Under ₹1 Lakh",
    "₹1-5 Lakhs",
    "₹5-10 Lakhs",
    "₹10-25 Lakhs",
    "₹25-50 Lakhs",
    "₹50 Lakhs - 1 Crore",
    "Above ₹1 Crore"
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const togglePropertyType = (type) => {
    setFormData(prev => ({
      ...prev,
      propertyType: prev.propertyType.includes(type)
        ? prev.propertyType.filter(t => t !== type)
        : [...prev.propertyType, type]
    }));
  };

  const toggleCategory = (category) => {
    setFormData(prev => ({
      ...prev,
      interestedCategories: prev.interestedCategories.includes(category)
        ? prev.interestedCategories.filter(c => c !== category)
        : [...prev.interestedCategories, category]
    }));
  };

  const handleFileUpload = (field, files) => {
    const file = files[0];
    setFormData(prev => ({
      ...prev,
      [field]: file,
      [`${field}Preview`]: URL.createObjectURL(file)
    }));
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.fullName || !formData.email || !formData.phone) {
          toast.error("Please fill in all required fields");
          return false;
        }
        break;
      case 2:
        if (!formData.projectType || !formData.projectDescription) {
          toast.error("Please provide project details");
          return false;
        }
        break;
      case 3:
        if (formData.interestedCategories.length === 0 || !formData.budgetRange) {
          toast.error("Please select categories and budget range");
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
        loading: "Setting up your buyer account...",
        success: "Profile created successfully!",
        error: "Something went wrong"
      }
    ).then(() => {
      setTimeout(() => {
        navigate("/");
      }, 1000);
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <PersonalInfoStep formData={formData} onChange={handleInputChange} onFileUpload={handleFileUpload} />;
      case 2:
        return <ProjectDetailsStep formData={formData} onChange={handleInputChange} togglePropertyType={togglePropertyType} projectTypes={projectTypes} propertyTypes={propertyTypes} />;
      case 3:
        return <PreferencesStep formData={formData} onChange={handleInputChange} toggleCategory={toggleCategory} categories={materialCategories} budgetRanges={budgetRanges} />;
      case 4:
        return <ReviewStep formData={formData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2 rounded-full mb-4 shadow-lg">
            <Home className="h-4 w-4" />
            <span className="font-semibold text-sm">Buyer Onboarding</span>
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
                          ? "bg-emerald-500 text-white shadow-lg"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {isCompleted ? <Check className="h-6 w-6" /> : <StepIcon className="h-6 w-6" />}
                    </motion.div>
                    <span className={`text-xs mt-2 font-medium hidden md:block ${isActive ? "text-emerald-600" : "text-slate-500"}`}>
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
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8"
            >
              Complete Setup
              <Check className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
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
function PersonalInfoStep({ formData, onChange, onFileUpload }) {
  return (
    <div className="space-y-6">
      {/* Profile Picture */}
      <div className="flex flex-col items-center mb-6">
        <Label className="text-sm font-medium text-slate-700 mb-3">Profile Picture (Optional)</Label>
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden">
            {formData.profilePicturePreview ? (
              <img src={formData.profilePicturePreview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="h-12 w-12 text-slate-400" />
              </div>
            )}
          </div>
          <label className="absolute bottom-0 right-0 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition">
            <Upload className="h-4 w-4" />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onFileUpload("profilePicture", e.target.files)}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="fullName" className="text-sm font-medium text-slate-700">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => onChange("fullName", e.target.value)}
            placeholder="John Doe"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email Address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="john@example.com"
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
      </div>
    </div>
  );
}

function ProjectDetailsStep({ formData, onChange, togglePropertyType, projectTypes, propertyTypes }) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-3 block">
          Project Type <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {projectTypes.map((type) => (
            <motion.button
              key={type}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange("projectType", type)}
              className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                formData.projectType === type
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              {type}
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="projectDescription" className="text-sm font-medium text-slate-700">
          Project Description <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="projectDescription"
          value={formData.projectDescription}
          onChange={(e) => onChange("projectDescription", e.target.value)}
          placeholder="Describe your project, requirements, and goals..."
          rows={4}
          className="mt-2"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-700 mb-3 block">
          Property Type
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {propertyTypes.map((type) => (
            <motion.button
              key={type}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => togglePropertyType(type)}
              className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                formData.propertyType.includes(type)
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <Building className="h-4 w-4 inline mr-1" />
              {type}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="projectLocation" className="text-sm font-medium text-slate-700">
            Project Location
          </Label>
          <Input
            id="projectLocation"
            value={formData.projectLocation}
            onChange={(e) => onChange("projectLocation", e.target.value)}
            placeholder="City, Area"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="projectTimeline" className="text-sm font-medium text-slate-700">
            Expected Timeline
          </Label>
          <Input
            id="projectTimeline"
            value={formData.projectTimeline}
            onChange={(e) => onChange("projectTimeline", e.target.value)}
            placeholder="e.g., 6 months"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="projectSize" className="text-sm font-medium text-slate-700">
            Project Size (sq.ft)
          </Label>
          <Input
            id="projectSize"
            type="number"
            value={formData.projectSize}
            onChange={(e) => onChange("projectSize", e.target.value)}
            placeholder="1500"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="projectStatus" className="text-sm font-medium text-slate-700">
            Project Status
          </Label>
          <select
            id="projectStatus"
            value={formData.projectStatus}
            onChange={(e) => onChange("projectStatus", e.target.value)}
            className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Select status</option>
            <option value="planning">Planning Phase</option>
            <option value="design">Design Phase</option>
            <option value="construction">Under Construction</option>
            <option value="finishing">Finishing Phase</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function PreferencesStep({ formData, onChange, toggleCategory, categories, budgetRanges }) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-3 block">
          Interested Material Categories <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map((category) => (
            <motion.button
              key={category}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleCategory(category)}
              className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                formData.interestedCategories.includes(category)
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              {category}
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-700 mb-3 block">
          Budget Range <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {budgetRanges.map((range) => (
            <motion.button
              key={range}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange("budgetRange", range)}
              className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                formData.budgetRange === range
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              {range}
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="preferredVendors" className="text-sm font-medium text-slate-700">
          Preferred Vendors (Optional)
        </Label>
        <Input
          id="preferredVendors"
          value={formData.preferredVendors}
          onChange={(e) => onChange("preferredVendors", e.target.value)}
          placeholder="Any specific vendors you'd like to work with?"
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="specialRequirements" className="text-sm font-medium text-slate-700">
          Special Requirements
        </Label>
        <Textarea
          id="specialRequirements"
          value={formData.specialRequirements}
          onChange={(e) => onChange("specialRequirements", e.target.value)}
          placeholder="Any specific requirements, preferences, or constraints..."
          rows={3}
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="paymentPreference" className="text-sm font-medium text-slate-700">
          Payment Preference
        </Label>
        <select
          id="paymentPreference"
          value={formData.paymentPreference}
          onChange={(e) => onChange("paymentPreference", e.target.value)}
          className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Select preference</option>
          <option value="upfront">Full Payment Upfront</option>
          <option value="milestone">Milestone-based Payments</option>
          <option value="cod">Cash on Delivery</option>
          <option value="credit">Credit Terms (30/60/90 days)</option>
        </select>
      </div>
    </div>
  );
}

function ReviewStep({ formData }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-24 h-24 rounded-full bg-slate-100 mx-auto mb-4 overflow-hidden border-4 border-white shadow-lg">
          {formData.profilePicturePreview ? (
            <img src={formData.profilePicturePreview} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="h-12 w-12 text-slate-400" />
            </div>
          )}
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{formData.fullName}</h2>
        <p className="text-slate-600">{formData.city}, {formData.state}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <ReviewSection title="Contact Information">
          <ReviewItem label="Email" value={formData.email} />
          <ReviewItem label="Phone" value={formData.phone} />
          <ReviewItem label="Location" value={`${formData.city || ""}, ${formData.state || ""}`} />
        </ReviewSection>

        <ReviewSection title="Project Details">
          <ReviewItem label="Project Type" value={formData.projectType} />
          <ReviewItem label="Property Type" value={formData.propertyType.join(", ") || "Not specified"} />
          <ReviewItem label="Location" value={formData.projectLocation || "Not specified"} />
          <ReviewItem label="Timeline" value={formData.projectTimeline || "Not specified"} />
          <ReviewItem label="Size" value={formData.projectSize ? `${formData.projectSize} sq.ft` : "Not specified"} />
          <ReviewItem label="Status" value={formData.projectStatus || "Not specified"} />
        </ReviewSection>
      </div>

      {formData.projectDescription && (
        <ReviewSection title="Project Description">
          <p className="text-sm text-slate-600">{formData.projectDescription}</p>
        </ReviewSection>
      )}

      <ReviewSection title="Preferences & Budget">
        <ReviewItem label="Material Categories" value={`${formData.interestedCategories.length} selected`} />
        <ReviewItem label="Budget Range" value={formData.budgetRange} />
        <ReviewItem label="Payment Preference" value={formData.paymentPreference || "Not specified"} />
        <ReviewItem label="Preferred Vendors" value={formData.preferredVendors || "None specified"} />
      </ReviewSection>

      {formData.specialRequirements && (
        <ReviewSection title="Special Requirements">
          <p className="text-sm text-slate-600">{formData.specialRequirements}</p>
        </ReviewSection>
      )}

      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-6">
        <p className="text-sm text-emerald-800">
          <strong>Next Steps:</strong> Browse our marketplace to find materials, connect with verified vendors, and get personalized recommendations based on your preferences.
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
