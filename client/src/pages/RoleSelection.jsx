import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Package,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  CheckCircle
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

const roles = [
  {
    id: "associate",
    title: "Associate",
    subtitle: "Architects & Designers",
    description: "Showcase your portfolio, connect with firms, and get hired for projects",
    icon: Building2,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    hoverColor: "hover:border-blue-400",
    features: [
      "Create stunning portfolio",
      "Get project opportunities",
      "Connect with top firms",
      "Flexible work arrangements"
    ]
  },
  {
    id: "vendor",
    title: "Vendor",
    subtitle: "Material Suppliers",
    description: "List your materials, reach more buyers, and grow your business",
    icon: Package,
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    hoverColor: "hover:border-purple-400",
    features: [
      "List unlimited products",
      "Reach verified buyers",
      "Manage inventory easily",
      "Secure payments"
    ]
  },
  {
    id: "buyer",
    title: "Buyer",
    subtitle: "Clients & Firms",
    description: "Discover materials, hire talent, and bring your projects to life",
    icon: ShoppingBag,
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    hoverColor: "hover:border-emerald-400",
    features: [
      "Access quality materials",
      "Hire verified professionals",
      "Track project expenses",
      "Trusted marketplace"
    ]
  }
];

export default function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [hoveredRole, setHoveredRole] = useState(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (selectedRole) {
      navigate(`/onboarding/${selectedRole}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-full mb-6 shadow-lg"
          >
            
            <span className="font-semibold">Welcome to Builtattic</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold text-slate-900 mb-4"
          >
            Choose Your Role
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-slate-600 max-w-2xl mx-auto"
          >
            Select the role that best describes you. You can always add more roles later.
          </motion.p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {roles.map((role, index) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            const isHovered = hoveredRole === role.id;

            return (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <Card
                  className={`relative cursor-pointer transition-all duration-300 ${
                    isSelected
                      ? `${role.borderColor} border-2 shadow-xl scale-105`
                      : `border-slate-200 ${role.hoverColor} hover:shadow-lg`
                  }`}
                  onClick={() => setSelectedRole(role.id)}
                  onMouseEnter={() => setHoveredRole(role.id)}
                  onMouseLeave={() => setHoveredRole(null)}
                >
                  <CardContent className="p-6">
                    {/* Selection Indicator */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute top-4 right-4"
                        >
                          <CheckCircle className="h-6 w-6 text-green-500 fill-green-100" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Icon */}
                    <motion.div
                      animate={{
                        scale: isHovered || isSelected ? 1.1 : 1,
                        rotate: isHovered ? [0, -10, 10, 0] : 0
                      }}
                      transition={{ duration: 0.3 }}
                      className={`w-16 h-16 ${role.bgColor} rounded-2xl flex items-center justify-center mb-4`}
                    >
                      <div className={`bg-gradient-to-br ${role.color} bg-clip-text`}>
                        <Icon className="h-8 w-8" style={{ color: 'transparent', stroke: `url(#gradient-${role.id})` }} />
                      </div>
                      <svg width="0" height="0">
                        <defs>
                          <linearGradient id={`gradient-${role.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={role.id === 'associate' ? '#3b82f6' : role.id === 'vendor' ? '#a855f7' : '#10b981'} />
                            <stop offset="100%" stopColor={role.id === 'associate' ? '#06b6d4' : role.id === 'vendor' ? '#ec4899' : '#14b8a6'} />
                          </linearGradient>
                        </defs>
                      </svg>
                    </motion.div>

                    {/* Content */}
                    <h3 className="text-2xl font-bold text-slate-900 mb-1">
                      {role.title}
                    </h3>
                    <p className="text-sm font-medium text-slate-500 mb-3">
                      {role.subtitle}
                    </p>
                    <p className="text-slate-600 mb-4 leading-relaxed">
                      {role.description}
                    </p>

                    {/* Features */}
                    <ul className="space-y-2">
                      {role.features.map((feature, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + idx * 0.1 }}
                          className="flex items-start gap-2 text-sm text-slate-600"
                        >
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Continue Button */}
        <AnimatePresence>
          {selectedRole && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex justify-center"
            >
              <Button
                onClick={handleContinue}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                Continue as {roles.find(r => r.id === selectedRole)?.title}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
