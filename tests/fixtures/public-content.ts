import type { PageContent } from "@/features/content/types";
import type { EventSummary } from "@/features/events/types";
import type { MediaItem, AlbumSummary } from "@/features/media/types";
import type { MemberProfile, MembershipSummary } from "@/features/membership/types";

export const FIXTURE_PAGES: Record<"home" | "about" | "gardenWalk", PageContent> = {
  home: {
    slug: "home",
    title: "Saugatuck Douglas Garden Club",
    subtitle: "Growing together in Saugatuck and Douglas, Michigan",
    sections: [
      {
        id: "mission",
        heading: "Cultivating Community & Natural Beauty",
        body: [
          "The Saugatuck Douglas Garden Club brings together neighbors passionate about gardening, civic landscaping, environmental stewardship, and community beautification in southwest Michigan.",
          "Through our volunteer-tended public gardens, educational workshops, youth outreach, and annual events, we help our lakeshore towns blossom in every season.",
        ],
        callToAction: {
          label: "Become A Member",
          href: "/join",
        },
      },
      {
        id: "activities",
        heading: "What We Do",
        body: [
          "From maintaining civic plantings at the library and city parks to awarding community recognition garden honors, our members actively shape the visual charm of Saugatuck and Douglas.",
          "Our signature annual Garden Walk raises critical funds to support horticultural scholarships, school programs, and public floral displays across the lakeshore.",
        ],
        callToAction: {
          label: "Explore About Our Club",
          href: "/about",
        },
      },
    ],
  },
  about: {
    slug: "about",
    title: "About Our Club",
    subtitle: "Civic beautification, education, scholarships, and friendship since 1980",
    sections: [
      {
        id: "history",
        heading: "Our Story & Purpose",
        body: [
          "For more than four decades, the Saugatuck Douglas Garden Club has united plant lovers, Master Gardeners, and community volunteers dedicated to enhancing our shared public spaces.",
          "We operate as an active 501(c)(3) nonprofit organization welcoming gardeners of all experience levels.",
        ],
      },
      {
        id: "programs",
        heading: "Key Club Programs",
        body: [
          "Community Beautification: Planting and maintaining focal gardens at the Douglas Library, Saugatuck waterfront, municipal buildings, and downtown planters.",
          "Youth Education & Workshops: Hands-on gardening workshops for local 6th graders and school gardening initiatives.",
          "Community Garden Recognition Awards: Annual recognition celebrating residential and commercial properties that showcase excellence in local gardening.",
          "Charitable Contributions & Scholarships: Financial scholarships for students studying horticulture, landscape architecture, and environmental sciences.",
        ],
      },
      {
        id: "membership-overview",
        heading: "Join Our Gardening Community",
        body: [
          "Members enjoy monthly workshops, guest lectures from botanical experts, garden tours, seed exchanges, and hands-on civic planting days.",
          "Annual dues are $50 per calendar year and support our civic projects.",
        ],
        callToAction: {
          label: "Join Today",
          href: "/join",
        },
      },
    ],
  },
  gardenWalk: {
    slug: "garden-walk",
    title: "Annual Garden Walk",
    subtitle: "Tour extraordinary private and public gardens across Saugatuck and Douglas",
    sections: [
      {
        id: "current-walk",
        heading: "2026 Garden Walk Fundraiser",
        body: [
          "Join us on Saturday, July 11, 2026, from 10:00 AM to 4:00 PM for the premier lakeshore garden event of the summer.",
          "Experience an exclusive self-guided tour through six exceptional private garden sanctuaries and vibrant community plantings, showcasing cottage perennials, native pollinators, water features, and creative landscape design.",
          "Tickets are $20 in advance and $25 on the day of the event. All proceeds benefit SDGC community beautification projects and youth educational scholarships.",
        ],
        callToAction: {
          label: "View Event Details & Tickets",
          href: "/event/2026-garden-walk-fundraiser",
        },
      },
      {
        id: "archive",
        heading: "A Tradition of Inspiring Gardens",
        body: [
          "Every year, generous homeowners open their gates to share their creative horticultural passion with garden enthusiasts from across Michigan and beyond.",
          "Browse our photo galleries below to view highlights from past garden walks.",
        ],
        callToAction: {
          label: "View Garden Walk Gallery",
          href: "/gallery",
        },
      },
    ],
  },
};

export const FIXTURE_EVENTS: EventSummary[] = [
  {
    id: "evt-2026-gw",
    slug: "2026-garden-walk-fundraiser",
    title: "2026 Garden Walk Fundraiser",
    description:
      "Self-guided tour of six stunning private gardens and public plantings in Saugatuck and Douglas. Proceeds support community beautification and horticultural scholarships.",
    startsAt: "2026-07-11T10:00:00-04:00",
    endsAt: "2026-07-11T16:00:00-04:00",
    timezone: "America/Detroit",
    allDay: false,
    venueName: "Saugatuck Douglas Gardens Tour Hub",
    venueAddress: "P.O. Box 1011, Douglas, MI 49406",
    ticketUrl: "/event/2026-garden-walk-fundraiser#tickets",
    category: "Fundraiser",
  },
  {
    id: "evt-spring-sale",
    slug: "spring-plant-exchange-sale",
    title: "Spring Plant Exchange & Sale",
    description:
      "Share extra perennials, seeds, and division plants with fellow members and neighbors. Master Gardeners on site for consultation.",
    startsAt: "2026-05-16T09:00:00-04:00",
    endsAt: "2026-05-16T13:00:00-04:00",
    timezone: "America/Detroit",
    allDay: false,
    venueName: "Douglas Library Community Garden",
    venueAddress: "Center Street, Douglas, MI 49406",
    category: "Club Event",
  },
  {
    id: "evt-monthly-june",
    slug: "monthly-meeting-native-pollinators",
    title: "Monthly Meeting: Native Michigan Pollinators",
    description:
      "Educational presentation by Michigan State University Extension specialist on supporting native bees, monarchs, and hummingbirds.",
    startsAt: "2026-06-03T18:30:00-04:00",
    endsAt: "2026-06-03T20:30:00-04:00",
    timezone: "America/Detroit",
    allDay: false,
    venueName: "Saugatuck Center for the Arts",
    venueAddress: "400 Culver St, Saugatuck, MI 49453",
    category: "Meeting",
  },
  {
    id: "evt-civic-planting",
    slug: "downtown-planters-planting-day",
    title: "Downtown Civic Planters Volunteer Day",
    description:
      "Annual planting of flower boxes and municipal hanging baskets throughout downtown Saugatuck and Douglas.",
    startsAt: "2026-05-23T08:00:00-04:00",
    endsAt: "2026-05-23T12:00:00-04:00",
    timezone: "America/Detroit",
    allDay: false,
    venueName: "Saugatuck City Hall Plaza",
    venueAddress: "102 Butler St, Saugatuck, MI 49453",
    category: "Volunteer",
  },
  {
    id: "evt-past-awards",
    slug: "2025-annual-garden-awards-reception",
    title: "Annual Garden Awards Reception",
    description: "Celebration honoring our 2025 residential and commercial garden award winners.",
    startsAt: "2025-09-18T18:00:00-04:00",
    endsAt: "2025-09-18T20:00:00-04:00",
    timezone: "America/Detroit",
    allDay: false,
    venueName: "Douglas Old School House",
    venueAddress: "130 Center St, Douglas, MI 49406",
    isPast: true,
    category: "Awards",
  },
];

export const FIXTURE_ALBUMS: AlbumSummary[] = [
  {
    id: "alb-garden-walk",
    slug: "garden-walk-highlights",
    title: "Garden Walk Highlights",
    description: "Memories and blooming landscapes from recent Garden Walks",
    year: 2025,
    itemCount: 4,
  },
  {
    id: "alb-beautification",
    slug: "community-beautification",
    title: "Community Beautification",
    description: "Volunteer projects at the library, city hall, and waterfront parks",
    year: 2025,
    itemCount: 3,
  },
];

export const FIXTURE_MEDIA: MediaItem[] = [
  {
    id: "med-1",
    src: "/images/gallery/garden-walk-2025.jpeg",
    width: 600,
    height: 450,
    alt: "Saugatuck Douglas Garden Walk flower bed and private garden showcase",
    caption: "Lush perennial cottage border on the Garden Walk.",
    albumId: "alb-garden-walk",
    year: 2025,
    order: 1,
  },
  {
    id: "med-2",
    src: "/images/gallery/garden-walk-tourists.jpeg",
    width: 600,
    height: 450,
    alt: "Visitors touring private garden during Saugatuck Douglas Garden Walk",
    caption: "Garden Walk attendees enjoying private landscapes in Saugatuck and Douglas.",
    albumId: "alb-garden-walk",
    year: 2025,
    order: 2,
  },
  {
    id: "med-3",
    src: "/images/gallery/community-beautification-pots.jpeg",
    width: 600,
    height: 450,
    alt: "Douglas Library and civic entrance plantings with colorful hydrangeas and hostas",
    caption: "Community plantings maintained by SDGC volunteers at Douglas Library.",
    albumId: "alb-beautification",
    year: 2025,
    order: 3,
  },
  {
    id: "med-4",
    src: "/images/gallery/downtown-planters.jpeg",
    width: 600,
    height: 450,
    alt: "Waterfront public planter overflowing with trailing petunias and sweet potato vine",
    caption: "Downtown Saugatuck street planters planted by club volunteers.",
    albumId: "alb-beautification",
    year: 2025,
    order: 4,
  },
];

export const FIXTURE_MEMBER: MemberProfile = {
  userId: "usr-synthetic-member",
  username: "daisy_miller",
  firstName: "Daisy",
  lastName: "Miller",
  email: "daisy.miller@example.com",
  phoneHome: "269-555-0123",
  phoneCell: "269-555-0199",
  addressLine1: "123 Center Street",
  addressLine2: "Apt 2B",
  city: "Douglas",
  state: "MI",
  zipCode: "49406",
  birthMonth: 5,
  birthDay: 18,
  spouseFirstName: "Robert",
  masterGardener: true,
  interestsExperience:
    "Perennial borders, native Michigan pollinator plants, and garden photography.",
  projectInterests: ["community_beautification", "garden_walk_fundraiser"],
  createdAt: "2026-01-10T14:00:00Z",
};

export const FIXTURE_MEMBERSHIP: MembershipSummary = {
  id: "mem-synthetic-2026",
  userId: "usr-synthetic-member",
  year: 2026,
  duesCents: 5000,
  currency: "USD",
  applicationStatus: "pending",
  paymentStatus: "confirmed",
  paymentMethod: "credit_card",
  isApproved: false,
  isSuspended: false,
  isActive: false,
};
