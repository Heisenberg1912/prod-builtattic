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

const buildRequestHeaders = (headers = {}, allowDemo = true) => {
  const next = { ...headers };
  if (allowDemo && !hasStoredToken() && !next["x-demo-user"]) {
    next["x-demo-user"] = "demo-user";
  }
  return next;
};

const postOrderRequest = async (endpoint, payload, message, headers) => {
  const { data } = await client.post(endpoint, payload, { headers });
  const parsed = handleResponse(data, message);
  return extractOrder(parsed) ?? parsed;
};

export async function placeOrder(payload, options = {}) {
  const { allowDemo = true, headers = {} } = options;
  const baseHeaders = buildRequestHeaders(headers, allowDemo);
  try {
    return await postOrderRequest('/orders/place', payload, 'Failed to place order', baseHeaders);
  } catch (error) {
    if (error?.response?.status === 404) {
      return await postOrderRequest('/orders', payload, 'Failed to place order', baseHeaders);
    }
    if (allowDemo && !baseHeaders['x-demo-user'] && shouldRetryWithDemo(error)) {
      const retryHeaders = injectDemoHeader(baseHeaders);
      return await postOrderRequest('/orders', payload, 'Failed to place order', retryHeaders);
    }
    if (error?.response?.status === 401) {
      throw new Error('Please sign in to place an order');
    }
    throw error;
  }
}

export async function createOrderFromCart(payload = {}, options = {}) {
  const { allowDemo = true, headers = {} } = options;
  const baseHeaders = buildRequestHeaders(headers, allowDemo);
  try {
    return await postOrderRequest('/orders', payload, 'Failed to create order from cart', baseHeaders);
  } catch (error) {
    if (allowDemo && !baseHeaders['x-demo-user'] && shouldRetryWithDemo(error)) {
      const retryHeaders = injectDemoHeader(baseHeaders);
      return await postOrderRequest('/orders', payload, 'Failed to create order from cart', retryHeaders);
    }
    if (error?.response?.status === 401) {
      throw new Error('Please sign in to place an order');
    }
    throw error;
  }
}

export async function buyNow(payload, options = {}) {
  const { allowDemo = true, headers = {} } = options;
  const baseHeaders = buildRequestHeaders(headers, allowDemo);
  try {
    return await postOrderRequest('/orders/buy-now', payload, 'Failed to create buy now order', baseHeaders);
  } catch (error) {
    if (allowDemo && !baseHeaders['x-demo-user'] && shouldRetryWithDemo(error)) {
      const retryHeaders = injectDemoHeader(baseHeaders);
      return await postOrderRequest('/orders/buy-now', payload, 'Failed to create buy now order', retryHeaders);
    }
    if (error?.response?.status === 404) {
      return await postOrderRequest('/orders', payload, 'Failed to create buy now order', baseHeaders);
    }
    if (error?.response?.status === 401) {
      throw new Error('Please sign in to place an order');
    }
    throw error;
  }
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
