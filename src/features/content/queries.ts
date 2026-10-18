import { createClient } from "@/lib/supabase/server";
import { CLUB_TIMEZONE } from "@/features/events/calendar";
import type { EventSummary } from "@/features/events/types";
import type { PageContent } from "./types";

export async function getAboutPageContent(): Promise<PageContent | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pages")
    .select("slug, title, content, meta_description")
    .in("slug", ["about", "aboutourclub"])
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    slug: "about",
    title: data.title || "About Our Club",
    subtitle:
      data.meta_description ||
      "Civic beautification, education, scholarships, and friendship since 1928 across Saugatuck and Douglas, Michigan.",
    sections: [
      {
        id: "our-story",
        heading: "Our Story & Purpose",
        body: [
          data.content ||
            "For nearly a century, since 1928, the Saugatuck Douglas Garden Club has united plant lovers, Master Gardeners, and community volunteers dedicated to enhancing our shared public spaces.",
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
          "High School Scholarships: Our highest fundraising priority. Since 2023, the club awards two $3,000 annual scholarships to local graduating high school seniors pursuing higher education at accredited colleges or universities.",
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

export async function getHomePageContent(): Promise<PageContent | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pages")
    .select("slug, title, content, meta_description")
    .eq("slug", "home")
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    slug: "home",
    title: data.title || "Saugatuck Douglas Garden Club",
    subtitle:
      data.meta_description ||
      "Cultivating civic landscaping, horticultural education, and lakeshore community spirit.",
    sections: [
      {
        id: "civic-landscaping",
        heading: "Civic Beautification & Public Gardens",
        body: data.content
          ? [data.content]
          : [
              "For nearly a century since 1928, the Saugatuck Douglas Garden Club has planned, planted, and maintained vibrant public floral displays throughout Saugatuck and Douglas, Michigan.",
              "Our dedicated volunteer members cultivate sidewalk pots, corner bump-outs, civic plazas, and library gardens that welcome residents and visitors across the lakeshore.",
            ],
        callToAction: {
          label: "Explore Community Beautification",
          href: "/about#community-beautification",
        },
      },
      {
        id: "garden-walk-feature",
        heading: "The Annual Garden Walk Fundraiser",
        body: [
          "Every summer, our signature Garden Walk invites the public to tour exquisite private sanctuaries and innovative coastal gardens throughout our historic twin cities.",
          "Proceeds directly fund academic scholarships for local Allegan County graduating high school seniors and community beautification plantings.",
        ],
        callToAction: {
          label: "Discover the Garden Walk",
          href: "/garden-walk",
        },
      },
    ],
  };
}

export async function getGardenWalkPageContent(): Promise<PageContent | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pages")
    .select("slug, title, content, meta_description")
    .eq("slug", "garden-walk")
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  // Look for the active / upcoming Garden Walk event
  const nowIso = new Date().toISOString();
  let { data: eventData } = await supabase
    .from("events")
    .select(
      `
      id,
      slug,
      title,
      description,
      starts_at,
      ends_at,
      timezone,
      all_day,
      status,
      category,
      ticket_url,
      venues (
        name,
        address,
        city,
        state,
        postal_code
      )
    `,
    )
    .or("category.eq.Garden Walk,slug.ilike.%garden-walk%")
    .eq("status", "published")
    .gte("ends_at", nowIso)
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!eventData) {
    const { data: recentEvent } = await supabase
      .from("events")
      .select(
        `
        id,
        slug,
        title,
        description,
        starts_at,
        ends_at,
        timezone,
        all_day,
        status,
        category,
        ticket_url,
        venues (
          name,
          address,
          city,
          state,
          postal_code
        )
      `,
      )
      .or("category.eq.Garden Walk,slug.ilike.%garden-walk%")
      .eq("status", "published")
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    eventData = recentEvent;
  }

  let eventSummary: EventSummary | undefined;
  if (eventData) {
    const venue = eventData.venues as {
      name: string;
      address: string | null;
      city: string | null;
      state: string | null;
      postal_code: string | null;
    } | null;
    const fullAddress = venue
      ? [venue.address, venue.city, venue.state, venue.postal_code].filter(Boolean).join(", ")
      : undefined;

    const startsDate = new Date(eventData.starts_at);
    const endsDate = eventData.ends_at ? new Date(eventData.ends_at) : startsDate;
    const now = new Date();

    eventSummary = {
      id: eventData.id,
      slug: eventData.slug,
      title: eventData.title,
      description: eventData.description || "",
      startsAt: eventData.starts_at,
      endsAt: eventData.ends_at,
      timezone: eventData.timezone || CLUB_TIMEZONE,
      allDay: Boolean(eventData.all_day),
      category: eventData.category || "Garden Walk",
      venueName: venue?.name || "Old School House Douglas",
      venueAddress: fullAddress,
      ticketUrl: eventData.ticket_url || undefined,
      isPast: endsDate < now,
    };
  }

  return {
    slug: "garden-walk",
    title: data.title || "Annual Garden Walk",
    subtitle:
      data.meta_description ||
      "Explore the annual Saugatuck Douglas Garden Walk: tour exquisite private gardens and support local community beautification and scholarships.",
    event: eventSummary,
    sections: [
      {
        id: "tour-details",
        heading: "Tour Details & Garden Highlights",
        body: [
          data.content ||
            "The Garden Walk is the club's premier annual fundraising event. For over four decades, local gardeners open their private landscapes to the public, sharing ideas and inspiration.",
          "Self-guided walking and driving routes begin at the Old School House in Douglas, featuring diverse shade sanctuaries, native pollinator habitats, and historic cottage borders.",
        ],
        callToAction: {
          label: "View Events & Dates",
          href: "/events",
        },
      },
    ],
  };
}
