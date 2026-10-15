import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Write UTF-8 consistently on Windows and Linux; never use PowerShell > redirection.
const cli = fileURLToPath(new URL("../node_modules/supabase/dist/supabase.js", import.meta.url));
const result = spawnSync(
  process.execPath,
  [cli, "gen", "types", "typescript", "--local", "--schema", "public"],
  {
    encoding: "utf8",
    shell: false,
  },
);
if (result.error || result.status !== 0 || !result.stdout.includes("export type Database")) {
  console.error(result.error?.message ?? result.stderr ?? "Type generation failed");
  process.exit(1);
}
mkdirSync("src/types", { recursive: true });
const source = result.stdout
  .replace(/\r\n/g, "\n")
  .replace(/[\t ]+$/gm, "")
  .trimStart();
writeFileSync("src/types/database.ts", source, "utf8");
console.log("Generated src/types/database.ts from the local database");
