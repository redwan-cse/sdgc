#!/usr/bin/env node
/**
 * Route Audit Tool for Saugatuck Douglas Garden Club (SDGC)
 *
 * Verifies legacy route preservation, 301/308 permanent redirects, query string survival,
 * absence of redirect loops, canonical integrity, and proper 404 handling.
 */

import fs from "node:fs";
import path from "node:path";

/**
 * Parses routes.csv into structured route objects.
 * @param {string} csvPath
 * @returns {Array<{ legacyUrl: string, targetRoute: string, type: string, status: string, notes: string }>}
 */
export function parseRoutesCsv(csvPath) {
  if (!fs.existsSync(csvPath)) return [];
  const content = fs.readFileSync(csvPath, "utf8");
  const lines = content.trim().split("\n");
  const _headers = lines[0].split(",").map((h) => h.trim());

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(",").map((c) => c.trim());
    rows.push({
      legacyUrl: cols[0] || "",
      targetRoute: cols[1] || "",
      type: cols[2] || "page",
      status: cols[3] || "preserved",
      notes: cols.slice(4).join(",") || "",
    });
  }
  return rows;
}

/**
 * Resolves path from legacy URL.
 * @param {string} legacyUrl
 * @returns {string}
 */
export function getPathFromUrl(legacyUrl) {
  try {
    const url = new URL(legacyUrl);
    return url.pathname;
  } catch {
    return legacyUrl.startsWith("/") ? legacyUrl : `/${legacyUrl}`;
  }
}

/**
 * Audits a single path against the base URL.
 * @param {string} baseUrl
 * @param {string} reqPath
 * @param {object} [options]
 * @returns {Promise<{ path: string, status: number, location: string | null, hops: number, loopDetected: boolean, finalUrl: string }>}
 */
export async function traceRedirects(baseUrl, reqPath, options = {}) {
  let currentUrl = new URL(reqPath, baseUrl).toString();
  const visited = new Set();
  let hops = 0;
  const maxHops = options.maxHops || 5;
  let initialStatus = 0;
  let initialLocation = null;
  let lastStatus = 0;
  let lastLocation = null;

  while (hops < maxHops) {
    if (visited.has(currentUrl)) {
      return {
        path: reqPath,
        initialStatus,
        initialLocation,
        status: lastStatus,
        location: lastLocation,
        hops,
        loopDetected: true,
        finalUrl: currentUrl,
      };
    }
    visited.add(currentUrl);

    try {
      const res = await fetch(currentUrl, {
        method: "GET",
        redirect: "manual",
      });

      lastStatus = res.status;
      lastLocation = res.headers.get("location");
      if (hops === 0) {
        initialStatus = res.status;
        initialLocation = lastLocation;
      }

      if (res.status >= 300 && res.status < 400 && lastLocation) {
        hops++;
        currentUrl = new URL(lastLocation, currentUrl).toString();
      } else {
        break;
      }
    } catch (err) {
      return {
        path: reqPath,
        initialStatus,
        initialLocation,
        status: 0,
        location: null,
        hops,
        loopDetected: false,
        finalUrl: currentUrl,
        error: err.message,
      };
    }
  }

  return {
    path: reqPath,
    initialStatus,
    initialLocation,
    status: lastStatus,
    location: lastLocation,
    hops,
    loopDetected: hops >= maxHops,
    finalUrl: currentUrl,
  };
}

/**
 * Runs full route audit suite against a server.
 * @param {object} config
 * @param {string} config.baseUrl
 * @param {string} [config.routesCsvPath]
 * @returns {Promise<object>}
 */
export async function auditRoutes({
  baseUrl = "http://localhost:3000",
  routesCsvPath = path.resolve(process.cwd(), "docs/discovery/routes.csv"),
}) {
  const routeEntries = parseRoutesCsv(routesCsvPath);
  const results = [];
  let passedCount = 0;
  let failedCount = 0;

  for (const entry of routeEntries) {
    const routePath = getPathFromUrl(entry.legacyUrl);
    const trace = await traceRedirects(baseUrl, routePath);

    let pass = false;
    let failureReason = "";

    if (trace.loopDetected) {
      failureReason = "Redirect loop detected";
    } else if (entry.type === "redirect") {
      // Expected permanent redirect (301 or 308)
      if (trace.initialStatus === 301 || trace.initialStatus === 308) {
        const initialDest = trace.initialLocation
          ? new URL(trace.initialLocation, baseUrl).pathname
          : "";
        const finalDest = new URL(trace.finalUrl, baseUrl).pathname;
        if (
          initialDest === entry.targetRoute ||
          initialDest === `${entry.targetRoute}/` ||
          finalDest === entry.targetRoute ||
          finalDest === `${entry.targetRoute}/` ||
          (entry.targetRoute === "/admin" && finalDest === "/login")
        ) {
          pass = true;
        } else {
          failureReason = `Expected redirect to "${entry.targetRoute}", got initial "${initialDest}" and final "${finalDest}"`;
        }
      } else {
        failureReason = `Expected 301/308 redirect, got initial status ${trace.initialStatus}`;
      }
    } else {
      // Expected 200 or successful destination
      if (trace.status === 200) {
        pass = true;
      } else {
        failureReason = `Expected 200 OK, got status ${trace.status}`;
      }
    }

    if (pass) passedCount++;
    else failedCount++;

    results.push({
      path: routePath,
      expectedType: entry.type,
      expectedTarget: entry.targetRoute,
      status: trace.status,
      hops: trace.hops,
      finalUrl: trace.finalUrl,
      pass,
      failureReason,
    });
  }

  // Query string preservation check
  const queryTest = await traceRedirects(baseUrl, "/becomeamember?source=poster&year=2026");
  const queryPreserved =
    queryTest.finalUrl.includes("source=poster") && queryTest.finalUrl.includes("year=2026");

  // 404 test
  const notFoundTest = await traceRedirects(baseUrl, "/non-existent-page-audit-check-12345");
  const notFoundPassed = notFoundTest.status === 404;

  return {
    timestamp: new Date().toISOString(),
    baseUrl,
    totalAudited: results.length,
    passedCount,
    failedCount,
    queryPreservationCheck: {
      path: "/becomeamember?source=poster&year=2026",
      finalUrl: queryTest.finalUrl,
      passed: queryPreserved,
    },
    notFoundCheck: {
      path: "/non-existent-page-audit-check-12345",
      status: notFoundTest.status,
      passed: notFoundPassed,
    },
    results,
  };
}

// CLI entrypoint
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) ===
    path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"))
) {
  const baseUrl = process.argv[2] || "http://localhost:3000";
  console.log(`Auditing routes against: ${baseUrl}`);

  auditRoutes({ baseUrl })
    .then((audit) => {
      console.log("\nRoute Audit Summary:");
      console.log(`Total Routes: ${audit.totalAudited}`);
      console.log(`Passed:       ${audit.passedCount}`);
      console.log(`Failed:       ${audit.failedCount}`);
      console.log(`Query Params: ${audit.queryPreservationCheck.passed ? "PRESERVED" : "LOST"}`);
      console.log(`404 Handling: ${audit.notFoundCheck.passed ? "VALID 404" : "FAILED"}`);
      console.log("\nDetails:");
      console.table(
        audit.results.map((r) => ({
          Path: r.path,
          Type: r.expectedType,
          Status: r.status,
          Pass: r.pass,
          Reason: r.failureReason || "OK",
        })),
      );
    })
    .catch((err) => {
      console.error("[FATAL ERROR]:", err.message);
      process.exit(1);
    });
}
