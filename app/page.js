import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  BarChart3,
  BriefcaseBusiness,
  Check,
  Sparkles,
  GraduationCap,
  Link2,
  Mic,
  Play,
  Wand2,
  Zap,
} from "lucide-react";
import Logo from "@/components/brand/Logo";
import LiveInterviewDemo from "@/components/landing/LiveInterviewDemo";
import Reveal from "@/components/landing/Reveal";
import TiltCard from "@/components/landing/TiltCard";
import SpotlightCard from "@/components/landing/SpotlightCard";
import AIThinkingDemo from "@/components/landing/AIThinkingDemo";
import AIPipeline from "@/components/landing/AIPipeline";
import OrbitGraphic from "@/components/landing/OrbitGraphic";

const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#recruiters", label: "For Recruiters" },
  { href: "#candidates", label: "For Candidates" },
  { href: "#features", label: "Features" },
];

const HERO_CHECKS = ["AI voice interviews", "Instant feedback", "Role-specific questions"];

const FEATURES = [
  { icon: Zap, label: "Realistic AI interviews" },
  { icon: BarChart3, label: "Detailed score reports" },
  { icon: Link2, label: "Shareable interview links" },
];

const STEPS = [
  { icon: Wand2, title: "Create", text: "Add a job role or description. Our AI creates role-specific interview questions." },
  { icon: Mic, title: "Interview", text: "Conduct a natural voice interview with our AI — one question at a time." },
  { icon: BarChart3, title: "Review", text: "Get a detailed score report on skills, communication, and problem solving instantly." },
];

// Job roles shown in the scrolling strip.
const MARQUEE_ROLES = [
  "Frontend Developer", "Backend Engineer", "Data Analyst", "Product Manager", "DevOps Engineer",
  "UI/UX Designer", "Data Scientist", "Full Stack Developer", "QA Engineer", "Mobile Developer",
];

const ROLES = [
  {
    id: "recruiters",
    icon: BriefcaseBusiness,
    label: "For Recruiters",
    title: "Screen candidates at scale",
    href: "/auth?role=recruiter",
    cta: "Start hiring",
    points: [
      "Generate role-specific questions from a job description",
      "Invite candidates — they interview on their own time",
      "Ranked candidates with scored reports and transcripts",
    ],
  },
  {
    id: "candidates",
    icon: GraduationCap,
    label: "For Candidates",
    title: "Walk into interviews prepared",
    href: "/auth?role=candidate",
    cta: "Start practicing",
    points: [
      "Practice by topic, by your resume, or any custom role",
      "Question-by-question feedback with model answers",
      "Progress charts that show which skill to work on next",
    ],
  },
];

const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 font-medium text-white shadow-md shadow-orange-500/15 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-500/20";

export default function Home() {
  return (
    // overflow-x-clip (not hidden): "hidden" makes this div a scroll container, which breaks the sticky navbar.
    <div className="min-h-screen overflow-x-clip bg-[#fffaf6] text-slate-900">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-orange-100/70 bg-[#fffaf6]/85 backdrop-blur-md">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" aria-label="AI Interview Labs home">
            <Logo priority />
          </Link>
          <div className="hidden items-center gap-10 text-[15px] font-normal text-slate-500 lg:flex">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="transition-colors hover:text-orange-600">{link.label}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth"
              className="hidden h-11 items-center rounded-full border border-slate-200/80 bg-white/70 px-6 text-[15px] font-normal text-slate-700 transition-colors hover:border-orange-200 sm:inline-flex"
            >
              Sign in
            </Link>
            <Link href="/auth" className={`${primaryButton} h-11 px-6 text-[15px]`}>
              Get started <ArrowRight className="size-4" />
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative">
        {/* simple background animation: soft colour glows slowly drifting across the hero */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="lp-drift-1 absolute -left-24 top-0 size-[520px] rounded-full bg-orange-300/40 blur-[100px]" />
          <div className="lp-drift-2 absolute right-0 top-10 size-[460px] rounded-full bg-amber-200/50 blur-[100px]" />
          <div className="lp-drift-3 absolute bottom-[-10%] left-1/3 size-[420px] rounded-full bg-rose-200/40 blur-[100px]" />
        </div>
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-16 px-6 pb-24 pt-10 lg:grid-cols-[1fr_1.1fr] lg:pt-16">
          <div>
            <span className="lp-fade-up relative inline-flex rounded-full border border-orange-200/70 bg-white/70">
              <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-normal text-orange-600">
                <Sparkles className="lp-twinkle size-4" /> AI-Powered Voice Interviews
              </span>
            </span>

            <h1 style={{ animationDelay: "100ms" }} className="lp-fade-up mt-8 text-5xl font-semibold leading-[1.08] tracking-tight sm:text-6xl lg:text-[60px]">
              <span className="text-slate-800">Hire faster.</span>
              <br />
              <span className="text-orange-500">
                Practice{" "}
                <span className="lp-text-shine relative inline-block">
                  smarter.
                  <svg viewBox="0 0 200 14" className="absolute -bottom-3 left-0 w-[88%]" aria-hidden="true">
                    <path d="M3 10 C 50 3, 120 2, 197 7" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" className="lp-draw" opacity="0.7" />
                  </svg>
                </span>
              </span>
            </h1>

            <p style={{ animationDelay: "250ms" }} className="lp-fade-up mt-9 max-w-lg text-lg leading-relaxed text-slate-500">
              A single platform for both recruiters and candidates. Conduct or practice realistic voice
              interviews with AI and get instant, detailed feedback.
            </p>

            <div style={{ animationDelay: "400ms" }} className="lp-fade-up mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/auth" className={`${primaryButton} h-14 px-8 text-base`}>
                Get started <ArrowRight className="size-5" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex h-14 items-center justify-center gap-3 rounded-full border border-slate-200/80 bg-white/70 px-7 text-base font-normal text-slate-700 transition-colors hover:border-orange-200"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-slate-100">
                  <Play className="size-3.5 fill-slate-600 text-slate-500" />
                </span>
                See how it works
              </a>
            </div>

            <ul style={{ animationDelay: "550ms" }} className="lp-fade-up mt-9 flex flex-wrap gap-x-7 gap-y-3">
              {HERO_CHECKS.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="flex size-5 items-center justify-center rounded-full bg-orange-100">
                    <Check className="size-3 text-orange-600" strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="lp-fade-up" style={{ animationDelay: "200ms" }}>
            <TiltCard>
              <LiveInterviewDemo />
            </TiltCard>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section id="features" className="scroll-mt-24">
        <div className="mx-auto grid max-w-5xl gap-6 px-6 sm:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <Reveal key={feature.label} delay={index * 120} className="group flex items-center justify-center gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white text-orange-500 shadow-md shadow-orange-900/5 ring-1 ring-orange-100 transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-6">
                <feature.icon className="size-6" />
              </span>
              <span className="text-[17px] font-normal text-slate-700">{feature.label}</span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Role marquee */}
      <section className="relative mt-20 overflow-hidden border-y border-orange-100 bg-white/60 py-5" aria-label="Roles you can interview for">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-[#fffaf6] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-[#fffaf6] to-transparent" />
        <div className="lp-marquee flex w-max gap-4">
          {[...MARQUEE_ROLES, ...MARQUEE_ROLES].map((role, index) => (
            <span key={index} className="flex items-center gap-2 whitespace-nowrap rounded-full border border-orange-100 bg-white px-5 py-2 text-sm font-medium text-slate-700 shadow-sm">
              <Sparkles className="size-3.5 text-orange-500" /> {role}
            </span>
          ))}
        </div>
      </section>

      {/* AI thinking demo */}
      <section className="relative mt-24 overflow-hidden bg-[#0b0f1a] py-24">
        <div className="pointer-events-none absolute -left-40 top-0 size-[500px] rounded-full bg-orange-600/20 blur-3xl lp-aurora" />
        <div className="pointer-events-none absolute -right-40 bottom-0 size-[500px] rounded-full bg-violet-600/15 blur-3xl lp-aurora" style={{ animationDelay: "-6s" }} />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="relative mx-auto max-w-6xl px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-sm font-semibold text-orange-300">
              <Sparkles className="size-4" /> Real-time AI evaluation
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Watch the AI <span className="lp-text-shine">think</span>
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              While the candidate speaks, the AI transcribes, spots key skills and scores the answer, live.
            </p>
          </Reveal>
          <Reveal delay={150} className="mt-14">
            <AIThinkingDemo />
          </Reveal>
        </div>
      </section>

      {/* AI pipeline graphic */}
      <section className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute left-1/2 top-1/2 size-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(251,146,60,0.18),transparent_65%)]" />
        <div className="relative mx-auto max-w-6xl px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="inline-block rounded-full bg-orange-100 px-5 py-2 text-xs font-medium uppercase tracking-wide text-orange-600">
              The AI hiring pipeline
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-800 sm:text-4xl">
              From job post to hire, <span className="lp-text-shine">on autopilot</span>
            </h2>
            <p className="mt-4 text-lg text-slate-500">Every step is handled by AI, so recruiters only step in to make the final call.</p>
          </Reveal>
          <Reveal delay={150} className="mt-14">
            <AIPipeline />
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative scroll-mt-24 py-24">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-60 rounded-[50%] bg-[#fee6d2]" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-56 rounded-[50%] bg-[#fee6d2]" />
        <div className="relative mx-auto max-w-6xl px-6">
          <Reveal className="text-center">
            <span className="inline-block rounded-full bg-orange-100 px-5 py-2 text-xs font-medium uppercase tracking-wide text-orange-600">
              How it works
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-800 sm:text-4xl">
              From job description to scored report
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <Reveal key={step.title} delay={index * 150} className="h-full">
                <SpotlightCard className="group h-full rounded-3xl border border-orange-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-xl hover:shadow-orange-900/5">
                <span className="absolute right-8 top-7 text-4xl font-light text-orange-200">0{index + 1}</span>
                <span className="flex size-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500 transition-all duration-300 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white">
                  <step.icon className="size-5" />
                </span>
                <h3 className="mt-6 text-2xl font-semibold text-slate-800">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-slate-500">{step.text}</p>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="pb-24">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-2">
          {ROLES.map((role, index) => (
            <Reveal key={role.id} id={role.id} delay={index * 150} className="group flex scroll-mt-24 flex-col rounded-3xl border border-orange-100 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-900/5">
              <span className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff7a1a] to-[#e8590c] text-white shadow-sm shadow-orange-500/20">
                <role.icon className="size-6" />
              </span>
              <p className="mt-6 text-xs font-medium uppercase tracking-wide text-orange-600">{role.label}</p>
              <h3 className="mt-1 text-2xl font-semibold text-slate-800">{role.title}</h3>
              <ul className="mt-6 flex-1 space-y-3">
                {role.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-slate-500">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-100">
                      <Check className="size-3 text-orange-600" strokeWidth={3} />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
              <Link href={role.href} className="mt-8 inline-flex items-center gap-1.5 font-medium text-orange-600 transition-colors group-hover:text-orange-700">
                {role.cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24">
        <Reveal className="relative mx-auto flex max-w-6xl flex-col items-center gap-8 overflow-hidden rounded-[32px] bg-gradient-to-br from-[#ff7a1a] via-[#f26b1c] to-[#e8590c] px-8 py-14 text-white md:flex-row md:justify-between md:px-14">
          <div className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-white/10" />
          <div className="relative max-w-xl text-center md:text-left">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Your next interview starts here</h2>
            <p className="mt-3 text-orange-50">Sign in with Google or email and pick your workspace. It takes less than a minute.</p>
            <Link href="/auth" className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 font-medium text-orange-600 shadow-md transition-transform hover:scale-[1.02]">
              Get started <ArrowRight className="size-5" />
            </Link>
          </div>
          <OrbitGraphic />
        </Reveal>
      </section>

      <footer className="border-t border-orange-100 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <Logo size="sm" />
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} AI Interview Labs. Built by AkanshaSalwan with Next.js, Supabase and Vapi.</p>
        </div>
      </footer>
    </div>
  );
}
