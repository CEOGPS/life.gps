        await env.LIFEOS_KV.delete(key);
        return json({ ok: true });
      }
    }

    // API Keys
    const keysResult = await handleKeys(req, env, url);
    if (keysResult) return keysResult;

    // LLM
    if (path === "/api/llm/invoke" && req.method === "POST") {
      return handleLLM(req, env);
    }

    // LLM preference
    if (path === "/api/llm/preference" && req.method === "GET") {
      const preferred = await env.LIFEOS_KV.get("llm_preferred_model") || "auto";
      return json({ preferred });
    }
    if (path === "/api/llm/preference" && req.method === "POST") {
      try {
        const { model } = await req.json();
        const next = String(model || "auto").trim().toLowerCase();
        await env.LIFEOS_KV.put("llm_preferred_model", next);
        return json({ ok: true, preferred: next });
      } catch (e) {
        return err("preference save failed: " + e.message, 500);
      }
    }

    // Meta
    const metaResult = await handleMeta(req, env, url);
    if (metaResult) return metaResult;

    // LinkedIn
    const liResult = await handleLinkedIn(req, env, url);
    if (liResult) return liResult;

    // X (Twitter)
    const xResult = await handleX(req, env, url);
    if (xResult) return xResult;

    // Social Queue
    const socialResult = await handleSocialQueue(req, env, url);
    if (socialResult) return socialResult;

    // Webhooks
    const webhookResult = await handleWebhooks(req, env, url);
    if (webhookResult) return webhookResult;

    // Profile
    if (path === "/api/profile") {
      if (req.method === "GET") {
        const d = await env.LIFEOS_KV.get("profile", "json");
        return json(d || { name: "Chris Green", email: "chris@ceogps.com", location: "Atlanta, GA" });
      }
      if (req.method === "POST") {
        await env.LIFEOS_KV.put("profile", JSON.stringify(await req.json()));
        return json({ ok: true });
      }
    }

    // Upload
    if (path === "/api/upload" && req.method === "POST") {
      const formData = await req.formData();
      const file = formData.get("file");
      const type = formData.get("type") || "general";
      const fileKey = formData.get("key") || `${type}/${Date.now()}_${file.name}`;
      if (!file) return err("No file");
      await env.lifeos_uploads.put(fileKey, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type }
      });
      const publicUrl = `${WORKER_BASE}/api/files/${encodeURIComponent(fileKey)}`;
      const fileInfo = {
        key: fileKey,
        url: publicUrl,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        type,
        uploadedAt: Date.now()
      };
      const existing = await env.LIFEOS_KV.get("files_" + type, "json") || [];
      await env.LIFEOS_KV.put("files_" + type, JSON.stringify([fileInfo, ...existing].slice(0, 500)));
      if (type === "avatar") {
        const profile = await env.LIFEOS_KV.get("profile", "json") || {};
        profile.avatarUrl = publicUrl;
        await env.LIFEOS_KV.put("profile", JSON.stringify(profile));
      }
      return json({ ok: true, url: publicUrl, key: fileKey });
    }

    // Files
    if (path.startsWith("/api/files/") && req.method === "GET") {
      const fileKey = decodeURIComponent(path.replace("/api/files/", ""));
      const obj = await env.lifeos_uploads.get(fileKey);
      if (!obj) return err("Not found", 404);
      return new Response(obj.body, {
        headers: {
          ...CORS,
          "Content-Type": obj.httpMetadata?.contentType || "application/octet-stream",
          "Cache-Control": "public, max-age=31536000"
        }
      });
    }
    if (path === "/api/files" && req.method === "GET") {
      const type = url.searchParams.get("type") || "general";
      return json(await env.LIFEOS_KV.get("files_" + type, "json") || []);
    }
    if (path.startsWith("/api/files/") && req.method === "DELETE") {
      const fileKey = decodeURIComponent(path.replace("/api/files/", ""));
      await env.lifeos_uploads.delete(fileKey);
      const type = fileKey.split("/")[0];
      const existing = await env.LIFEOS_KV.get("files_" + type, "json") || [];
      await env.LIFEOS_KV.put("files_" + type, JSON.stringify(existing.filter((f) => f.key !== fileKey)));
      return json({ ok: true });
    }

    // Sentinel
    if (path === "/api/sentinel/capture" && req.method === "POST") {
      try {
        const body = await req.json();
        const item = {
          id: "sen_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
          url: body.url || "",
          title: body.title || "Untitled",
          snippet: body.snippet || "",
          selectedText: body.selectedText || "",
          source: body.source || "bookmarklet",
          capturedAt: new Date().toISOString(),
          status: "new",
          aiAction: null
        };
        const existing = JSON.parse(await env.LIFEOS_KV.get("sentinel_items") || "[]");
        const all = [item, ...existing];
        const trimmed = all.slice(0, 500);
        await env.LIFEOS_KV.put("sentinel_items", JSON.stringify(trimmed));
        return json({ ok: true, id: item.id });
      } catch (e) {
        return json({ ok: false, error: e.message }, 500);
      }
    }
    if (path === "/api/sentinel/items" && req.method === "GET") {
      try {
        const items = JSON.parse(await env.LIFEOS_KV.get("sentinel_items") || "[]");
        return json({ ok: true, items });
      } catch (e) {
        return json({ ok: false, items: [] });
      }
    }
    if (path.startsWith("/api/sentinel/item/") && req.method === "DELETE") {
      try {
        const itemId = path.replace("/api/sentinel/item/", "");
        const items = JSON.parse(await env.LIFEOS_KV.get("sentinel_items") || "[]");
        const filtered = items.filter((i) => i.id !== itemId);
        await env.LIFEOS_KV.put("sentinel_items", JSON.stringify(filtered));
        return json({ ok: true });
      } catch (e) {
        return json({ ok: false, error: e.message }, 500);
      }
    }

    // Not Found
    return new Response("Not Found", { status: 404 });
  }
};