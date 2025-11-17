import client from "../config/axios.jsx";

const okOrThrow = (response, fallbackMessage) => {
  if (!response?.ok) {
    const error = new Error(response?.error || fallbackMessage);
    error.details = response?.details;
    throw error;
  }
  return response;
};

export async function submitRating(payload) {
  const { data } = await client.post('/ratings', payload);
  return okOrThrow(data, 'Unable to save rating');
}

export async function fetchRatingSnapshot(targetType, targetId) {
  const { data } = await client.get(`/ratings/${targetType}/${targetId}`);
  return okOrThrow(data, 'Unable to load ratings');
}
