---
name: supabase
description: Supabase MCP integration for local Docker-based Supabase. Use to inspect tables, run SQL queries, view advisors, and generate TypeScript types.
---

# Supabase Local MCP Skill

This skill provides integration with the local Docker-based Supabase instance running at `http://127.0.0.1:54321/mcp`.

## Features

- **list_tables**: List public tables and views.
- **execute_sql**: Run ad-hoc SQL queries against the local PostgreSQL database.
- **get_advisors**: Check for security and performance recommendations (e.g., missing RLS policies).
- **apply_migration**: Run schema DDL migrations.
- **generate_typescript_types**: Generate TypeScript interfaces from database tables.

## Local Configuration

- Server URL: `http://127.0.0.1:54321/mcp`
- Database URL: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- Studio: `http://127.0.0.1:54323`
