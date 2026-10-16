import fs from "node:fs";

const pages = JSON.parse(fs.readFileSync("imports/live-crawl/api-dumps/wp-pages.json", "utf8"));
const events = JSON.parse(fs.readFileSync("imports/live-crawl/api-dumps/tec-events.json", "utf8"));
const media = JSON.parse(fs.readFileSync("imports/live-crawl/api-dumps/all-media.json", "utf8"));

console.log("=== Pages Discovered ===");
pages.forEach((p) => {
  console.log(`- ${p.title.rendered} (/${p.slug}/, ID: ${p.id})`);
});

const becomeAMember = pages.find((p) => p.slug === "becomeamember");
if (becomeAMember) {
  const matches = becomeAMember.content.rendered.matchAll(/data-key="([^"]+)"/g);
  const fields = new Set();
  for (const m of matches) {
    fields.add(m[1]);
  }
  console.log("\n=== Ultimate Member Registration Fields in becomeamember ===");
  console.log(Array.from(fields));

  // Check choices for project checkboxes
  const labels = [
    ...becomeAMember.content.rendered.matchAll(
      /<span class="um-field-checkbox-option">([^<]+)<\/span>/g,
    ),
  ].map((x) => x[1].trim());
  console.log("\n=== Form Checkbox Options ===");
  console.log(labels);
}

const membersPage = pages.find((p) => p.slug === "members");
if (membersPage) {
  console.log("\n=== Members Page (/members/) Content ===");
  console.log(membersPage.content.rendered.slice(0, 1500));
}

const membershipPage = pages.find((p) => p.slug === "membership");
if (membershipPage) {
  console.log("\n=== Membership Page (/membership/) Content ===");
  console.log(membershipPage.content.rendered.slice(0, 1500));
}

console.log(`\n=== Total Media Items in Catalog: ${media.length} ===`);
console.log(`=== Total TEC Events in Catalog: ${events.events?.length || 0} ===`);
if (events.events) {
  events.events.forEach((e) => {
    console.log(
      `- ${e.title} (${e.start_date} -> ${e.end_date}, Venue: ${e.venue?.venue || "N/A"})`,
    );
  });
}
