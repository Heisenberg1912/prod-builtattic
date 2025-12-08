import React, { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

/**
 * Reusable image uploader component
 * Supports preview, drag & drop, and URL input
 */
export const ImageUploader = ({
  value,
  onChange,
  onUpload,
  className,
  label = "Upload Image",
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB default
  preview = true,
}) => {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;

    // Validate file size
    if (file.size > maxSize) {
      setError(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      if (onUpload) {
        // Custom upload handler (e.g., to API)
        const url = await onUpload(file);
        onChange(url);
      } else {
        // Default: convert to data URL for preview
        const reader = new FileReader();
        reader.onload = (e) => {
          onChange(e.target.result);
          setUploading(false);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      setError(err.message || "Upload failed");
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Preview */}
      {preview && value && (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Preview"
            className="h-32 w-32 rounded-lg object-cover border border-slate-200"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={handleRemove}
          >
            <X size={14} />
          </Button>
        </div>
      )}

      {/* Upload Area */}
      {!value && (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            dragActive ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white",
            "hover:border-slate-300 hover:bg-slate-50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />
          <ImageIcon className="mx-auto mb-4 text-slate-400" size={32} />
          <p className="text-sm font-medium text-slate-900 mb-1">
            {dragActive ? "Drop image here" : label}
          </p>
          <p className="text-xs text-slate-500 mb-4">
            or drag and drop
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <Upload size={14} />
            {uploading ? "Uploading..." : "Choose File"}
          </Button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default ImageUploader;
