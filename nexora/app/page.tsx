import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"

import { landingContent, type LandingFeature } from "@/app/_data/landing"
import { Button } from "@/components/ui/button"

const featureIcons: Record<LandingFeature["id"], ReactNode> = {
  canvas: (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" className="stroke-current" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" className="stroke-current" />
      <path d="M10.5 7h3M17 10.5v3" className="stroke-current" strokeLinecap="round" />
    </svg>
  ),
  docs: (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
      <path d="M7 3.5h7.5L19.5 8v12a.5.5 0 0 1-.5.5H7a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5Z" className="stroke-current" />
      <path d="M14.5 3.5V8H19" className="stroke-current" />
      <path d="M9 11.5h6M9 14.5h6M9 17.5h4" className="stroke-current" strokeLinecap="round" />
    </svg>
  ),
  "team-board": (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" className="stroke-current" />
      <path d="M9 4.5v15M15 4.5v15" className="stroke-current" />
      <rect x="5.5" y="7" width="2" height="4" rx="1" className="fill-current" />
      <rect x="11" y="8" width="2" height="4" rx="1" className="fill-current" />
      <rect x="16.5" y="10" width="2" height="4" rx="1" className="fill-current" />
    </svg>
  ),
}

function SurfaceMock({ id }: { id: LandingFeature["id"] }) {
  const frame =
    "overflow-hidden rounded-2xl border border-border/70 bg-[#111216]/95 shadow-[0_22px_60px_-26px_rgba(0,0,0,0.75)]"

  const chrome = (
    <div className="flex items-center gap-1.5 border-b border-border/70 px-4 py-2.5">
      <span className="size-2 rounded-full bg-muted" />
      <span className="size-2 rounded-full bg-muted" />
      <span className="size-2 rounded-full bg-muted" />
    </div>
  )

  if (id === "canvas") {
    return (
      <div className={frame}>
        {chrome}
        <div className="relative aspect-4/3 w-full bg-[#12131a] p-6">
          <div className="mx-auto w-44 rounded-full border border-primary/80 bg-primary/18 px-5 py-2 text-center text-sm font-semibold text-foreground">
            Request
          </div>

          <div className="mx-auto h-7 w-px bg-muted-foreground/60" />

          <div className="mx-auto flex h-20 w-20 items-center justify-center text-sm text-foreground">
            <div className="flex size-16 rotate-45 items-center justify-center border border-border/80 bg-background/45">
              <span className="-rotate-45 text-lg font-medium">Authed?</span>
            </div>
          </div>

          <div className="mx-auto h-5 w-px bg-muted-foreground/60" />

          <div className="mx-auto mt-1 w-[94%]">
            <div className="relative h-11">
              <div className="absolute top-2 right-0 left-0 h-px bg-muted-foreground/60" />
              <span className="absolute top-4 left-0 text-xs text-muted-foreground">yes</span>
              <span className="absolute top-4 right-0 text-xs text-muted-foreground">no</span>

              <div className="grid h-full grid-cols-2 gap-4">
                <div className="relative">
                  <div className="absolute top-2 left-1/2 h-6 w-px -translate-x-1/2 bg-muted-foreground/55" />
                </div>
                <div className="relative">
                  <div className="absolute top-2 left-1/2 h-6 w-px -translate-x-1/2 bg-muted-foreground/55" />
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto grid w-[94%] grid-cols-2 gap-4">
            <div className="rounded-xl border border-border/80 bg-background/45 px-3 py-3 text-center font-mono text-[0.95rem]">
              Load workspace
            </div>
            <div className="rounded-xl border border-border/80 bg-background/45 px-3 py-3 text-center font-mono text-[0.95rem]">
              Redirect to sign in
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (id === "docs") {
    return (
      <div className={frame}>
        {chrome}
        <div className="aspect-4/3 w-full bg-[#12131a] p-4">
          <div className="mb-4 h-6 w-2/3 rounded-md bg-foreground/85" />

          <div className="space-y-2">
            <div className="h-2 w-full rounded bg-muted/70" />
            <div className="h-2 w-11/12 rounded bg-muted/70" />
            <div className="h-2 w-10/12 rounded bg-muted/70" />
            <div className="h-2 w-9/12 rounded bg-muted/70" />
          </div>

          <div className="my-4 h-px w-full bg-border/70" />

          <div className="rounded-xl border border-primary/40 bg-primary/10 p-3">
            <p className="mb-2 font-mono text-[0.7rem] tracking-wide text-primary uppercase">
              Agent summary
            </p>
            <div className="space-y-2">
              <div className="h-2.5 w-full rounded bg-primary/55" />
              <div className="h-2.5 w-4/5 rounded bg-primary/45" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={frame}>
      {chrome}
      <div className="relative aspect-4/3 w-full bg-[#12131a] p-4">
        <div className="grid h-full grid-cols-3 gap-3">
          {["Planning", "In progress", "Done"].map((column) => (
            <div key={column} className="rounded-xl border border-border/80 bg-background/40 p-2">
              <div className="mb-2 text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
                {column}
              </div>
              <div className="space-y-2">
                <div className="rounded-lg border border-border/70 bg-background/55 p-2 text-[0.7rem] text-foreground/95">
                  {column === "Planning" ? "Onboarding flow" : column === "In progress" ? "API architecture" : "Brand brief"}
                </div>
                <div className="rounded-lg border border-border/70 bg-background/55 p-2 text-[0.7rem] text-foreground/95">
                  {column === "Planning" ? "Billing ERD" : column === "In progress" ? "Launch spec" : "Docs polish"}
                </div>
              </div>
            </div>
          ))}
        </div>

        <span className="absolute top-26 left-38 rounded-md border border-primary/50 bg-primary px-2 py-0.5 text-[0.65rem] font-medium text-primary-foreground">
          Maya
        </span>
        <span className="absolute right-11 bottom-13 rounded-md border border-primary/50 bg-primary px-2 py-0.5 text-[0.65rem] font-medium text-primary-foreground">
          Dev
        </span>
      </div>
    </div>
  )
}

export default function Home() {
  const { hero, audience, features, howItWorks, pricing, closingCta, footer } = landingContent

  return (
    <main className="topo-bg">
      <section className="mx-auto flex min-h-[78vh] w-full max-w-5xl flex-col items-center justify-center px-6 py-24 text-center sm:px-8">
        <p className="mb-6 inline-flex items-center gap-2 font-mono text-[0.7rem] tracking-[0.18em] text-muted-foreground uppercase">
          <span
            aria-hidden
            className="size-2 rotate-45 rounded-[1px] bg-primary"
          />
          {hero.eyebrow}
        </p>

        <h1 className="max-w-4xl text-balance text-4xl leading-tight font-semibold sm:text-5xl md:text-6xl">
          {hero.titleStart} <span className="text-primary">{hero.titleHighlight}</span>{" "}
          {hero.titleEnd}
        </h1>

        <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          {hero.subtitle}
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href={hero.primaryCta.href}>{hero.primaryCta.label}</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
            <Link href={hero.secondaryCta.href}>{hero.secondaryCta.label}</Link>
          </Button>
        </div>

        <div className="survey-frame scroll-tilt mt-14 w-full max-w-5xl">
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/70 shadow-[0_18px_60px_-26px_oklch(0.74_0.16_55/0.55)] backdrop-blur-sm">
            <video
              className="block h-auto w-full object-contain"
              autoPlay
              muted
              loop
              playsInline
              poster={hero.video.poster}
            >
              {hero.video.sources.map((source) => (
                <source key={source.src} src={source.src} type={source.type} />
              ))}
            </video>
          </div>
        </div>

        <div className="mt-12 flex w-full max-w-4xl flex-wrap items-center justify-center gap-2 rounded-2xl border border-border/70 bg-card/65 p-3 text-sm">
          <span className="mr-1 font-medium text-muted-foreground">{audience.label}:</span>
          {audience.groups.map((group) => (
            <span
              key={group}
              className="rounded-full border border-border/80 bg-background/70 px-3 py-1 text-xs text-foreground/90 sm:text-sm"
            >
              {group}
            </span>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto w-full max-w-6xl px-6 pb-24 sm:px-8">
        <h2 className="max-w-3xl text-balance text-3xl leading-tight font-semibold sm:text-4xl">
          {features.heading}
        </h2>

        <div className="mt-12 space-y-14">
          {features.surfaces.map((surface, index) => {
            const textOrder = index % 2 === 0 ? "md:order-1" : "md:order-2"
            const mockOrder = index % 2 === 0 ? "md:order-2" : "md:order-1"

            return (
              <article key={surface.id} className="grid gap-8 md:grid-cols-2 md:items-center">
                <div className={textOrder}>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/75 px-3 py-1.5 text-sm font-medium">
                    <span className="text-primary">{featureIcons[surface.id]}</span>
                    {surface.title}
                  </div>
                  <p className="text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                    {surface.description}
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-foreground/90 sm:text-base">
                    {surface.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2">
                        <span
                          aria-hidden
                          className="mt-2 size-1.5 shrink-0 rotate-45 rounded-[1px] bg-primary"
                        />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={mockOrder}>
                  <div className="survey-frame">
                    <SurfaceMock id={surface.id} />
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-24 sm:px-8">
        <h2 className="text-3xl leading-tight font-semibold sm:text-4xl">{howItWorks.heading}</h2>

        <div className="relative mt-10 grid gap-4 md:grid-cols-3 md:gap-6">
          <div
            aria-hidden
            className="pointer-events-none absolute top-7 right-[16%] left-[16%] hidden border-t border-dashed border-primary/45 md:block"
          />

          {howItWorks.steps.map((step, index) => (
            <article
              key={step.id}
              className="relative rounded-2xl border border-border/70 bg-card/70 p-5 backdrop-blur-sm"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="inline-flex size-8 items-center justify-center rounded-full border border-primary/50 bg-primary/15 text-sm font-semibold text-primary">
                  {index + 1}
                </span>
                <h3 className="text-lg font-semibold">{step.title}</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-24 sm:px-8">
        <div className="rounded-3xl border border-border/70 bg-card/75 p-8 sm:p-10">
          <h2 className="text-3xl leading-tight font-semibold sm:text-4xl">{pricing.heading}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{pricing.subtitle}</p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-foreground/90 sm:text-base">
            {pricing.placeholder}
          </p>
        </div>
      </section>

      <section className="topo-bg border-y border-border/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 py-16 text-center sm:px-8 md:flex-row md:justify-between md:text-left">
          <div className="max-w-2xl">
            <h2 className="text-balance text-3xl leading-tight font-semibold sm:text-4xl">
              {closingCta.heading}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {closingCta.description}
            </p>
            <div className="mt-6">
              <Button asChild size="lg">
                <Link href={closingCta.button.href}>{closingCta.button.label}</Link>
              </Button>
            </div>
          </div>

          <div className="survey-frame">
            <div className="rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur-sm">
              <Image
                src={closingCta.mascotSrc}
                alt={closingCta.mascotAlt}
                width={220}
                height={220}
                className="h-auto w-36 sm:w-44"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-sm text-muted-foreground sm:px-8">
        {footer.madeBy}
      </footer>
    </main>
  )
}
