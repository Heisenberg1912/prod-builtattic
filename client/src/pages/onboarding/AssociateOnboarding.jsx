import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  Briefcase,
  Image as ImageIcon,
  FileText,
  Sparkles,
  Upload,
  X
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
    title: "Professional Details",
    subtitle: "Your experience and expertise",
    icon: Briefcase
  },
  {
    id: 3,
    title: "Portfolio & Media",
    subtitle: "Showcase your best work",
    icon: ImageIcon
  },
  {
    id: 4,
    title: "Review & Submit",
    subtitle: "Confirm your details",
    icon: FileText
  }
];

export default function AssociateOnboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    profilePicture: null,
    profilePicturePreview: null,
    fullName: "",
    email: "",
    phone: "",
    location: "",

    // Step 2: Professional Details
    firmName: "",
    designation: "",
    experience: "",
    specialization: [],
    bio: "",

    // Step 3: Portfolio
    portfolioFiles: [],
    portfolioLinks: [""],
    workingDrawings: [],
    certifications: []
  });

  const specializations = [
    "Architecture Design",
    "Interior Design",
    "Landscape Design",
    "3D Visualization",
    "Project Management",
    "Structural Design",
    "MEP Design",
    "Urban Planning"
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSpecialization = (spec) => {
    setFormData(prev => ({
      ...prev,
      specialization: prev.specialization.includes(spec)
        ? prev.specialization.filter(s => s !== spec)
        : [...prev.specialization, spec]
    }));
  };

  const handleFileUpload = (field, files) => {
    const fileArray = Array.from(files);
    const filePreviews = fileArray.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    }));

    if (field === "profilePicture") {
      setFormData(prev => ({
        ...prev,
        profilePicture: files[0],
        profilePicturePreview: URL.createObjectURL(files[0])
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], ...filePreviews]
      }));
    }
  };

  const removeFile = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const addPortfolioLink = () => {
    setFormData(prev => ({
      ...prev,
      portfolioLinks: [...prev.portfolioLinks, ""]
    }));
  };

  const updatePortfolioLink = (index, value) => {
    setFormData(prev => ({
      ...prev,
      portfolioLinks: prev.portfolioLinks.map((link, i) => i === index ? value : link)
    }));
  };

  const removePortfolioLink = (index) => {
    setFormData(prev => ({
      ...prev,
      portfolioLinks: prev.portfolioLinks.filter((_, i) => i !== index)
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
        if (!formData.firmName || !formData.designation || formData.specialization.length === 0) {
          toast.error("Please complete all required fields");
          return false;
        }
        break;
      case 3:
        // Optional validation for media
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
        loading: "Setting up your profile...",
        success: "Profile created successfully! Redirecting to your dashboard...",
        error: "Something went wrong"
      }
    ).then(() => {
      setTimeout(() => {
        navigate("/associates/dashboard");
      }, 1000);
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <PersonalInfoStep formData={formData} onChange={handleInputChange} onFileUpload={handleFileUpload} />;
      case 2:
        return <ProfessionalDetailsStep formData={formData} onChange={handleInputChange} toggleSpecialization={toggleSpecialization} specializations={specializations} />;
      case 3:
        return <PortfolioStep formData={formData} onFileUpload={handleFileUpload} removeFile={removeFile} addPortfolioLink={addPortfolioLink} updatePortfolioLink={updatePortfolioLink} removePortfolioLink={removePortfolioLink} />;
      case 4:
        return <ReviewStep formData={formData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-2 rounded-full mb-4 shadow-lg">
          
            <span className="font-semibold text-sm">Associate Onboarding</span>
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
                          ? "bg-blue-500 text-white shadow-lg"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {isCompleted ? <Check className="h-6 w-6" /> : <StepIcon className="h-6 w-6" />}
                    </motion.div>
                    <span className={`text-xs mt-2 font-medium hidden md:block ${isActive ? "text-blue-600" : "text-slate-500"}`}>
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
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/associates/dashboard")}
                className="px-6"
              >
                Go to Dashboard
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8"
              >
                Complete Setup
                <Check className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
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
        <Label className="text-sm font-medium text-slate-700 mb-3">Profile Picture</Label>
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
          <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition">
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
          <Label htmlFor="location" className="text-sm font-medium text-slate-700">
            Location
          </Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => onChange("location", e.target.value)}
            placeholder="Mumbai, India"
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
}

function ProfessionalDetailsStep({ formData, onChange, toggleSpecialization, specializations }) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="firmName" className="text-sm font-medium text-slate-700">
            Firm/Company Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="firmName"
            value={formData.firmName}
            onChange={(e) => onChange("firmName", e.target.value)}
            placeholder="Your Studio Name"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="designation" className="text-sm font-medium text-slate-700">
            Current Designation <span className="text-red-500">*</span>
          </Label>
          <Input
            id="designation"
            value={formData.designation}
            onChange={(e) => onChange("designation", e.target.value)}
            placeholder="Senior Architect"
            className="mt-2"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="experience" className="text-sm font-medium text-slate-700">
          Years of Experience
        </Label>
        <Input
          id="experience"
          type="number"
          value={formData.experience}
          onChange={(e) => onChange("experience", e.target.value)}
          placeholder="5"
          className="mt-2"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-700 mb-3 block">
          Specializations <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {specializations.map((spec) => (
            <motion.button
              key={spec}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleSpecialization(spec)}
              className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                formData.specialization.includes(spec)
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              {spec}
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="bio" className="text-sm font-medium text-slate-700">
          Professional Bio
        </Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => onChange("bio", e.target.value)}
          placeholder="Tell us about your experience, achievements, and what makes you unique..."
          rows={5}
          className="mt-2"
        />
      </div>
    </div>
  );
}

function PortfolioStep({ formData, onFileUpload, removeFile, addPortfolioLink, updatePortfolioLink, removePortfolioLink }) {
  return (
    <div className="space-y-8">
      {/* Portfolio Files */}
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-3 block">
          Portfolio Images & Documents
        </Label>
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition">
          <label className="cursor-pointer">
            <Upload className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-600 mb-1">Click to upload or drag and drop</p>
            <p className="text-xs text-slate-500">PNG, JPG, PDF up to 10MB each</p>
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={(e) => onFileUpload("portfolioFiles", e.target.files)}
              className="hidden"
            />
          </label>
        </div>

        {formData.portfolioFiles.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {formData.portfolioFiles.map((file, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                  {file.file.type.startsWith("image/") ? (
                    <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="h-12 w-12 text-slate-400" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeFile("portfolioFiles", index)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="h-4 w-4" />
                </button>
                <p className="text-xs text-slate-600 mt-1 truncate">{file.name}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Portfolio Links */}
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-3 block">
          Portfolio Links (Behance, Dribbble, etc.)
        </Label>
        <div className="space-y-3">
          {formData.portfolioLinks.map((link, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={link}
                onChange={(e) => updatePortfolioLink(index, e.target.value)}
                placeholder="https://behance.net/yourprofile"
                className="flex-1"
              />
              {formData.portfolioLinks.length > 1 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removePortfolioLink(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            onClick={addPortfolioLink}
            className="w-full"
          >
            Add Another Link
          </Button>
        </div>
      </div>

      {/* Working Drawings */}
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-3 block">
          Working Drawings (Optional)
        </Label>
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
          <label className="cursor-pointer">
            <FileText className="h-10 w-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Upload technical drawings</p>
            <input
              type="file"
              multiple
              accept=".dwg,.dxf,.pdf"
              onChange={(e) => onFileUpload("workingDrawings", e.target.files)}
              className="hidden"
            />
          </label>
        </div>

        {formData.workingDrawings.length > 0 && (
          <div className="mt-4 space-y-2">
            {formData.workingDrawings.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile("workingDrawings", index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
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
        <p className="text-slate-600">{formData.designation} at {formData.firmName}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <ReviewSection title="Contact Information">
          <ReviewItem label="Email" value={formData.email} />
          <ReviewItem label="Phone" value={formData.phone} />
          <ReviewItem label="Location" value={formData.location || "Not provided"} />
        </ReviewSection>

        <ReviewSection title="Professional Details">
          <ReviewItem label="Experience" value={`${formData.experience || 0} years`} />
          <ReviewItem label="Specializations" value={formData.specialization.join(", ") || "None selected"} />
        </ReviewSection>
      </div>

      {formData.bio && (
        <ReviewSection title="Bio">
          <p className="text-sm text-slate-600">{formData.bio}</p>
        </ReviewSection>
      )}

      <ReviewSection title="Portfolio">
        <ReviewItem label="Images & Documents" value={`${formData.portfolioFiles.length} files uploaded`} />
        <ReviewItem label="Portfolio Links" value={`${formData.portfolioLinks.filter(l => l).length} links added`} />
        <ReviewItem label="Working Drawings" value={`${formData.workingDrawings.length} files uploaded`} />
      </ReviewSection>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> You can edit these details anytime from your profile settings.
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
