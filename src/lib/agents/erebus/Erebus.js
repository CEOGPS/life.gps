// ============================================================
// Erebus.js — Operator Agent (Browser, Media, Deployment)
// Place in: src/lib/agents/Erebus.js
// ============================================================

import { UnifiedAgent, Tool, config } from "../UnifiedAgentCore.js";

// === Browser Tools ===
const browserNavigateTool = new Tool({
  name: "browser_navigate",
  description: "Navigate to a URL in the browser",
  parameters: {
    type: "object",
    required: ["url"],
    properties: { url: { type: "string" } },
  },
  permission: "safe",
  requiresBrowser: true,
  handler: async (args, context) =>
    context.agent.browser.navigate(context.sessionId || "default", args.url),
});

const browserTakeoverTool = new Tool({
  name: "browser_takeover",
  description: "Hand browser control to the user for manual actions",
  parameters: { type: "object", required: [] },
  permission: "confirm",
  requiresBrowser: true,
  handler: async (args, context) =>
    context.agent.browser.takeover(context.sessionId || "default"),
});

// === Media Tools ===
const generateImageTool = new Tool({
  name: "generate_image",
  description: "Generate an image from a text prompt",
  parameters: {
    type: "object",
    required: ["prompt"],
    properties: {
      prompt: { type: "string" },
      style: { type: "string" },
      size: { type: "string" },
    },
  },
  permission: "safe",
  handler: async (args, context) =>
    context.agent.media.generateImage(args.prompt, {
      style: args.style,
      size: args.size,
    }),
});

const generateVideoTool = new Tool({
  name: "generate_video",
  description: "Generate a short video from a text prompt",
  parameters: {
    type: "object",
    required: ["prompt"],
    properties: { prompt: { type: "string" }, duration: { type: "number" } },
  },
  permission: "safe",
  handler: async (args, context) =>
    context.agent.media.generateVideo(args.prompt, {
      duration: args.duration || 4,
    }),
});

const generateAudioTool = new Tool({
  name: "generate_audio",
  description: "Generate music or sound effects from a text prompt",
  parameters: {
    type: "object",
    required: ["prompt"],
    properties: { prompt: { type: "string" }, duration: { type: "number" } },
  },
  permission: "safe",
  handler: async (args, context) =>
    context.agent.media.generateAudio(args.prompt, {
      duration: args.duration || 10,
    }),
});

// === Cloudflare Deployment ===
const cloudflareDeployTool = new Tool({
  name: "cloudflare_deploy",
  description: "Deploy changes to lifeos1.pages.dev",
  parameters: {
    type: "object",
    required: ["files"],
    properties: { files: { type: "object" }, message: { type: "string" } },
  },
  permission: "confirm",
  handler: async (args, context) => {
    if (!context.agent.cloudflare) throw new Error("Cloudflare not configured");
    return context.agent.cloudflare.deploy(args.files);
  },
});

// === Brilliant Directories Management ===
const bdManageTool = new Tool({
  name: "bd_manage",
  description: "Manage ceogps.com Brilliant Directories site",
  parameters: {
    type: "object",
    required: ["action"],
    properties: {
      action: {
        type: "string",
        enum: ["get_members", "update_member", "add_listing", "get_stats"],
      },
      params: { type: "object" },
    },
  },
  permission: "confirm",
  requiresBrowser: true,
  handler: async (args, context) => {
    const sessionId = context.sessionId || "bd_session";
    const siteUrl = config.bd.siteUrl;

    switch (args.action) {
      case "get_members":
        await context.agent.browser.navigate(
          sessionId,
          `${siteUrl}/admin/members`,
        );
        return context.agent.browser.exec(sessionId, "evaluate", {
          script: `() => Array.from(document.querySelectorAll('.member-row')).map(r => ({
            name: r.querySelector('.member-name')?.innerText,
            email: r.querySelector('.member-email')?.innerText,
            status: r.querySelector('.member-status')?.innerText
          }))`,
        });
      default:
        return { error: `Unknown action: ${args.action}` };
    }
  },
});

// === File System (local development) ===
const fileSystemTool = new Tool({
  name: "fs_operation",
  description: "Read/write local files (development only)",
  parameters: {
    type: "object",
    required: ["operation", "path"],
    properties: {
      operation: { type: "string", enum: ["read", "write", "list", "delete"] },
      path: { type: "string" },
      content: { type: "string" },
    },
  },
  permission: "restricted",
  handler: async (args, context) => {
    // Would need a backend endpoint
    return {
      note: "Local FS requires backend endpoint",
      path: args.path,
      operation: args.operation,
    };
  },
});

// === Erebus Agent ===
class Erebus extends UnifiedAgent {
  constructor(customConfig = {}) {
    super(customConfig);
    this.registerTool(browserNavigateTool);
    this.registerTool(browserTakeoverTool);
    this.registerTool(generateImageTool);
    this.registerTool(generateVideoTool);
    this.registerTool(generateAudioTool);
    this.registerTool(cloudflareDeployTool);
    this.registerTool(bdManageTool);
    this.registerTool(fileSystemTool);
    this.identity = "Erebus";
  }

  async execute(instruction, options = {}) {
    const result = await this.think(instruction, {
      sessionId: options.sessionId || "erebus",
      ...options,
    });
    if (
      instruction.toLowerCase().includes("take over") ||
      instruction.toLowerCase().includes("let me control")
    ) {
      await this.browser.takeover(options.sessionId || "erebus");
    }
    return result;
  }

  async uploadData(data, type = "knowledge") {
    this.memory.add(
      "system",
      `Uploaded: ${data.summary || data.slice(0, 200)}`,
    );
    localStorage.setItem(`er_upload_${Date.now()}`, JSON.stringify(data));
  }
}

let erebusInstance = null;
export function getErebus() {
  if (!erebusInstance) erebusInstance = new Erebus();
  return erebusInstance;
}
