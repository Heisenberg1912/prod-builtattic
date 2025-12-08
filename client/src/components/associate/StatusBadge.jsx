import React from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { Badge } from "../ui/badge";

export default function StatusBadge({ status, size = "default", showIcon = true }) {
  const statusConfig = {
    published: {
      label: "Published",
      className: "bg-green-100 text-green-700 border-green-200",
      icon: Eye,
    },
    draft: {
      label: "Draft",
      className: "bg-slate-100 text-slate-700 border-slate-200",
      icon: EyeOff,
    },
  };

  const config = statusConfig[status] || statusConfig.draft;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    default: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Badge
        className={`${config.className} ${sizeClasses[size]} font-medium border inline-flex items-center gap-1.5`}
      >
        {showIcon && <Icon className="w-3 h-3" />}
        {config.label}
      </Badge>
    </motion.div>
  );
}
