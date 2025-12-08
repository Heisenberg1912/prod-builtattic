import React, { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileText, Film, Image as ImageIcon, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { normaliseAssetUrl } from "../../utils/studioForm.js";

const MEDIA_EXTENSIONS = {
  image: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
  video: [".mp4", ".mov", ".webm"],
  document: [".pdf", ".ppt", ".pptx", ".doc", ".docx"],
};

const detectMediaType = (item = {}) => {
  const kind = (item.kind || "").toLowerCase();
  if (kind) {
    if (kind.includes("image")) return "image";
    if (kind.includes("video")) return "video";
    if (kind.includes("doc")) return "document";
  }
  const normalized = normaliseAssetUrl(item.mediaUrl || "") || item.mediaUrl || "";
  const url = normalized.toLowerCase();
  if (!url) return null;
  if (url.includes("drive.google.com/thumbnail") || url.includes("googleusercontent.com")) return "image";
  if (url.includes("youtube.com") || url.includes("vimeo.com")) return "embed";
  for (const [type, extensions] of Object.entries(MEDIA_EXTENSIONS)) {
    if (extensions.some((ext) => url.endsWith(ext))) return type;
  }
  return "document";
};

const normalisePortfolioMedia = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => ({
      ...item,
      id: item.id || `portfolio-media-${index}`,
      mediaUrl: normaliseAssetUrl(item.mediaUrl || item.url || item.image) || item.mediaUrl || item.url || item.image,
    }))
    .filter((item) => item.mediaUrl);
};

const Thumbnail = ({ item, isActive, onSelect }) => {
  const type = detectMediaType(item);

  const Icon = type === "image" ? ImageIcon : type === "video" || type === "embed" ? Film : FileText;
  const label = item.title || (type === "image" ? "Image" : type === "video" || type === "embed" ? "Video" : "Document");

  return (
    <Button
      type="button"
      onClick={onSelect}
      variant={isActive ? "default" : "outline"}
      size="sm"
      className="justify-start"
    >
      <Icon size={14} />
      <span className="truncate">{label}</span>
    </Button>
  );
};

const MediaPreview = ({ item, onOpen }) => {
  const type = detectMediaType(item);

  if (type === "embed") {
    return (
      <iframe
        src={item.mediaUrl}
        title={item.title || "Portfolio media"}
        className="h-64 w-full md:h-72 rounded-xl"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  if (type === "video") {
    return (
      <video controls className="h-64 w-full object-cover md:h-72 rounded-xl">
        <source src={item.mediaUrl} />
      </video>
    );
  }

  if (type === "image") {
    return (
      <img
        src={item.mediaUrl}
        alt={item.title || "Portfolio media"}
        className="h-64 w-full object-cover md:h-72 rounded-xl"
      />
    );
  }

  return (
    <div className="flex h-64 w-full flex-col items-center justify-center bg-slate-50 rounded-xl text-slate-700 md:h-72">
      <FileText size={32} className="text-slate-400 mb-3" />
      <p className="text-sm font-semibold mb-3">Document preview unavailable</p>
      <Button
        type="button"
        onClick={onOpen}
        variant="outline"
        size="sm"
      >
        Open document
        <ExternalLink size={14} />
      </Button>
    </div>
  );
};

const PortfolioMediaPlayer = ({
  items = [],
  className = "",
  title = "Portfolio media",
  subtitle = "These tiles mirror what Skill Studio buyers can click through.",
  emptyLabel = "No portfolio tiles yet. Upload media inside the editor to power this carousel.",
  showMeta = true,
  showThumbnails = true,
  variant = "card",
}) => {
  const mediaItems = useMemo(() => normalisePortfolioMedia(items), [items]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!mediaItems.length) {
      setIndex(0);
      return;
    }
    if (index > mediaItems.length - 1) {
      setIndex(0);
    }
  }, [index, mediaItems.length]);

  const current = mediaItems[index];

  const openCurrent = () => {
    if (!current?.mediaUrl || typeof window === "undefined") return;
    try {
      window.open(current.mediaUrl, "_blank", "noopener");
    } catch {
      window.location.href = current.mediaUrl;
    }
  };

  const goToPrevious = () => setIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
  const goToNext = () => setIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));

  // Bare variant (no card wrapper)
  if (variant === "bare") {
    if (!mediaItems.length) {
      return (
        <div className={className}>
          {title && <p className="text-sm font-semibold text-slate-900 mb-1">{title}</p>}
          {subtitle && <p className="text-xs text-slate-500 mb-4">{subtitle}</p>}
          <p className="text-sm text-slate-500">{emptyLabel}</p>
        </div>
      );
    }

    return (
      <div className={className}>
        {title && <p className="text-sm font-semibold text-slate-900 mb-1">{title}</p>}
        {subtitle && <p className="text-xs text-slate-500 mb-4">{subtitle}</p>}

        <div className="space-y-4">
          {/* Media Preview with Navigation */}
          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-black">
            <MediaPreview item={current} onOpen={openCurrent} />

            {mediaItems.length > 1 && (
              <>
                <Button
                  type="button"
                  onClick={goToPrevious}
                  variant="secondary"
                  size="sm"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                >
                  <ChevronLeft size={16} />
                  Prev
                </Button>
                <Button
                  type="button"
                  onClick={goToNext}
                  variant="secondary"
                  size="sm"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                >
                  Next
                  <ChevronRight size={16} />
                </Button>
              </>
            )}
          </div>

          {/* Media Metadata */}
          {showMeta && (
            <div>
              <h4 className="text-sm font-semibold text-slate-900">{current.title || `Media #${index + 1}`}</h4>
              <p className="text-xs text-slate-500 mt-1">
                {current.description || "Add context so buyers know what they are viewing."}
              </p>
              <Button
                type="button"
                onClick={openCurrent}
                variant="link"
                size="sm"
                className="mt-2 p-0 h-auto text-xs"
              >
                <Play size={12} />
                Open this tile
              </Button>
            </div>
          )}

          {/* Thumbnail Navigation */}
          {showThumbnails && mediaItems.length > 1 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {mediaItems.map((item, itemIndex) => (
                <Thumbnail
                  key={item.id || item.mediaUrl || itemIndex}
                  item={item}
                  isActive={itemIndex === index}
                  onSelect={() => setIndex(itemIndex)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Card variant (default)
  if (!mediaItems.length) {
    return (
      <Card className={className}>
        <CardHeader>
          {title && <CardTitle className="text-sm">{title}</CardTitle>}
          {subtitle && <CardDescription className="text-xs">{subtitle}</CardDescription>}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">{emptyLabel}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        {title && <CardTitle className="text-sm">{title}</CardTitle>}
        {subtitle && <CardDescription className="text-xs">{subtitle}</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Media Preview with Navigation */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-black">
          <MediaPreview item={current} onOpen={openCurrent} />

          {mediaItems.length > 1 && (
            <>
              <Button
                type="button"
                onClick={goToPrevious}
                variant="secondary"
                size="sm"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
              >
                <ChevronLeft size={16} />
                Prev
              </Button>
              <Button
                type="button"
                onClick={goToNext}
                variant="secondary"
                size="sm"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
              >
                Next
                <ChevronRight size={16} />
              </Button>
            </>
          )}
        </div>

        {/* Media Metadata */}
        {showMeta && (
          <div>
            <h4 className="text-sm font-semibold text-slate-900">{current.title || `Media #${index + 1}`}</h4>
            <p className="text-xs text-slate-500 mt-1">
              {current.description || "Add context so buyers know what they are viewing."}
            </p>
            <Button
              type="button"
              onClick={openCurrent}
              variant="link"
              size="sm"
              className="mt-2 p-0 h-auto text-xs"
            >
              <Play size={12} />
              Open this tile
            </Button>
          </div>
        )}

        {/* Thumbnail Navigation */}
        {showThumbnails && mediaItems.length > 1 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {mediaItems.map((item, itemIndex) => (
              <Thumbnail
                key={item.id || item.mediaUrl || itemIndex}
                item={item}
                isActive={itemIndex === index}
                onSelect={() => setIndex(itemIndex)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { detectMediaType, normalisePortfolioMedia };
export default PortfolioMediaPlayer;
