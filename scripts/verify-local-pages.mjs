async function fullAudit() {
  const routes = [
    { path: "/", expected: "public" },
    { path: "/about", expected: "public" },
    { path: "/garden-walk", expected: "public" },
    { path: "/events", expected: "public" },
    { path: "/events/day", expected: "public" },
    { path: "/events/month", expected: "public" },
    { path: "/gallery", expected: "public" },
    { path: "/contact", expected: "public" },
    { path: "/membership", expected: "public" },
    { path: "/join", expected: "public" },
    { path: "/tickets-checkout", expected: "public" },
    { path: "/login", expected: "public" },
    { path: "/forgot-password", expected: "public" },
    { path: "/reset-password", expected: "public" },
    { path: "/profile", expected: "redirect_or_auth" },
    { path: "/directory", expected: "redirect_or_auth" },
    { path: "/dues", expected: "redirect_or_auth" },
    { path: "/admin", expected: "redirect_or_auth" },
    { path: "/admin/members", expected: "redirect_or_auth" },
    { path: "/admin/dues", expected: "redirect_or_auth" },
    { path: "/admin/events", expected: "redirect_or_auth" },
    { path: "/admin/content", expected: "redirect_or_auth" },
    { path: "/admin/messages", expected: "redirect_or_auth" },
    { path: "/admin/media", expected: "redirect_or_auth" },
    { path: "/admin/settings", expected: "redirect_or_auth" },
  ];

  console.log("=".repeat(70));
  console.log("SAUGATUCK DOUGLAS GARDEN CLUB - COMPLETE ROUTE AUDIT");
  console.log("=".repeat(70));

  let failureCount = 0;

  for (const r of routes) {
    try {
      const res = await fetch(`http://127.0.0.1:3000${r.path}`, { redirect: "manual" });

      // If redirect (e.g. 307 or 302 to /login for protected routes)
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location") || "";
        console.log(`🔒 [${res.status}] ${r.path.padEnd(20)} -> Redirected to: ${location}`);
        continue;
      }

      const html = await res.text();
      const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/s);
      const h1Text = h1Match ? h1Match[1].replace(/<[^>]+>/g, "").trim() : "NO H1";

      if (h1Text === "Page not found" || res.status === 404) {
        console.log(`❌ [${res.status}] ${r.path.padEnd(20)} -> PAGE NOT FOUND (H1: "${h1Text}")`);
        failureCount++;
      } else {
        console.log(`✅ [${res.status}] ${r.path.padEnd(20)} -> H1: "${h1Text}"`);
      }
    } catch (err) {
      console.log(`⚠️ [ERR] ${r.path.padEnd(20)} -> ${err.message}`);
      failureCount++;
    }
  }

  // Also audit sample event detail route
  try {
    const res = await fetch("http://127.0.0.1:3000/event/2027-47th-annual-garden-walk");
    const html = await res.text();
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/s);
    const h1Text = h1Match ? h1Match[1].replace(/<[^>]+>/g, "").trim() : "NO H1";
    if (h1Text === "Page not found" || res.status === 404) {
      console.log(`❌ [${res.status}] /event/...          -> PAGE NOT FOUND`);
      failureCount++;
    } else {
      console.log(`✅ [${res.status}] /event/...          -> H1: "${h1Text}"`);
    }
  } catch (err) {
    console.log(`⚠️ /event/... error: ${err.message}`);
  }

  console.log("=".repeat(70));
  console.log(`TOTAL AUDIT RESULT: ${failureCount} failure(s) found across all routes.`);
  console.log("=".repeat(70));
}

fullAudit();
