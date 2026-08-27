# @mk-kit/mcp

[MCP](https://modelcontextprotocol.io) server for
[`@mk-kit/ui`](https://www.npmjs.com/package/@mk-kit/ui) — gives Claude Code,
Cursor, Copilot, Windsurf, Zed and any other MCP client an exact, searchable
reference for every component, directive, service, helper and type of the
mk-kit Angular library: selectors, inputs with types and defaults, outputs,
methods, import paths and links to the docs page. No more guessed input names.

The data is generated from the library sources on every release
([`mk-kit.dev/api.json`](https://mk-kit.dev/api.json)) and bundled with the
package; on start the server fetches a newer snapshot from mk-kit.dev when
one exists, so it stays current between package updates.

## Setup

**Claude Code**

```bash
claude mcp add mk-kit -- npx -y @mk-kit/mcp
```

**Cursor / Windsurf / Claude Desktop / VS Code** — add to the MCP config:

```json
{
  "mcpServers": {
    "mk-kit": {
      "command": "npx",
      "args": ["-y", "@mk-kit/mcp"]
    }
  }
}
```

Runs over stdio; nothing to host. Node ≥ 20.

## Tools

| Tool | What it does |
|------|--------------|
| `search_mk_kit` | Find exports by name, selector (`mk-select`, `mkButton`) or free text ("date range", "toast", "csv export"); optional `kind` / `entry` filters. |
| `get_mk_kit_export` | Full API of one export as Markdown — import, selector, description + example, inputs, outputs, methods, docs link. Accepts class names or selectors. |
| `list_mk_kit_exports` | Browse every entry point, or one entry point / kind, with one-line summaries. |
| `get_mk_kit_overview` | What mk-kit is, install + setup conventions, links to every docs page (the site's `llms.txt`). |

Resources: `mk-kit://llms.txt`, `mk-kit://llms-full.txt`, `mk-kit://api.json`.

## Environment

| Variable | Effect |
|----------|--------|
| `MK_KIT_MCP_OFFLINE=1` | Never fetch; use the bundled snapshot only. |
| `MK_KIT_SITE` | Base URL to fetch `api.json`, `llms.txt`, `llms-full.txt` from (default `https://mk-kit.dev`). |

## Without MCP

The same data is plain files: <https://mk-kit.dev/llms.txt> (index),
<https://mk-kit.dev/llms-full.txt> (whole API as Markdown) and
<https://mk-kit.dev/api.json>. Paste a URL into any assistant that can fetch.

## License

MIT — © Mateusz Kornaś. Part of the [mk-kit](https://github.com/mk-kit/mk-kit) repository.
