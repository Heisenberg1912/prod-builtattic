import client from "../config/axios.jsx";

export const submitStudioRequest = async (payload) => {
  const { data } = await client.post('/studio/requests', payload);
  return data;
};

