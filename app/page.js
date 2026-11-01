import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Check,
  FileText,
  GraduationCap,
  Link2,
  Mic,
  Sparkles,
  Wand2,
} from "lucide-react";

const RECRUITER_POINTS = [
  "Generate role-specific questions from a job description",
  "Share one link — candidates interview on their own time",
  "Get scored reports with a hire recommendation",
];

const CANDIDATE_POINTS = [
  "Practice any role with a realistic AI voice interviewer",
  "Take interviews recruiters invite you to",
  "See detailed feedback and track your progress",
];

const STEPS = [
  {
    icon: Wand2,
    title: "Create",
    text: "Describe the role. AI writes interview questions matched to the job and duration.",
  },
  {
    icon: Mic,
    title: "Interview",
    text: "The AI interviewer runs a natural voice conversation, one question at a time.",
  },
  {
    icon: BarChart3,
    title: "Review",
    text: "Get a scored report on skills, communication and problem solving — instantly.",
  },
];

const SCORE_PREVIEW = [
  { label: "Technical skills", value: 80 },
  { label: "Communication", value: 90 },
  { label: "Problem solving", value: 70 },
];

const primaryCta =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-6 font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40";
const secondaryCta =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50";

function ProductPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-violet-400/30 to-fuchsia-400/30 blur-2xl" />
      <div className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-violet-900/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Live interview</p>
            <p className="font-semibold text-slate-900">Frontend Developer</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
            <span className="size-1.5 animate-pulse rounded-full bg-red-500" /> REC 04:12
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-50 py-6">
            <div className="relative">
              <span className="absolute inset-0 animate-ping rounded-full bg-violet-400 opacity-40" />
              <Image src="/ai.png" alt="" width={56} height={56} className="relative size-14 rounded-full object-cover" />
            </div>
            <p className="text-sm font-medium text-slate-700">AI Recruiter</p>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-50 py-6">
            <div className="flex size-14 items-center justify-center rounded-full bg-violet-600 text-xl font-semibold text-white">A</div>
            <p className="text-sm font-medium text-slate-700">Candidate</p>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <p className="w-fit max-w-[85%] rounded-2xl rounded-tl-sm bg-slate-100 px-3.5 py-2 text-slate-700">
            How does React decide when to re-render a component?
          </p>
          <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-sm bg-violet-600 px-3.5 py-2 text-white">
            When its state or props change, React re-renders it…
          </p>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Feedback report</p>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Recommended</span>
          </div>
          <div className="mt-3 space-y-2.5">
            {SCORE_PREVIEW.map((score) => (
              <div key={score.label}>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{score.label}</span>
                  <span className="font-medium text-slate-700">{score.value / 10}/10</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                    style={{ width: `${score.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleCard({ icon: Icon, label, title, points, cta }) {
  return (
    <div className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-8 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/10">
      <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30">
        <Icon className="size-6" />
      </div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-violet-600">{label}</p>
      <h3 className="mt-1 text-2xl font-bold text-slate-900">{title}</h3>
      <ul className="mt-6 flex-1 space-y-3">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-3 text-slate-600">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-50">
              <Check className="size-3.5 text-emerald-600" strokeWidth={3} />
            </span>
            {point}
          </li>
        ))}
      </ul>
      <Link href="/auth" className="mt-8 inline-flex items-center gap-1.5 font-medium text-violet-600 transition-colors group-hover:text-violet-700">
        {cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/">
            <Image src="/AI Interview Voice Agent Logo.png" alt="AI Interview" width={2172} height={724} priority className="h-auto w-[150px]" />
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#how-it-works" className="hover:text-slate-900">How it works</a>
            <a href="#roles" className="hover:text-slate-900">For recruiters</a>
            <a href="#roles" className="hover:text-slate-900">For candidates</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth" className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:block">Sign in</Link>
            <Link href="/auth" className="inline-flex h-9 items-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800">
              Get started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-100 via-white to-white" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-1 text-sm font-medium text-violet-700 shadow-sm">
              <Sparkles className="size-4" /> Voice interviews, run by AI
            </span>
            <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-6xl">
              Hire faster.{" "}
              <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
                Practice smarter.
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-600">
              One platform for both sides of the interview. Recruiters screen candidates with an AI
              voice interviewer. Candidates rehearse with the same AI and watch their scores climb.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth?role=recruiter" className={primaryCta}>
                <BriefcaseBusiness className="size-5" /> I’m hiring
              </Link>
              <Link href="/auth?role=candidate" className={secondaryCta}>
                <GraduationCap className="size-5" /> I’m preparing for interviews
              </Link>
            </div>
          </div>

          <ProductPreview />
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-16 border-y border-slate-100 bg-slate-50/60 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">How it works</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              From job description to scored report
            </h2>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.title} className="relative rounded-2xl border border-slate-200 bg-white p-7">
                <span className="absolute right-6 top-6 text-5xl font-bold text-slate-100">0{index + 1}</span>
                <div className="relative flex size-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <step.icon className="size-5" />
                </div>
                <h3 className="relative mt-5 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="relative mt-2 text-slate-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="scroll-mt-16 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">Built for both sides</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              A workspace for every role
            </h2>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-2">
            <RoleCard
              icon={BriefcaseBusiness}
              label="Recruiters & HR"
              title="Screen candidates at scale"
              points={RECRUITER_POINTS}
              cta="Start hiring"
            />
            <RoleCard
              icon={GraduationCap}
              label="Candidates"
              title="Walk into interviews prepared"
              points={CANDIDATE_POINTS}
              cta="Start practicing"
            />
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {[
              { icon: Link2, text: "Shareable interview links" },
              { icon: FileText, text: "Scored feedback reports" },
              { icon: Mic, text: "Natural voice conversations" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-5 py-4 text-sm font-medium text-slate-700">
                <item.icon className="size-5 text-violet-600" />
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-violet-700 via-violet-600 to-fuchsia-500 px-8 py-16 text-center text-white">
          <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-white/10 blur-3xl" />
          <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">Your next interview starts here</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-violet-100">
            Sign in with Google and pick your workspace. It takes less than a minute.
          </p>
          <Link href="/auth" className="relative mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 font-medium text-violet-700 shadow-lg transition-transform hover:scale-[1.02]">
            Get started <ArrowRight className="size-5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} AI Interview. Built with Next.js, Supabase and Vapi.
      </footer>
    </div>
  );
}
