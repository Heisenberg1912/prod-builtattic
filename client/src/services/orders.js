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

const postOrderRequest = async (endpoint, payload, message, headers) => {
  const { data } = await client.post(endpoint, payload, { headers });
  const parsed = handleResponse(data, message);
  return extractOrder(parsed) ?? parsed;
};

export async function placeOrder(payload, options = {}) {
  const { headers = {} } = options;
  try {
    return await postOrderRequest("/orders/place", payload, "Failed to place order", headers);
  } catch (error) {
    if (error?.response?.status === 404) {
      return await postOrderRequest("/orders", payload, "Failed to place order", headers);
    }
    if (error?.response?.status === 401) {
      throw new Error("Please sign in to place an order");
    }
    throw error;
  }
}

export async function createOrderFromCart(payload = {}, options = {}) {
  const { headers = {} } = options;
  try {
    return await postOrderRequest("/orders", payload, "Failed to create order from cart", headers);
  } catch (error) {
    if (error?.response?.status === 401) {
      throw new Error("Please sign in to place an order");
    }
    throw error;
  }
}

export async function buyNow(payload, options = {}) {
  const { headers = {} } = options;
  try {
    return await postOrderRequest("/orders/buy-now", payload, "Failed to create buy now order", headers);
  } catch (error) {
    if (error?.response?.status === 404) {
      return await postOrderRequest("/orders", payload, "Failed to create buy now order", headers);
    }
    if (error?.response?.status === 401) {
      throw new Error("Please sign in to place an order");
    }
    throw error;
  }
}

export async function fetchOrders(params = {}, options = {}) {
  const { headers = {} } = options;
  try {
    const { data } = await client.get("/orders", { params, headers });
    const parsed = handleResponse(data, "Failed to fetch orders");
    return parsed.items || [];
  } catch (error) {
    if (error?.response?.status === 401) {
      throw new Error("Please sign in to view orders");
    }
    throw error;
  }
}
