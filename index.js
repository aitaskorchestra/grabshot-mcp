#!/usr/bin/env node

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const https = require("https");

const GRABSHOT_BASE = "https://grabshot.dev";

function makeRequest(path, apiKey, params = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, GRABSHOT_BASE);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: "GET",
      headers: { "X-API-Key": apiKey },
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const body = Buffer.concat(chunks);
        if (res.headers["content-type"]?.includes("image")) {
          resolve({
            type: "image",
            data: body.toString("base64"),
            mimeType: res.headers["content-type"],
          });
        } else {
          try {
            resolve({ type: "json", data: JSON.parse(body.toString()) });
          } catch {
            resolve({ type: "text", data: body.toString() });
          }
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

const server = new Server(
  { name: "grabshot-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "take_screenshot",
      description:
        "Capture a screenshot of any website URL. Supports full-page capture, device frames (iPhone, MacBook, iPad, etc.), AI cleanup (removes popups/banners), custom viewport sizes, and multiple formats (png, jpeg, webp).",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "Website URL to screenshot (must include https://)" },
          full_page: { type: "boolean", description: "Capture full page (not just viewport)", default: false },
          device_frame: {
            type: "string",
            description: "Wrap screenshot in a device frame",
            enum: ["none", "iphone-15-pro", "macbook-pro", "ipad-pro", "pixel-8", "galaxy-s24"],
          },
          ai_cleanup: { type: "boolean", description: "Use AI to remove popups, cookie banners, and overlays", default: false },
          width: { type: "number", description: "Viewport width in pixels", default: 1280 },
          height: { type: "number", description: "Viewport height in pixels", default: 800 },
          format: { type: "string", enum: ["png", "jpeg", "webp"], default: "png" },
          delay: { type: "number", description: "Wait milliseconds before capture (for dynamic content)", default: 0 },
        },
        required: ["url"],
      },
    },
    {
      name: "get_usage",
      description: "Check your GrabShot API usage and remaining quota for the current billing period.",
      inputSchema: { type: "object", properties: {} },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const apiKey = process.env.GRABSHOT_API_KEY;
  if (!apiKey) {
    return {
      content: [{ type: "text", text: "Error: GRABSHOT_API_KEY environment variable is not set. Get a free API key at https://grabshot.dev" }],
      isError: true,
    };
  }

  const { name, arguments: args } = request.params;

  if (name === "take_screenshot") {
    try {
      const result = await makeRequest("/api/screenshot", apiKey, {
        url: args.url,
        fullPage: args.full_page,
        deviceFrame: args.device_frame,
        aiCleanup: args.ai_cleanup,
        width: args.width,
        height: args.height,
        format: args.format || "png",
        delay: args.delay,
      });

      if (result.type === "image") {
        return {
          content: [
            { type: "image", data: result.data, mimeType: result.mimeType },
            { type: "text", text: `Screenshot captured successfully for ${args.url}` },
          ],
        };
      } else if (result.type === "json" && result.data.error) {
        return {
          content: [{ type: "text", text: `Error: ${result.data.error}` }],
          isError: true,
        };
      }
      return { content: [{ type: "text", text: JSON.stringify(result.data) }] };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Request failed: ${err.message}` }],
        isError: true,
      };
    }
  }

  if (name === "get_usage") {
    try {
      const result = await makeRequest("/api/usage", apiKey);
      if (result.type === "json") {
        const d = result.data;
        return {
          content: [{
            type: "text",
            text: `GrabShot Usage:\n- Plan: ${d.plan || "free"}\n- Screenshots used: ${d.used || 0}/${d.limit || 25}\n- Period: ${d.period || "monthly"}`,
          }],
        };
      }
      return { content: [{ type: "text", text: result.data }] };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Failed to get usage: ${err.message}` }],
        isError: true,
      };
    }
  }

  return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("GrabShot MCP server running on stdio");
}

main().catch(console.error);
