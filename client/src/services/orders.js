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

const hasStoredToken = () => {
  if (typeof window === "undefined") return false;
  try {
    const storage = window.localStorage;
    const token = storage.getItem("auth_token") || storage.getItem("token");
    return Boolean(token && token !== "undefined" && token !== "null");
  } catch {
    return false;
  }
};

const shouldRetryWithDemo = (error) => {
  if (!error) return true;
  if (error?.response?.status === 401 || error?.response?.status === 403) return true;
  if (error?.code === "ERR_NETWORK" || !error?.response) return true;
  return false;
};

const injectDemoHeader = (headers = {}) => ({
  ...headers,
  "x-demo-user": headers["x-demo-user"] || "demo-user",
});

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

export async function fetchOrders(params = {}, options = {}) {
  const { allowDemo = true, headers: customHeaders = {} } = options;
  const hasToken = hasStoredToken();
  const baseHeaders = { ...customHeaders };

  if (allowDemo && !hasToken && !baseHeaders["x-demo-user"]) {
    baseHeaders["x-demo-user"] = "demo-user";
  }

  try {
    const { data } = await client.get("/orders", { params, headers: baseHeaders });
    const parsed = handleResponse(data, "Failed to fetch orders");
    return parsed.items || [];
  } catch (error) {
    if (allowDemo && !baseHeaders["x-demo-user"] && shouldRetryWithDemo(error)) {
      const retryHeaders = injectDemoHeader(baseHeaders);
      const { data } = await client.get("/orders", { params, headers: retryHeaders });
      const parsed = handleResponse(data, "Failed to fetch orders");
      return parsed.items || [];
    }
    throw error;
  }
}
