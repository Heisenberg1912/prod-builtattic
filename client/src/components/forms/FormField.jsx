import React from "react";
import { Label } from "../ui/label";
import { cn } from "../../lib/utils";

/**
 * Reusable form field wrapper component
 * Provides consistent spacing and layout for form fields
 */
export const FormField = ({ label, hint, error, required, className, children }) => {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default FormField;
