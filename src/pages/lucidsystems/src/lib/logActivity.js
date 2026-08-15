const db = globalThis.__B44_DB__ || {
  auth: { isAuthenticated: async () => false, me: async () => null },
  entities: new Proxy(
    {},
    {
      get: () => ({
        filter: async () => [],
        get: async () => null,
        create: async () => ({}),
        update: async () => ({}),
        delete: async () => ({}),
      }),
    },
  ),
  integrations: { Core: { UploadFile: async () => ({ file_url: "" }) } },
};

export async function logActivity(severity, actor, detail) {
  try {
    await db.entities.ActivityLog.create({ severity, actor, detail });
  } catch (e) {
    // best-effort — logging should never break user flows
  }
}
