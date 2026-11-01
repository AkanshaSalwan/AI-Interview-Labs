'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeftRight, ArrowRight, BarChart3, BriefcaseBusiness, Check, Eye, EyeOff, Loader2, Lock, Mail, Target, UserRound, Zap } from 'lucide-react';
import { createClient } from '@/services/supabaseClient.js';
import { ROLES, canAccess, homeForRole, safeNextPath } from '@/services/roles';
import { RECRUITER_NOT_APPROVED_NOTICE, saveRoleOrFallBackToCandidate } from '@/services/userProfile';
import { cn } from '@/lib/utils';
import Logo from '@/components/brand/Logo';

const ERROR_MESSAGES = {
  login_failed: 'We couldn’t complete your sign-in. Please try again.',
  missing_code: 'The sign-in link was incomplete. Please try again.',
};

const ROLE_STORAGE_KEY = 'ai-interview:last-role';

const ROLE_CHOICES = [
  { value: ROLES.CANDIDATE, label: 'Candidate', hint: 'Practice & take interviews', icon: UserRound },
  { value: ROLES.RECRUITER, label: 'Recruiter', hint: 'Approved accounts only', icon: BriefcaseBusiness },
];

const HIGHLIGHTS = [
  { icon: Zap, title: 'Natural voice interviews', text: 'run by an AI interviewer' },
  { icon: BarChart3, title: 'Instant scored reports', text: 'with strengths and gaps' },
  { icon: Target, title: 'Practice mode', text: 'to track your improvement' },
];

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.92l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.29 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.28a12 12 0 0 0 0 10.76l4.01-3.1Z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.28 6.62l4.01 3.1C6.23 6.88 8.88 4.77 12 4.77Z" />
    </svg>
  );
}

function Login() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [role, setRole] = useState(ROLES.CANDIDATE);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('error');
    if (code) setErrorMessage(ERROR_MESSAGES[code] ?? ERROR_MESSAGES.login_failed);

    // Preselect the role from the landing page (?role=) or the last one used on this device.
    const preferred = params.get('role') ?? window.localStorage.getItem(ROLE_STORAGE_KEY);
    if (Object.values(ROLES).includes(preferred)) setRole(preferred);
  }, []);

  const chooseRole = (value) => {
    setRole(value);
    window.localStorage.setItem(ROLE_STORAGE_KEY, value);
  };

  const nextPath = () => safeNextPath(new URLSearchParams(window.location.search).get('next'));

  const callbackUrl = () => {
    const url = new URL('/auth/callback', window.location.origin);
    url.searchParams.set('role', role);
    const next = nextPath();
    if (next) url.searchParams.set('next', next);
    return url;
  };

  // Save the chosen workspace, then open it. Unapproved recruiters land in the candidate workspace.
  const enterWorkspace = async (supabase, authUser) => {
    const { profile, recruiterDenied } = await saveRoleOrFallBackToCandidate(supabase, authUser, role);
    if (recruiterDenied) {
      window.location.assign(`${homeForRole(profile.role)}?notice=${RECRUITER_NOT_APPROVED_NOTICE}`);
      return;
    }
    const next = nextPath();
    window.location.assign(next && canAccess(profile.role, next) ? next : homeForRole(profile.role));
  };

  const submitEmailForm = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setInfoMessage('');
    setEmailLoading(true);

    const supabase = createClient();
    const credentials = { email: email.trim(), password };

    try {
      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword(credentials);
        if (error) {
          throw new Error(error.message === 'Invalid login credentials' ? 'Wrong email or password.' : error.message);
        }
        await enterWorkspace(supabase, data.user);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        ...credentials,
        options: {
          data: { name: name.trim() },
          emailRedirectTo: callbackUrl().toString(),
        },
      });
      if (error) throw error;

      if (data.session) {
        await enterWorkspace(supabase, data.user);
        return;
      }
      // "Confirm email" is on in Supabase: the link in the email finishes sign-up via /auth/callback.
      setInfoMessage(`We sent a confirmation link to ${credentials.email}. Open it to finish creating your account.`);
      setMode('signin');
      setPassword('');
      setEmailLoading(false);
    } catch (error) {
      setErrorMessage(error?.message || 'Something went wrong. Please try again.');
      setEmailLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setErrorMessage('');

    const { error } = await createClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl().toString() },
    });

    if (error) {
      console.error('Error signing in with Google:', error.message);
      setErrorMessage(ERROR_MESSAGES.login_failed);
      setLoading(false);
    }
  };

  const inputClass =
    'h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-[15px] text-slate-800 outline-none transition placeholder:text-slate-400 autofill:shadow-[inset_0_0_0_1000px_#fff] focus:border-orange-300 focus:ring-4 focus:ring-orange-50 short:h-11';
  const labelClass = 'mb-1.5 block text-sm font-normal text-slate-600';
  const fieldIcon = 'pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400';

  return (
    // One screen on desktop: both panels are exactly the viewport height. Sizes follow the design
    // at ~940px tall; the `short:` variant tightens spacing on shorter screens.
    <main className="grid min-h-dvh bg-white lg:h-dvh lg:grid-cols-2 lg:overflow-hidden">
      {/* ───────── Brand panel ───────── */}
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#fff8f2] via-[#fff3ea] to-[#fde8d8] lg:flex lg:flex-col">
        {/* soft hill rising to the right, behind the robot */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 836 940"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="auth-hill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fcdcc2" stopOpacity="0.85" />
              <stop offset="1" stopColor="#fde9da" stopOpacity="0.35" />
            </linearGradient>
          </defs>
          <path d="M150 860 C 260 560, 520 400, 836 365 L 836 940 L 150 940 Z" fill="url(#auth-hill)" />
        </svg>

        <div className="relative shrink-0 px-[12.5%] pt-10 short:pt-7">
          <Link href="/" aria-label="AI Interview Labs home" className="inline-block">
            <Logo priority className="w-[270px] short:w-[220px]" />
          </Link>

          <h1 className="mt-10 text-[clamp(2.5rem,3.85vw,4rem)] font-extrabold leading-[1.06] tracking-tight text-[#0f172a] short:mt-6 short:text-[clamp(2.25rem,3.2vw,3.25rem)]">
            Interviews that run
            <br />
            <span className="text-orange-500">themselves.</span>
          </h1>
          <p className="mt-6 max-w-[440px] text-xl leading-relaxed text-slate-500 short:mt-3 short:text-lg">
            Hire faster as a recruiter, or practice until you’re confident as a candidate.
          </p>
        </div>

        {/* Highlights and robot share the remaining height side by side (stacked on narrower
            screens), so the robot can never cover the text. */}
        <div className="relative flex min-h-0 flex-1 flex-col gap-4 pb-6 pl-[12.5%] pr-[5%] pt-9 xl:flex-row xl:items-stretch short:pt-5">
          <ul className="shrink-0 space-y-[18px] short:space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className="flex items-center gap-5 short:gap-4">
                <span className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-white/70 text-orange-500 ring-1 ring-orange-200 short:size-11">
                  <item.icon className="size-[22px] short:size-5" />
                </span>
                <span>
                  <span className="block text-[17px] font-medium text-slate-900">{item.title}</span>
                  <span className="block text-sm text-slate-500">{item.text}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="relative min-h-0 min-w-0 flex-1 xl:-mt-6">
            <Image
              src="/Cheerful Robot Workspace Cutout.png"
              alt="AI Interview Labs robot working at a laptop"
              fill
              priority
              sizes="(min-width: 1280px) 30vw, 45vw"
              className="object-contain object-bottom"
            />
          </div>
        </div>
      </section>

      {/* ───────── Sign-in panel ───────── */}
      <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:overflow-y-auto short:lg:py-6">
        <div className="w-full max-w-[458px]">
          <Link href="/" className="mb-8 inline-block lg:hidden" aria-label="AI Interview Labs home">
            <Logo />
          </Link>

          <h2 className="text-[28px] font-semibold leading-tight tracking-tight text-[#0f172a] short:text-[26px]">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-2 text-lg text-slate-500 short:mt-1 short:text-base">
            {mode === 'signin' ? 'Sign in to continue to your workspace.' : 'It takes less than a minute.'}
          </p>

          <div role="radiogroup" aria-label="Sign in as" className="mt-10 grid grid-cols-2 gap-5 short:mt-6 short:gap-4">
            {ROLE_CHOICES.map((choice) => {
              const selected = role === choice.value;
              return (
                <button
                  key={choice.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => chooseRole(choice.value)}
                  className={cn(
                    'relative flex min-h-[136px] cursor-pointer flex-col items-start rounded-2xl border p-5 text-left transition-all short:min-h-0 short:p-4',
                    selected
                      ? 'border-orange-400 bg-orange-50/30 shadow-sm'
                      : 'border-slate-200 bg-slate-50/40 hover:border-orange-200'
                  )}
                >
                  {selected && (
                    <span className="absolute right-4 top-4 flex size-5 items-center justify-center rounded-full bg-orange-500 text-white">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  )}
                  <span className={cn(
                    'flex size-10 items-center justify-center rounded-full',
                    selected ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'
                  )}>
                    <choice.icon className="size-5" />
                  </span>
                  <span className="mt-3 text-base font-medium text-slate-900">{choice.label}</span>
                  <span className="mt-0.5 text-sm leading-snug text-slate-500">{choice.hint}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={loading || emailLoading}
            className="mt-6 flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-[15px] font-normal text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 short:mt-4 short:h-11"
          >
            {loading ? <Loader2 className="size-5 animate-spin" /> : <GoogleIcon />}
            {loading ? 'Redirecting to Google…' : 'Continue with Google'}
          </button>

          <div className="my-8 flex items-center gap-5 text-xs font-medium uppercase tracking-wider text-slate-400 short:my-4">
            <span className="h-px flex-1 bg-slate-200" /> or with email <span className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={submitEmailForm}>
            {mode === 'signup' && (
              <div className="mb-5 short:mb-3">
                <label htmlFor="auth-name" className={labelClass}>Full name</label>
                <div className="relative">
                  <UserRound className={fieldIcon} />
                  <input
                    id="auth-name"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your full name"
                    autoComplete="name"
                    className={inputClass}
                  />
                </div>
              </div>
            )}
            <div>
              <label htmlFor="auth-email" className={labelClass}>Email address</label>
              <div className="relative">
                <Mail className={fieldIcon} />
                <input
                  id="auth-email"
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="mt-5 short:mt-3">
              <label htmlFor="auth-password" className={labelClass}>Password</label>
              <div className="relative">
                <Lock className={fieldIcon} />
                <input
                  id="auth-password"
                  required
                  type={showPassword ? 'text' : 'password'}
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className={cn(inputClass, 'pr-12')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={emailLoading || loading}
              className="mt-5 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff7a1a] to-[#e8590c] text-[15px] font-medium text-white shadow-md shadow-orange-500/20 transition-all hover:shadow-lg hover:shadow-orange-500/30 disabled:cursor-not-allowed disabled:opacity-60 short:mt-4 short:h-11"
            >
              {emailLoading && <Loader2 className="size-4 animate-spin" />}
              {mode === 'signin' ? 'Sign in' : 'Create account'}
              {!emailLoading && <ArrowRight className="size-4" />}
            </button>
          </form>

          {errorMessage && (
            <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 short:mt-3">
              {errorMessage}
            </p>
          )}
          {infoMessage && (
            <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 short:mt-3">
              {infoMessage}
            </p>
          )}

          <p className="mt-6 text-center text-sm text-slate-600 short:mt-4">
            {mode === 'signin' ? 'New here?' : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setErrorMessage('');
                setInfoMessage('');
              }}
              className="cursor-pointer font-medium text-orange-600 hover:text-orange-700"
            >
              {mode === 'signin' ? 'Create an account' : 'Sign in'}
            </button>
          </p>

          <div className="mt-8 border-t border-slate-200 pt-6 short:mt-4 short:pt-4">
            <div className="mx-auto flex max-w-[280px] items-center gap-4 text-xs leading-relaxed text-slate-500">
              <ArrowLeftRight className="size-5 shrink-0 text-slate-500" />
              <p>You can switch between workspaces anytime from the sidebar menu.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;
