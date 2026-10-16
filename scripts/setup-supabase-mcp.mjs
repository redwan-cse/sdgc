import fs from "node:fs";
import path from "node:path";

async function main() {
  const res = await fetch("http://127.0.0.1:54321/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
      params: {},
    }),
  });

  const data = await res.json();
  const dir = "C:/Users/redwan/.gemini/antigravity-ide/mcp/supabase";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const instructions = `# Supabase MCP Server Guidelines

Connects directly to local Docker-based Supabase on port 54321.
- Inspect tables and advisors before applying schema changes.
- Use execute_sql for read/inspect operations, apply_migration for DDL.
- Local endpoint: http://127.0.0.1:54321/mcp
`;

  fs.writeFileSync(path.join(dir, "instructions.md"), instructions);

  for (const tool of data.result.tools) {
    const schema = {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    };
    fs.writeFileSync(path.join(dir, `${tool.name}.json`), JSON.stringify(schema, null, 2));
    console.log(`Wrote schema for: ${tool.name}`);
  }
}

main().catch(console.error);
