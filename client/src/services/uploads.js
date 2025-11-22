import client from "../config/axios.jsx";
import { normaliseAssetUrl, buildDriveImageUrl } from "../utils/studioForm.js";

const extractAssetUrl = (asset) => {
  if (!asset) return null;
  return asset.publicUrl || asset.url || asset.storagePath || null;
};

const toAbsoluteUrl = (value) => {
  if (!value) return value;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("//")) {
    if (typeof window !== "undefined") return `${window.location.protocol}${value}`;
    return `https:${value}`;
  }
  if (value.startsWith("/")) {
    if (typeof window !== "undefined") return `${window.location.origin}${value}`;
    return value;
  }
  return value;
};

const buildDriveViewUrl = (asset) => {
  if (!asset?.driveFileId) return null;
  return buildDriveImageUrl(asset.driveFileId);
};

export async function uploadStudioAsset(file, options = {}) {
  if (!(file instanceof File)) {
    throw new Error("A valid File object is required");
  }
  const formData = new FormData();
  formData.append("file", file);
  if (options.productId) formData.append("productId", options.productId);
  if (options.kind) formData.append("kind", options.kind);
  formData.append("secure", options.secure === true ? "true" : "false");

  const { data } = await client.post("/uploads", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const asset = data?.asset || {};
  const drivePreview = buildDriveViewUrl(asset);
  const candidate = normaliseAssetUrl(
    extractAssetUrl(asset) ||
      data?.downloadUrl ||
      drivePreview ||
      asset.key
  ) || drivePreview;
  const url = toAbsoluteUrl(candidate);
  return {
    ...data,
    asset,
    url: url || candidate || drivePreview || null,
    previewUrl: url || candidate || drivePreview || null,
  };
}
