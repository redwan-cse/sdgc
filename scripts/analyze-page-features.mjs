import fs from "node:fs";

function extractLinks(html) {
  const matches = html.matchAll(/href=["']([^"']+)["']/g);
  const links = [];
  for (const m of matches) {
    if (
      !m[1].startsWith("#") &&
      !m[1].includes("wp-content/themes") &&
      !m[1].includes("wp-includes")
    ) {
      links.push(m[1]);
    }
  }
  return [...new Set(links)];
}

const pagesToCheck = [
  "membership",
  "checkout",
  "stripe",
  "customer-portal",
  "tickets-checkout",
  "garden-walk",
  "aboutourclub",
  "gallery",
];

for (const slug of pagesToCheck) {
  const filePath = `imports/live-crawl/pages-html/${slug}.html`;
  if (fs.existsSync(filePath)) {
    const html = fs.readFileSync(filePath, "utf8");
    console.log(`\n=================== Page: ${slug} ===================`);
    const links = extractLinks(html);
    console.log("Distinct Links:", links.slice(0, 15));

    // Check for payment buttons, Stripe, PayPal
    const stripeMatches = html.match(/stripe|buy\.stripe\.com|checkout\.stripe\.com/gi);
    if (stripeMatches) {
      console.log("Stripe references found:", stripeMatches.length);
    }
    const paypalMatches = html.match(/paypal/gi);
    if (paypalMatches) {
      console.log("PayPal references found:", paypalMatches.length);
    }

    // Check for iframes or embeds
    const iframes = [...html.matchAll(/<iframe[^>]*src=["']([^"']+)["']/gi)].map((x) => x[1]);
    if (iframes.length > 0) {
      console.log("Iframes:", iframes);
    }
  }
}
