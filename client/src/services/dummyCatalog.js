import client from "../config/axios.jsx";

export const DUMMY_TYPES = {
  DESIGN: "design",
  SKILL: "skill",
  MATERIAL: "material",
};

const EMPTY_CATALOG = { design: [], skill: [], material: [] };
const PUBLIC_ENDPOINT = "/marketplace/catalog/dummy";
const ADMIN_ENDPOINT = "/admin/catalog";
const PUBLIC_CACHE_TTL_MS = 60 * 1000;

let publicCatalogCache = null;
let publicCatalogFetchedAt = 0;

export const invalidateDummyCatalogCache = () => {
  publicCatalogCache = null;
  publicCatalogFetchedAt = 0;
};

export const getDummyCatalogSnapshot = async (force = false) => {
  if (
    !force &&
    publicCatalogCache &&
    Date.now() - publicCatalogFetchedAt < PUBLIC_CACHE_TTL_MS
  ) {
    return publicCatalogCache;
  }
  try {
    const { data } = await client.get(PUBLIC_ENDPOINT);
    publicCatalogCache = {
      design: data?.design || [],
      skill: data?.skill || [],
      material: data?.material || [],
    };
  } catch (error) {
    console.warn('[dummyCatalog] Failed to load public snapshot', error);
    publicCatalogCache = { ...EMPTY_CATALOG };
  } finally {
    publicCatalogFetchedAt = Date.now();
  }
  return publicCatalogCache;
};

export const fetchAdminDummyCatalog = async () => {
  const { data } = await client.get(ADMIN_ENDPOINT);
  return {
    design: data?.design || [],
    skill: data?.skill || [],
    material: data?.material || [],
  };
};

export const createDummyEntry = async (type, payload = {}) => {
  const normalizedType = String(type || "").toLowerCase();
  const { data } = await client.post(`${ADMIN_ENDPOINT}/${normalizedType}`, payload);
  invalidateDummyCatalogCache();
  return data?.entry;
};

export const deleteDummyEntry = async (type, id) => {
  const normalizedType = String(type || "").toLowerCase();
  await client.delete(`${ADMIN_ENDPOINT}/${normalizedType}/${id}`);
  invalidateDummyCatalogCache();
  return true;
};

export default {
  getDummyCatalogSnapshot,
  fetchAdminDummyCatalog,
  createDummyEntry,
  deleteDummyEntry,
  invalidateDummyCatalogCache,
  DUMMY_TYPES,
};
