#!/usr/bin/env node
import readline from "node:readline";

const ENDPOINT = process.env.SUPABASE_MCP_URL || "http://127.0.0.1:54321/mcp";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on("line", async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  try {
    const payload = JSON.parse(trimmed);
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 204 || res.status === 202) {
      return;
    }

    const text = await res.text();
    if (text) {
      process.stdout.write(`${text.trim()}\n`);
    }
  } catch (err) {
    console.error("Error forwarding to Supabase MCP:", err);
  }
});
