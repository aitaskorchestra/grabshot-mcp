# GrabShot MCP Server

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that lets AI assistants capture website screenshots using the [GrabShot API](https://grabshot.dev).

## Features

- **Screenshot any URL** with customizable viewport, format, and delay
- **Device frames** - wrap screenshots in iPhone, MacBook, iPad, Pixel, or Galaxy frames
- **AI cleanup** - automatically remove popups, cookie banners, and overlays
- **Full-page capture** - screenshot entire pages, not just the viewport
- **Usage tracking** - check your remaining quota

## Quick Start

### 1. Get a free API key

Sign up at [grabshot.dev](https://grabshot.dev) - 25 free screenshots/month, no credit card needed.

### 2. Configure in Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "grabshot": {
      "command": "npx",
      "args": ["-y", "grabshot-mcp-server"],
      "env": {
        "GRABSHOT_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### 3. Use it

Ask Claude to take a screenshot:

> "Take a screenshot of https://github.com with an iPhone frame"

> "Capture a full-page screenshot of my landing page with AI cleanup enabled"

> "Screenshot https://example.com at mobile width (375px)"

## Tools

### `take_screenshot`

Capture a screenshot of any website.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | string | required | Website URL to screenshot |
| `full_page` | boolean | false | Capture entire page |
| `device_frame` | string | none | Device frame (iphone-15-pro, macbook-pro, ipad-pro, pixel-8, galaxy-s24) |
| `ai_cleanup` | boolean | false | Remove popups and banners with AI |
| `width` | number | 1280 | Viewport width in pixels |
| `height` | number | 800 | Viewport height in pixels |
| `format` | string | png | Output format (png, jpeg, webp) |
| `delay` | number | 0 | Wait ms before capture |

### `get_usage`

Check your current API usage and remaining quota.

## Pricing

| Plan | Screenshots/mo | Price | AI Cleanup |
|------|---------------|-------|------------|
| Free | 25 | $0 | No |
| Starter | 1,000 | $9/mo | Yes |
| Pro | 5,000 | $29/mo | Yes |
| Business | 25,000 | $79/mo | Yes |

## Links

- [GrabShot Website](https://grabshot.dev)
- [API Documentation](https://grabshot.dev/docs.html)
- [Dashboard](https://grabshot.dev/dashboard.html)
- [GitHub](https://github.com/aitaskorchestra/grabshot-mcp)

## License

MIT
