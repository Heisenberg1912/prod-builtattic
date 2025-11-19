import { useEffect, useState } from "react";

import {
  getWorkspaceCollections,
  subscribeToWorkspaceRole,
  WORKSPACE_SYNC_STORAGE_KEY,
} from "../utils/workspaceSync.js";

export function useWorkspaceCollectionsSync(ownerType = "firm") {
  const [collections, setCollections] = useState(() => getWorkspaceCollections(ownerType));

  useEffect(() => {
    const unsubscribe = subscribeToWorkspaceRole(ownerType, setCollections);
    const handleStorage = (event) => {
      if (event?.key === WORKSPACE_SYNC_STORAGE_KEY) {
        setCollections(getWorkspaceCollections(ownerType));
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorage);
    }

    return () => {
      unsubscribe?.();
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorage);
      }
    };
  }, [ownerType]);

  return [collections, setCollections];
}

export default useWorkspaceCollectionsSync;
