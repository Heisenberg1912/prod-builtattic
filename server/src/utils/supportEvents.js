const threadSubscribers = new Map(); // threadId -> Set<res>

export const addSupportClient = (threadId, res) => {
  if (!threadId || !res) return;
  const set = threadSubscribers.get(threadId) || new Set();
  set.add(res);
  threadSubscribers.set(threadId, set);
};

export const removeSupportClient = (threadId, res) => {
  const set = threadSubscribers.get(threadId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) {
    threadSubscribers.delete(threadId);
  }
};

export const broadcastSupportThread = (threadId, payload) => {
  const set = threadSubscribers.get(threadId);
  if (!set || set.size === 0) return;
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const res of [...set]) {
    try {
      res.write(data);
    } catch (err) {
      set.delete(res);
    }
  }
  if (set.size === 0) {
    threadSubscribers.delete(threadId);
  }
};
