import client from "../config/axios.jsx";
import { upsertAssociatePortalProfile } from "./portal.js";

const extractError = (error) =>
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  error?.message ||
  "Request failed";

export const fetchStudioHub = async (ownerType) => {
  const params = ownerType ? { ownerType } : undefined;
  const { data } = await client.get("/studio-hub", { params });
  return data;
};

export const fetchSkillStudioWorkspace = async (ownerType) => {
  const params = ownerType ? { ownerType } : undefined;
  const { data } = await client.get("/skill-studio/workspace", { params });
  return data;
};

export const createPlan = async (payload = {}, ownerType) => {
  try {
    const { data } = await client.post("/plan-uploads", { ...payload, ownerType });
    return data;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

export const publishPlan = async (planId, ownerType) => {
  try {
    const { data } = await client.patch(`/plan-uploads/${planId}`, { status: "published", ownerType });
    return data;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

export const uploadPlanMedia = async (planId, file, { ownerType, kind = "render", secure = false } = {}) => {
  if (!(file instanceof File)) {
    throw new Error("A file must be selected");
  }
  const formData = new FormData();
  formData.append("file", file);
  formData.append("kind", kind);
  formData.append("secure", secure ? "true" : "false");
  if (ownerType) formData.append("ownerType", ownerType);

  const { data } = await client.post(`/plan-uploads/${planId}/media`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const scheduleConsultation = async (payload = {}, ownerType) => {
  try {
    const { data } = await client.post("/schedule/meetings", { ...payload, ownerType });
    return data;
  } catch (error) {
    throw new Error(extractError(error));
  }
};

export const saveSkillProfile = async (payload = {}) => {
  const response = await upsertAssociatePortalProfile(payload, { saveDraftOnError: true });
  if (response?.ok === false) {
    throw new Error(response?.error?.message || "Unable to save profile");
  }
  return response?.profile || response;
};

export default {
  fetchStudioHub,
  fetchSkillStudioWorkspace,
  createPlan,
  publishPlan,
  uploadPlanMedia,
  scheduleConsultation,
  saveSkillProfile,
};
