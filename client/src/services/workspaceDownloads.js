import client from "../config/axios.jsx";

const extractError = (error) =>
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  error?.message ||
  "Request failed";

export const fetchWorkspaceDownloads = async (params = {}) => {
  try {
    const { data } = await client.get("/workspace-downloads", { params });
    return data;
  } catch (error) {
    return {
      ok: false,
      error: extractError(error),
      downloads: [],
    };
  }
};

export const createWorkspaceDownload = async (payload = {}) => {
  try {
    const { data } = await client.post("/workspace-downloads", payload);
    return data;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

export const updateWorkspaceDownload = async (id, payload = {}) => {
  try {
    const { data } = await client.patch(`/workspace-downloads/${id}`, payload);
    return data;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

export const deleteWorkspaceDownload = async (id, params = {}) => {
  try {
    const { data } = await client.delete(`/workspace-downloads/${id}`, { params });
    return data;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

export default {
  fetchWorkspaceDownloads,
  createWorkspaceDownload,
  updateWorkspaceDownload,
  deleteWorkspaceDownload,
};
