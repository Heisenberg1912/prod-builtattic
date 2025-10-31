import client from "../config/axios.jsx";

const extractOrder = (data) => {
  if (data?.ok && data.order) return data.order;
  if (data?.ok && data.items) return data.items;
  return null;
};

const handleResponse = (data, fallbackMessage = "Unable to process order") => {
  if (!data?.ok) {
    const message = data?.message || data?.error || fallbackMessage;
    const error = new Error(message);
    error.response = data;
    throw error;
  }
  return data;
};

export async function placeOrder(payload) {
  const { data } = await client.post("/orders/place", payload);
  const parsed = handleResponse(data, "Failed to place order");
  return extractOrder(parsed) ?? parsed;
}

export async function createOrderFromCart(payload = {}) {
  const { data } = await client.post("/orders", payload);
  const parsed = handleResponse(data, "Failed to create order from cart");
  return extractOrder(parsed) ?? parsed;
}

export async function buyNow(payload) {
  const { data } = await client.post("/orders/buy-now", payload);
  const parsed = handleResponse(data, "Failed to create buy now order");
  return extractOrder(parsed) ?? parsed;
}

export async function fetchOrders(params = {}) {
  const { data } = await client.get("/orders", { params });
  const parsed = handleResponse(data, "Failed to fetch orders");
  return parsed.items || [];
}