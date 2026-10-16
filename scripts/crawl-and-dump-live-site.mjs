import fs from "node:fs";
import path from "node:path";

const BASE_URL = "https://saugatuckdouglasgardenclub.com";
const OUTPUT_DIR = path.resolve("imports/live-crawl");

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
          ...options.headers,
        },
        ...options,
      });
      return res;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

async function fetchJson(url) {
  try {
    const res = await fetchWithRetry(url);
    if (!res.ok) {
      console.warn(`[WARN] ${url} returned ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(`[ERROR] Failed to fetch JSON ${url}:`, err.message);
    return null;
  }
}

async function fetchText(url) {
  try {
    const res = await fetchWithRetry(url);
    if (!res.ok) {
      console.warn(`[WARN] ${url} returned ${res.status}`);
      return null;
    }
    return await res.text();
  } catch (err) {
    console.error(`[ERROR] Failed to fetch text ${url}:`, err.message);
    return null;
  }
}

async function main() {
  console.log("=== Starting Live WordPress Crawl and Dump ===");
  await ensureDir(OUTPUT_DIR);
  await ensureDir(path.join(OUTPUT_DIR, "pages-html"));
  await ensureDir(path.join(OUTPUT_DIR, "api-dumps"));

  // 1. Fetch WP REST API Site Index
  console.log("1. Fetching site root metadata from WP REST API...");
  const siteIndex = await fetchJson(`${BASE_URL}/wp-json/`);
  if (siteIndex) {
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "api-dumps/site-index.json"),
      JSON.stringify(siteIndex, null, 2),
      "utf8",
    );
  }

  // 2. Fetch all Pages from WP REST API
  console.log("2. Fetching all pages from /wp/v2/pages...");
  const wpPages = await fetchJson(`${BASE_URL}/wp-json/wp/v2/pages?per_page=100&_embed=1`);
  if (wpPages) {
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "api-dumps/wp-pages.json"),
      JSON.stringify(wpPages, null, 2),
      "utf8",
    );
    console.log(`Saved ${wpPages.length} pages metadata.`);
  }

  // 3. Fetch all Posts from WP REST API
  console.log("3. Fetching all posts from /wp/v2/posts...");
  const wpPosts = await fetchJson(`${BASE_URL}/wp-json/wp/v2/posts?per_page=100&_embed=1`);
  if (wpPosts) {
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "api-dumps/wp-posts.json"),
      JSON.stringify(wpPosts, null, 2),
      "utf8",
    );
    console.log(`Saved ${wpPosts.length} posts metadata.`);
  }

  // 4. Fetch all Events from TEC / Tribe REST API
  console.log("4. Fetching events from /tribe/events/v1/events...");
  const tecEvents = await fetchJson(`${BASE_URL}/wp-json/tribe/events/v1/events?per_page=100`);
  if (tecEvents) {
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "api-dumps/tec-events.json"),
      JSON.stringify(tecEvents, null, 2),
      "utf8",
    );
    console.log(`Saved ${tecEvents.events?.length || 0} events metadata.`);
  }

  // 5. Fetch Venues & Organizers
  console.log("5. Fetching venues and organizers...");
  const tecVenues = await fetchJson(`${BASE_URL}/wp-json/tribe/events/v1/venues?per_page=100`);
  if (tecVenues) {
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "api-dumps/tec-venues.json"),
      JSON.stringify(tecVenues, null, 2),
      "utf8",
    );
  }
  const tecOrganizers = await fetchJson(
    `${BASE_URL}/wp-json/tribe/events/v1/organizers?per_page=100`,
  );
  if (tecOrganizers) {
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "api-dumps/tec-organizers.json"),
      JSON.stringify(tecOrganizers, null, 2),
      "utf8",
    );
  }

  // 6. Fetch Media Catalog
  console.log("6. Fetching media catalog from /wp/v2/media...");
  let allMedia = [];
  let page = 1;
  while (page <= 5) {
    const mediaPage = await fetchJson(`${BASE_URL}/wp-json/wp/v2/media?per_page=100&page=${page}`);
    if (!mediaPage || !Array.isArray(mediaPage) || mediaPage.length === 0) break;
    allMedia = allMedia.concat(mediaPage);
    if (mediaPage.length < 100) break;
    page++;
  }
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "api-dumps/all-media.json"),
    JSON.stringify(allMedia, null, 2),
    "utf8",
  );
  console.log(`Saved ${allMedia.length} media metadata items.`);

  // 7. Crawl & Dump all HTML Pages
  const targetUrls = [
    // Core Navigation & Pages
    { path: "/", slug: "home" },
    { path: "/aboutourclub/", slug: "aboutourclub" },
    { path: "/garden-walk/", slug: "garden-walk" },
    { path: "/gallery/", slug: "gallery" },
    { path: "/becomeamember/", slug: "becomeamember" },
    { path: "/membership/", slug: "membership" },
    { path: "/events/", slug: "events" },
    { path: "/events/month/", slug: "events-month" },
    { path: "/events/list/", slug: "events-list" },
    { path: "/events/day/", slug: "events-day" },
    { path: "/events-looped/", slug: "events-looped" },
    // Auth & Member Portal
    { path: "/login/", slug: "login" },
    { path: "/members/", slug: "members" },
    { path: "/user/", slug: "user" },
    { path: "/account/", slug: "account" },
    { path: "/password-reset/", slug: "password-reset" },
    // Dues, Checkout, Stripe, Tickets
    { path: "/tickets-checkout/", slug: "tickets-checkout" },
    { path: "/tickets-order/", slug: "tickets-order" },
    { path: "/checkout/", slug: "checkout" },
    { path: "/stripe/", slug: "stripe" },
    { path: "/customer-portal/", slug: "customer-portal" },
    { path: "/payment-successful/", slug: "payment-successful" },
    { path: "/payment-cancelled/", slug: "payment-cancelled" },
    { path: "/already-subscribed/", slug: "already-subscribed" },
    { path: "/subscription-cancellation/", slug: "subscription-cancellation" },
    // Event Categories
    { path: "/events/category/monthly-board-meeting/", slug: "cat-monthly-board-meeting" },
    { path: "/events/category/workshops/", slug: "cat-workshops" },
    { path: "/events/category/garden-walk/", slug: "cat-garden-walk" },
    // Individual Events
    { path: "/event/holiday-party/", slug: "event-holiday-party" },
    { path: "/event/board-meeting-23/", slug: "event-board-meeting-23" },
    { path: "/event/potluck-at-fenn-valley-winery/", slug: "event-potluck-at-fenn-valley-winery" },
  ];

  console.log(`7. Fetching and saving HTML for ${targetUrls.length} pages...`);
  const pageAuditSummary = [];

  for (const target of targetUrls) {
    const fullUrl = `${BASE_URL}${target.path}`;
    console.log(`Fetching ${fullUrl}...`);
    const html = await fetchText(fullUrl);
    if (html) {
      fs.writeFileSync(path.join(OUTPUT_DIR, `pages-html/${target.slug}.html`), html, "utf8");

      // Analyze page features
      const hasForms = /<form/i.test(html);
      const formActions = [...html.matchAll(/<form[^>]*action=["']([^"']*)["']/gi)].map(
        (m) => m[1],
      );
      const inputs = [
        ...html.matchAll(/<input[^>]*name=["']([^"']*)["'][^>]*type=["']?([^"'\s>]*)["']?/gi),
      ].map((m) => ({ name: m[1], type: m[2] }));
      const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
      const pageTitle = titleMatch ? titleMatch[1].trim() : "";
      const scripts = [...html.matchAll(/<script[^>]*src=["']([^"']*)["']/gi)].map((m) => m[1]);
      const iframes = [...html.matchAll(/<iframe[^>]*src=["']([^"']*)["']/gi)].map((m) => m[1]);

      pageAuditSummary.push({
        url: fullUrl,
        slug: target.slug,
        title: pageTitle,
        hasForms,
        formActions,
        inputsCount: inputs.length,
        inputs: inputs.slice(0, 15),
        scriptsCount: scripts.length,
        iframes,
        bodyLength: html.length,
      });
    }
  }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "crawl-summary.json"),
    JSON.stringify(pageAuditSummary, null, 2),
    "utf8",
  );

  console.log("=== Crawl Completed Successfully! ===");
  console.log(`Summary written to ${path.join(OUTPUT_DIR, "crawl-summary.json")}`);
}

main().catch((err) => {
  console.error("Fatal crawl error:", err);
  process.exit(1);
});
