import client from "../config/axios.jsx";

const extractError = (error) =>
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  error?.message ||
  "Request failed";

export const fetchServicePacks = async (params = {}) => {
  try {
    const { data } = await client.get("/service-packs", { params });
    return data;
  } catch (error) {
    return {
      ok: false,
      error: extractError(error),
      servicePacks: [],
    };
  }
};

export const createServicePack = async (payload = {}) => {
  try {
    const { data } = await client.post("/service-packs", payload);
    return data;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

export const updateServicePack = async (id, payload = {}) => {
  try {
    const { data } = await client.patch(`/service-packs/${id}`, payload);
    return data;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

export const deleteServicePack = async (id, params = {}) => {
  try {
    const { data } = await client.delete(`/service-packs/${id}`, { params });
    return data;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

export const fetchMeetings = async (params = {}) => {
  try {
    const { data } = await client.get("/schedule/meetings", { params });
    return data;
  } catch (error) {
    return {
      ok: false,
      error: extractError(error),
      meetings: [],
    };
  }
};

export const scheduleMeeting = async (payload = {}) => {
  try {
    const { data } = await client.post("/schedule/meetings", payload);
    return data;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

export const updateMeeting = async (id, payload = {}) => {
  try {
    const { data } = await client.patch(`/schedule/meetings/${id}`, payload);
    return data;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

export const deleteMeeting = async (id, params = {}) => {
  try {
    const { data } = await client.delete(`/schedule/meetings/${id}`, { params });
    return data;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

export const fetchPlanUploads = async (params = {}) => {
  try {
    const { data } = await client.get("/plan-uploads", { params });
    return data;
  } catch (error) {
    return {
      ok: false,
      error: extractError(error),
      planUploads: [],
    };
  }
};

export const createPlanUpload = async (payload = {}) => {
  try {
    const { data } = await client.post("/plan-uploads", payload);
    return data;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

export const updatePlanUpload = async (id, payload = {}) => {
  try {
    const { data } = await client.patch(`/plan-uploads/${id}`, payload);
    return data;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

export const deletePlanUpload = async (id, params = {}) => {
  try {
    const { data } = await client.delete(`/plan-uploads/${id}`, { params });
    return data;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

export default {
  fetchServicePacks,
  createServicePack,
  updateServicePack,
  deleteServicePack,
  fetchMeetings,
  scheduleMeeting,
  updateMeeting,
  deleteMeeting,
  fetchPlanUploads,
  createPlanUpload,
  updatePlanUpload,
  deletePlanUpload,
};
