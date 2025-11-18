import client from "../config/axios.jsx";

const extractAssetUrl = (asset) => {
  if (!asset) return null;
  return asset.url || asset.storagePath || null;
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
  const asset = data?.asset;
  const fallbackUrl = data?.downloadUrl || extractAssetUrl(asset);
  return { ...data, asset, url: fallbackUrl };
}
