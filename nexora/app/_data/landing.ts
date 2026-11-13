export type LandingFeature = {
  id: "canvas" | "docs" | "team-board"
  title: string
  description: string
  bullets: [string, string, string]
}

export type HowItWorksStep = {
  id: "describe" | "watch" | "iterate"
  title: string
  description: string
}

export const landingContent = {
  hero: {
    eyebrow: "Early access",
    titleStart: "An",
    titleHighlight: "outpost",
    titleEnd: "for whatever you're building",
    subtitle:
      "Nexora gives teams one place to map ideas, shape docs, and ship faster without losing context.",
    primaryCta: {
      label: "Start building free",
      href: "/sign-up",
    },
    secondaryCta: {
      label: "See how it works",
      href: "#how-it-works",
    },
    video: {
      poster: "/videos/hero-poster.jpg",
      sources: [
        { src: "/videos/hero.webm", type: "video/webm" },
        { src: "/videos/hero.mp4", type: "video/mp4" },
      ],
    },
  },
  audience: {
    label: "Who it's for",
    groups: [
      "Product teams",
      "Founders",
      "Solo builders",
      "Agencies",
      "Consultants",
    ],
  },
  features: {
    heading: "one agent, one workspace, your whole team",
    surfaces: [
      {
        id: "canvas",
        title: "Canvas",
        description:
          "An infinite whiteboard where the agent draws flowcharts, ERDs, architecture diagrams and org charts shape by shape, and edits them in place when you ask.",
        bullets: [
          "Drop in a prompt and watch nodes and connectors appear in sequence.",
          "Switch between systems view and team map without redrawing from scratch.",
          "Ask for edits in plain language and the diagram updates in place.",
        ],
      },
      {
        id: "docs",
        title: "Docs",
        description:
          "A block editor where the agent turns a diagram into a written spec, and rewrites or summarizes sections on command.",
        bullets: [
          "Generate outlines straight from canvas structures and relationships.",
          "Rewrite sections for tone, length, or audience in one prompt.",
          "Create concise summaries before handoffs or async reviews.",
        ],
      },
      {
        id: "team-board",
        title: "Team board",
        description:
          "A kanban board of every workspace in your org, with live cursors so teammates can jump in together.",
        bullets: [
          "Track work across all active spaces without tab-hopping.",
          "See teammate presence and movement live while planning.",
          "Pull tasks from docs and canvas directly into execution lanes.",
        ],
      },
    ] satisfies LandingFeature[],
  },
  howItWorks: {
    heading: "how it works",
    steps: [
      {
        id: "describe",
        title: "Describe it",
        description:
          "Tell Nexora what you are trying to build, from rough idea to concrete constraints.",
      },
      {
        id: "watch",
        title: "Watch the agent draw",
        description:
          "The agent maps the system live across canvas and docs so everyone can see the shape of the plan.",
      },
      {
        id: "iterate",
        title: "Keep iterating together",
        description:
          "Refine diagrams, specs, and tasks with your team in one workspace until it is ready to ship.",
      },
    ] satisfies HowItWorksStep[],
  },
  pricing: {
    heading: "pricing",
    subtitle: "Simple pricing is coming soon.",
    placeholder:
      "We are finalizing plans for individuals and teams. Join early access and we will notify you when pricing goes live.",
  },
  closingCta: {
    heading: "Bring your next idea to the outpost",
    description:
      "Start with a prompt, let the agent map the route, and build alongside your team from day one.",
    button: {
      label: "Start building free",
      href: "/sign-up",
    },
    mascotSrc: "/brand/mascot.png",
    mascotAlt: "Nexora mascot",
  },
  footer: {
    madeBy: "© 11 Nov 2026 Sushovan",
  },
}
