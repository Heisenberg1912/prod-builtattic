const rawPortalFlag = String(
  import.meta?.env?.VITE_ENABLE_PORTAL_API ?? 'true'
)
  .trim()
  .toLowerCase();

const portalApiEnabled = rawPortalFlag !== 'false';

const getLocalStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const readStorageValue = (key) => {
  if (!key) return null;
  const storage = getLocalStorage();
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

export const isPortalApiEnabled = () => portalApiEnabled;

export const hasStoredAuthToken = () => {
  const token = readStorageValue('auth_token');
  return Boolean(token && token !== 'undefined' && token !== 'null');
};

export const shouldUsePortalApi = () => portalApiEnabled && hasStoredAuthToken();
