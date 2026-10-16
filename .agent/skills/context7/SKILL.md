---
name: context7
description: Query live, up-to-date documentation and code examples for any library or framework (Next.js, Supabase, Tailwind, React, etc.) using Context7.
---

# Context7 Documentation Skill

Context7 provides real-time access to official library documentation, types, and up-to-date code patterns.

## Commands

### 1. Resolve Library ID

Search for a library and get its Context7-compatible ID (e.g. `/vercel/next.js`, `/supabase/supabase-js`):

```bash
npx ctx7 library <libraryName> [optionalQuery]
```

### 2. Query Documentation

Fetch up-to-date documentation sections and code examples:

```bash
npx ctx7 docs <libraryId> "<specific query or concept>"
```

### Examples

```bash
# Query Next.js SSR session handling
npx ctx7 docs /vercel/next.js "proxy.ts session refresh"

# Query Supabase SSR cookies handling
npx ctx7 docs /supabase/supabase-js "createServerClient cookies"
```
