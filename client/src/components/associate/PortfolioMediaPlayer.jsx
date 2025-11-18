import React, { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileText, Film, Image as ImageIcon, Play } from "lucide-react";

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
  const url = (item.mediaUrl || "").toLowerCase();
  if (!url) return null;
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
      mediaUrl: item.mediaUrl || item.url || item.image,
    }))
    .filter((item) => item.mediaUrl);
};

const Thumbnail = ({ item, isActive, onSelect }) => {
  const type = detectMediaType(item);
  const base = "rounded-xl border px-3 py-2 text-xs font-semibold transition";
  const stateClass = isActive
    ? "border-slate-900 bg-slate-900 text-white"
    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300";

  return (
    <button type="button" onClick={onSelect} className={`${base} ${stateClass}`}>
      {type === "image" ? (
        <div className="flex items-center gap-2">
          <ImageIcon size={14} />
          <span>{item.title || "Image"}</span>
        </div>
      ) : type === "video" || type === "embed" ? (
        <div className="flex items-center gap-2">
          <Film size={14} />
          <span>{item.title || "Video"}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <FileText size={14} />
          <span>{item.title || "Document"}</span>
        </div>
      )}
    </button>
  );
};

const MediaPreview = ({ item, onOpen }) => {
  const type = detectMediaType(item);
  if (type === "embed") {
    return (
      <iframe
        src={item.mediaUrl}
        title={item.title || "Portfolio media"}
        className="h-64 w-full md:h-72"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  if (type === "video") {
    return (
      <video controls className="h-64 w-full object-cover md:h-72">
        <source src={item.mediaUrl} />
      </video>
    );
  }
  if (type === "image") {
    return (
      <img
        src={item.mediaUrl}
        alt={item.title || "Portfolio media"}
        className="h-64 w-full object-cover md:h-72"
      />
    );
  }
  return (
    <div className="flex h-64 w-full flex-col items-center justify-center bg-white text-slate-700 md:h-72">
      <FileText size={18} className="text-slate-500" />
      <p className="mt-2 text-sm font-semibold">Document preview unavailable</p>
      <button
        type="button"
        onClick={onOpen}
        className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-400"
      >
        Open document <ExternalLink size={12} />
      </button>
    </div>
  );
};

const PortfolioMediaPlayer = ({
  items = [],
  className = "",
  title = "Portfolio media",
  subtitle = "These tiles mirror what Skill Studio buyers can click through.",
  emptyLabel = "Portfolio coming soon. Upload media inside the editor to power this carousel.",
  showMeta = true,
  showThumbnails = true,
  variant = "card",
}) => {
  const mediaItems = useMemo(() => normalisePortfolioMedia(items), [items]);
  const [index, setIndex] = useState(0);
  const Wrapper = variant === "bare" ? "div" : "section";
  const wrapperClass =
    variant === "bare"
      ? className
      : `rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`;

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

  if (!mediaItems.length) {
    return (
      <Wrapper className={wrapperClass}>
        {title ? <p className="text-sm font-semibold text-slate-900">{title}</p> : null}
        {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
        <p className="mt-4 text-sm text-slate-500">{emptyLabel}</p>
      </Wrapper>
    );
  }

  return (
    <Wrapper className={wrapperClass}>
      {title ? <p className="text-sm font-semibold text-slate-900">{title}</p> : null}
      {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
      <div className="mt-4 space-y-4">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-black">
          <MediaPreview item={current} onOpen={openCurrent} />
          {mediaItems.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => setIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1))}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow hover:bg-white"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1))}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow hover:bg-white"
              >
                Next
              </button>
            </>
          ) : null}
        </div>
        {showMeta ? (
          <div>
            <p className="text-sm font-semibold text-slate-900">{current.title || `Media #${index + 1}`}</p>
            <p className="text-xs text-slate-500">
              {current.description || "Add context so buyers know what they are viewing."}
            </p>
            <div className="mt-2 inline-flex items-center gap-2 text-xs text-slate-500">
              <Play size={12} />
              <button
                type="button"
                onClick={openCurrent}
                className="font-semibold text-slate-900 underline decoration-dotted underline-offset-4"
              >
                Open this tile
              </button>
            </div>
          </div>
        ) : null}
        {showThumbnails && mediaItems.length > 1 ? (
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
        ) : null}
      </div>
    </Wrapper>
  );
};

export { detectMediaType, normalisePortfolioMedia };
export default PortfolioMediaPlayer;
