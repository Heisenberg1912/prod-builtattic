import client from "../config/axios.jsx";

const extractError = (error) =>
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  error?.message ||
  "Request failed";

export const fetchWorkspaceChats = async (params = {}) => {
  try {
    const { data } = await client.get("/workspace-chats", { params });
    return data;
  } catch (error) {
    return {
      ok: false,
      error: extractError(error),
      chats: [],
    };
  }
};

export const createWorkspaceChat = async (payload = {}) => {
  try {
    const { data } = await client.post("/workspace-chats", payload);
    return data;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

export const postWorkspaceChatMessage = async (id, payload = {}) => {
  try {
    const { data } = await client.post(`/workspace-chats/${id}/messages`, payload);
    return data;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

export const updateWorkspaceChat = async (id, payload = {}) => {
  try {
    const { data } = await client.patch(`/workspace-chats/${id}`, payload);
    return data;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

export default {
  fetchWorkspaceChats,
  createWorkspaceChat,
  postWorkspaceChatMessage,
  updateWorkspaceChat,
};
