import { AsyncLocalStorage } from 'node:async_hooks';

const storage = new AsyncLocalStorage();

export const runWithRequestContext = (context, callback) => {
  if (typeof callback !== 'function') {
    throw new TypeError('callback must be a function');
  }
  return storage.run({ ...(context || {}) }, callback);
};

export const getRequestContext = () => storage.getStore() || {};

export const updateRequestContext = (values = {}) => {
  const store = storage.getStore();
  if (!store || !values || typeof values !== 'object') {
    return;
  }
  Object.assign(store, values);
};

export default {
  runWithRequestContext,
  getRequestContext,
  updateRequestContext,
};
