import { createClient } from "@/lib/supabase/server";
import type { PageContent } from "./types";

export async function getAboutPageContent(): Promise<PageContent> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pages")
    .select("slug, title, content, meta_description")
    .in("slug", ["about", "aboutourclub"])
    .eq("status", "published")
    .maybeSingle();

  return {
    slug: "about",
    title: data?.title || "About Our Club",
    subtitle:
      data?.meta_description ||
      "Civic beautification, education, scholarships, and friendship since 1980 across Saugatuck and Douglas, Michigan.",
    sections: [
      {
        id: "our-story",
        heading: "Our Story & Purpose",
        body: [
          "For more than four decades, the Saugatuck Douglas Garden Club has united plant lovers, Master Gardeners, and community volunteers dedicated to enhancing our shared public spaces.",
          "We operate as an active 501(c)(3) nonprofit organization welcoming gardeners of all experience levels to foster horticultural education and civic pride.",
        ],
        image: "/images/content/executive-committee.jpeg",
        imageAlt: "Saugatuck Douglas Garden Club Executive Committee",
      },
      {
        id: "fundraisers",
        heading: "Club Fundraisers & Community Plant Sales",
        body: [
          "Garden Walk: Our signature annual event is our primary fundraiser to fund educational scholarships. The public tours six extraordinary local gardens in Saugatuck and Douglas, beginning at the Old School House.",
          "Membership Perennial Plant & Treasure Sale: Club members divide their own hardy perennials, potting and offering them at the Old School House during the Garden Walk for only $5 each or 6 for $25. Members also donate garden treasures, driftwood, and trellises.",
          "Awesome Annuals Sale: Members order premium annuals from Van Til's local greenhouse each February for mid-May pickup, raising over $1,500 each year directly for local youth scholarships.",
        ],
        image: "/images/content/plant-sale-old-schoolhouse.jpeg",
        imageAlt: "Membership Plant Sale at the Old School House in Douglas",
      },
      {
        id: "community-beautification",
        heading: "Community Beautification & Youth Outreach",
        body: [
          "Saugatuck 6th Grade Planting: Each spring, local 6th graders join our club members to plant 42 civic sidewalk pots throughout downtown Saugatuck. The day begins at the SCA with demonstrations on flower varieties and planting techniques, followed by Mayor remarks and celebration.",
          "Douglas Downtown Bump-Outs: The club adopted three prominent corner garden plots in Douglas — in front of City Hall, across Center Street, and at the police station — planting and weeding them all season long.",
          "Saugatuck-Douglas Library Flowers: Beginning every June, club volunteers deliver fresh floral arrangements and potted plants bi-weekly to brighten the library circulation desk.",
        ],
        image: "/images/content/saugatuck-beautification.jpeg",
        imageAlt: "Community beautification planters in downtown Saugatuck",
      },
      {
        id: "garden-awards",
        heading: "Local Garden Recognition Awards",
        body: [
          "Each summer in June, July, and August, the Garden Club presents honors for outstanding landscaping across three categories: Residential, Window Box, and Commercial properties open to public view.",
          "Winners receive a commemorative lawn sign for the month and a $25 gift certificate to Huntree Nursery to encourage ongoing horticultural excellence.",
          "Annual Member Garden Award: Each year our Club President recognizes one outstanding club member's garden sanctuary with a special achievement award.",
        ],
        image: "/images/content/garden-awards-plaque.jpeg",
        imageAlt: "Garden Recognition Award winners plaque",
      },
      {
        id: "annual-programs",
        heading: "Annual Programs & Scholarships",
        body: [
          "High School Scholarships: Our highest fundraising priority. Since 2023, the club awards two $3,000 annual scholarships to local graduating high school seniors pursuing degrees in horticulture, environmental science, botany, or landscape architecture.",
          "6th Grade Holiday Workshop: In winter, students create fresh evergreen centerpieces — taking one home and delivering the second to residents at Grace of Douglas and Golden Orchards nursing facilities.",
          "Charitable Outreach: Our annual Christmas drive provides holiday gifts for families through Christian Neighbors, returning 98% of funding back into Allegan County.",
          "Welcome Back Tea & Spring Programs: Monthly educational lectures, guest speakers, demonstrations, and Arbor Day swags keep our community engaged throughout the gardening year.",
        ],
        image: "/images/content/new-member-gathering.jpeg",
        imageAlt: "Garden Club new member gathering and social program",
        callToAction: {
          label: "Become A Member Today",
          href: "/join",
        },
      },
    ],
  };
}
