const api = globalThis.browser ?? globalThis.chrome;
export const storage = {
  async get(keys) { return api.storage.local.get(keys); },
  async set(values) { return api.storage.local.set(values); }
};
export const runtime = { getURL: (path) => api.runtime.getURL(path) };
