import client from "../config/axios.jsx";

export async function fetchAddresses() {
  const { data } = await client.get("/addresses");
  return Array.isArray(data?.items) ? data.items : [];
}

export async function createAddress(address) {
  const { data } = await client.post("/addresses", address);
  return Array.isArray(data?.items) ? data.items : [];
}

export async function updateAddress(id, address) {
  const { data } = await client.put(`/addresses/${id}`, address);
  return Array.isArray(data?.items) ? data.items : [];
}

export async function deleteAddress(id) {
  const { data } = await client.delete(`/addresses/${id}`);
  return Array.isArray(data?.items) ? data.items : [];
}
