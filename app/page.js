import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  BarChart3,
  BriefcaseBusiness,
  Check,
  Ellipsis,
  GraduationCap,
  Link2,
  Mic,
  Phone,
  Play,
  Video,
  Wand2,
  Zap,
} from "lucide-react";
import Logo from "@/components/brand/Logo";

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

const SCORE_PREVIEW = [
  { label: "Technical Skills", value: 8 },
  { label: "Communication", value: 9 },
  { label: "Problem Solving", value: 7 },
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

// Decorative voice waveform heights (px).
const WAVE = [6, 12, 8, 18, 10, 24, 14, 20, 9, 16, 22, 12, 7, 15, 10, 19, 8, 13, 6];

const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff7a1a] to-[#e8590c] font-semibold text-white shadow-lg shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/40";

function Waveform({ className = "" }) {
  return (
    <div className={`flex items-center gap-[3px] ${className}`} aria-hidden="true">
      {WAVE.map((height, index) => (
        <span key={index} className="w-[3px] rounded-full bg-orange-500" style={{ height }} />
      ))}
    </div>
  );
}

function ControlButton({ children, danger = false }) {
  return (
    <span
      className={`flex size-12 items-center justify-center rounded-full ${danger
        ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
        : "border border-slate-200 bg-white text-slate-700 shadow-sm"
        }`}
    >
      {children}
    </span>
  );
}

// Illustration of the product in use (not interactive).
function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[640px]" aria-hidden="true">
      {/* soft peach blobs */}
      <div className="absolute -right-10 -top-16 h-72 w-80 rounded-[45%_55%_40%_60%] bg-[#fddcbf]" />
      <div className="absolute -bottom-12 -left-12 h-60 w-72 rounded-[60%_40%_55%_45%] bg-[#fee6d2]" />

      <div className="relative rounded-[28px] border border-orange-100 bg-white/90 p-5 shadow-2xl shadow-orange-900/10 backdrop-blur">
        <div className="flex items-start justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <span className="size-2.5 rounded-full bg-emerald-500" /> Live Interview
            </p>
            <p className="ml-[18px] text-sm font-semibold text-slate-900">Frontend Developer</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
            <span className="size-1.5 animate-pulse rounded-full bg-red-500" /> REC 04:12
          </span>
        </div>

        <div className="relative mt-4 grid grid-cols-5 gap-3">
          <div className="col-span-2 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-[#fff1e6] to-[#ffe4cf] px-3 pb-14 pt-6">
            <Image src="/Smiling Orange Robot Mascot.png" alt="" width={1312} height={1199} className="h-auto w-[72%]" priority />
            <Waveform className="mt-3" />
          </div>
          <div className="relative col-span-3 overflow-hidden rounded-2xl bg-gradient-to-br from-[#fbe3cf] via-[#f6d2b6] to-[#efc19c]">
            <div className="absolute left-6 top-6 h-24 w-16 rounded-full bg-emerald-700/15 blur-md" />
            <Image
              src="/robot-laptop.png"
              alt=""
              width={1536}
              height={1024}
              className="relative mt-2 h-auto w-full"
              priority
            />
          </div>

          <div className="absolute inset-x-3 bottom-3 flex items-center gap-2.5 rounded-full border border-orange-100 bg-white px-4 py-2.5 shadow-md">
            <AudioLines className="size-4 shrink-0 text-orange-500" />
            <p className="truncate text-[13px] text-slate-700">
              How would you optimize a React application for better performance?
            </p>
          </div>
        </div>

        <div className="mt-4 flex justify-center gap-3">
          <ControlButton><Mic className="size-5" /></ControlButton>
          <ControlButton><Video className="size-5" /></ControlButton>
          <ControlButton><Ellipsis className="size-5" /></ControlButton>
          <ControlButton danger><Phone className="size-5 rotate-[135deg]" /></ControlButton>
        </div>
      </div>

      {/* floating feedback card */}
      <div className="absolute -bottom-8 -right-4 w-60 rounded-2xl border border-orange-100 bg-white p-4 shadow-2xl shadow-orange-900/15 sm:-right-10">
        <p className="text-sm font-semibold text-slate-900">Interview Feedback</p>
        <div className="mt-3 space-y-3">
          {SCORE_PREVIEW.map((score) => (
            <div key={score.label}>
              <div className="flex justify-between text-xs text-slate-600">
                <span>{score.label}</span>
                <span className="font-semibold text-slate-900">{score.value}/10</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-orange-100">
                <div className="h-full rounded-full bg-gradient-to-r from-[#ff7a1a] to-[#e8590c]" style={{ width: `${score.value * 10}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
          <div className="hidden items-center gap-10 text-[15px] font-medium text-slate-800 lg:flex">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="transition-colors hover:text-orange-600">{link.label}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth"
              className="hidden h-11 items-center rounded-xl border border-slate-200 bg-white px-6 text-[15px] font-medium text-slate-800 shadow-sm transition-colors hover:border-orange-200 sm:inline-flex"
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
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 pb-24 pt-10 lg:grid-cols-[1fr_1.1fr] lg:pt-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-600 shadow-sm">
              <AudioLines className="size-4" /> AI-Powered Voice Interviews
            </span>

            <h1 className="mt-8 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-[68px]">
              <span className="text-[#0f172a]">Hire faster.</span>
              <br />
              <span className="text-orange-500">
                Practice{" "}
                <span className="relative inline-block">
                  smarter.
                  <svg viewBox="0 0 200 14" className="absolute -bottom-3 left-0 w-[88%]" aria-hidden="true">
                    <path d="M3 10 C 50 3, 120 2, 197 7" fill="none" stroke="#ea580c" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </span>
              </span>
            </h1>

            <p className="mt-9 max-w-lg text-lg leading-relaxed text-slate-600">
              A single platform for both recruiters and candidates. Conduct or practice realistic voice
              interviews with AI and get instant, detailed feedback.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/auth" className={`${primaryButton} h-14 px-8 text-base`}>
                Get started <ArrowRight className="size-5" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex h-14 items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-7 text-base font-semibold text-slate-900 shadow-sm transition-colors hover:border-orange-200"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-slate-100">
                  <Play className="size-3.5 fill-slate-900" />
                </span>
                See how it works
              </a>
            </div>

            <ul className="mt-9 flex flex-wrap gap-x-7 gap-y-3">
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

          <HeroPreview />
        </div>
      </section>

      {/* Feature strip */}
      <section id="features" className="scroll-mt-24">
        <div className="mx-auto grid max-w-5xl gap-6 px-6 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.label} className="flex items-center justify-center gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white text-orange-500 shadow-md shadow-orange-900/5 ring-1 ring-orange-100">
                <feature.icon className="size-6" />
              </span>
              <span className="text-[17px] font-semibold text-slate-900">{feature.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative scroll-mt-24 py-24">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-60 rounded-[50%] bg-[#fee6d2]" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-56 rounded-[50%] bg-[#fee6d2]" />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="text-center">
            <span className="inline-block rounded-full bg-orange-100 px-5 py-2 text-sm font-bold uppercase tracking-wide text-orange-600">
              How it works
            </span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[#0f172a] sm:text-4xl">
              From job description to scored report
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.title} className="relative rounded-3xl border border-orange-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-xl hover:shadow-orange-900/5">
                <span className="absolute right-8 top-7 text-4xl font-extrabold text-orange-200">0{index + 1}</span>
                <span className="flex size-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <step.icon className="size-5" />
                </span>
                <h3 className="mt-6 text-2xl font-bold text-[#0f172a]">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-slate-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="pb-24">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-2">
          {ROLES.map((role) => (
            <div key={role.id} id={role.id} className="group flex scroll-mt-24 flex-col rounded-3xl border border-orange-100 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-900/5">
              <span className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff7a1a] to-[#e8590c] text-white shadow-lg shadow-orange-500/30">
                <role.icon className="size-6" />
              </span>
              <p className="mt-6 text-sm font-bold uppercase tracking-wide text-orange-600">{role.label}</p>
              <h3 className="mt-1 text-2xl font-bold text-[#0f172a]">{role.title}</h3>
              <ul className="mt-6 flex-1 space-y-3">
                {role.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-slate-600">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-100">
                      <Check className="size-3 text-orange-600" strokeWidth={3} />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
              <Link href={role.href} className="mt-8 inline-flex items-center gap-1.5 font-semibold text-orange-600 transition-colors group-hover:text-orange-700">
                {role.cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24">
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-8 overflow-hidden rounded-[32px] bg-gradient-to-br from-[#ff7a1a] via-[#f26b1c] to-[#e8590c] px-8 py-14 text-white md:flex-row md:justify-between md:px-14">
          <div className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-white/10" />
          <div className="relative max-w-xl text-center md:text-left">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Your next interview starts here</h2>
            <p className="mt-3 text-orange-50">Sign in with Google or email and pick your workspace. It takes less than a minute.</p>
            <Link href="/auth" className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 font-semibold text-orange-600 shadow-lg transition-transform hover:scale-[1.02]">
              Get started <ArrowRight className="size-5" />
            </Link>
          </div>
          <Image src="/Smiling Orange Robot Mascot.png" alt="" width={1312} height={1199} className="relative h-auto w-44 drop-shadow-2xl md:w-56" />
        </div>
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
