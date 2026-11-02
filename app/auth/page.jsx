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

// Decorative paper-fold pieces (purely visual).
// A folded orange paper shard (two facets = one crease).
function Origami({ className = '', flip = false }) {
  return (
    <svg viewBox="0 0 120 100" className={className} style={flip ? { transform: 'scaleX(-1)' } : undefined} aria-hidden="true">
      <polygon points="0,100 62,0 74,100" fill="#fdba74" />
      <polygon points="62,0 120,72 74,100" fill="#fb923c" />
      <polygon points="62,0 74,100 68,100" fill="#ea580c" opacity="0.35" />
    </svg>
  );
}

// Folded sheet poking in from a corner of the panel.
function PageCorner({ className = '' }) {
  return (
    <svg viewBox="0 0 200 160" className={className} style={{ transform: 'scaleX(-1)' }} aria-hidden="true">
      <polygon points="0,0 200,0 0,160" fill="#f6e7da" />
      <polygon points="0,0 120,0 30,130" fill="#fbf1e8" />
      <polygon points="120,0 200,0 30,130" fill="#efdccb" opacity="0.6" />
    </svg>
  );
}

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
    'h-[50px] w-full rounded-xl border border-[#eadfd5] bg-white/80 pl-[58px] pr-4 text-[15px] text-slate-800 outline-none transition placeholder:text-slate-400 autofill:shadow-[inset_0_0_0_1000px_#fff] focus:border-orange-300 focus:ring-4 focus:ring-orange-100/60 short:h-11 tiny:h-10';
  const labelClass = 'mb-2 block text-sm text-slate-800 tiny:mb-1 tiny:text-[13px]';
  const fieldIcon = 'pointer-events-none absolute left-[22px] top-1/2 size-[19px] -translate-y-1/2 text-slate-500';

  return (
    // One screen on desktop: both panels are exactly the viewport height. Sizes follow the design
    // at ~940px tall; the `short:` variant tightens spacing on shorter screens.
    <main className="grid min-h-dvh bg-[#faf4ee] lg:h-dvh lg:grid-cols-2 lg:overflow-hidden">
      {/* ───────── Brand panel ───────── */}
      <section className="paper-texture relative hidden overflow-hidden lg:flex lg:flex-col">
        {/* soft paper hill rising to the right, behind the robot */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 836 940"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="auth-hill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fbe3cf" stopOpacity="0.9" />
              <stop offset="1" stopColor="#fdeee2" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <path d="M0 760 C 180 600, 480 430, 836 420 L 836 940 L 0 940 Z" fill="url(#auth-hill)" />
        </svg>
        {/* folded sheet in the top-right corner */}
        <PageCorner className="pointer-events-none absolute -right-px top-0 w-[22%] min-w-[150px]" />

        <div className="relative shrink-0 pl-[10%] pr-[8%] pt-10 short:pt-6 tiny:pt-4">
          {/* logo on a paper slip */}
          <Link href="/" aria-label="AI Interview Labs home" className="paper-lift inline-flex -rotate-[1deg]">
            <span className="paper-slip inline-flex h-[64px] items-center overflow-hidden px-7 short:h-[54px] tiny:h-[46px]">
              <Logo priority className="w-[230px] short:w-[200px] tiny:w-[170px]" />
            </span>
          </Link>

          <h1 className="relative mt-10 text-[clamp(2.4rem,3.4vw,3.6rem)] leading-[1.25] tracking-tight short:mt-6 short:text-[clamp(2.1rem,2.9vw,3rem)] tiny:mt-5 tiny:text-[clamp(1.9rem,2.6vw,2.6rem)]">
            <span className="relative inline-block">
              <span className="paper-lift absolute -inset-x-6 -inset-y-2" aria-hidden="true">
                <span className="paper-strip block h-full w-full" />
              </span>
              <span className="relative text-[#1f2937]">Interviews that run</span>
              {/* little "sparkle" strokes */}
              <svg viewBox="0 0 40 40" className="absolute -right-14 -top-7 w-10" aria-hidden="true">
                <path d="M8 4 L12 16 M24 2 L20 16 M36 14 L24 20" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
            <br />
            <span className="relative mt-3 inline-block">
              <span className="paper-lift absolute -inset-y-2 -left-6 -right-24" aria-hidden="true">
                <span className="paper-strip block h-full w-full" />
              </span>
              <span className="relative font-semibold text-[#f47c20]">themselves.</span>
            </span>
          </h1>

          <p className="mt-8 max-w-[480px] text-xl leading-[1.5] text-slate-500 short:mt-4 short:text-lg tiny:mt-3 tiny:text-base">
            Hire faster as a recruiter, or practice until you’re confident as a candidate.
          </p>

          <ul className="mt-7 space-y-4 short:mt-4 short:space-y-2.5 tiny:space-y-2">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className="flex items-center gap-6 short:gap-4">
                <span className="paper flex size-[60px] shrink-0 items-center justify-center rounded-2xl text-orange-500 short:size-12 tiny:size-10">
                  <item.icon className="size-6 short:size-5" />
                </span>
                <span>
                  <span className="block text-[17px] text-slate-900">{item.title}</span>
                  <span className="block text-sm text-slate-500">{item.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Robot on a paper shelf, bottom-right. Its height follows the screen height so it never covers the text. */}
        <div className="paper-lift pointer-events-none absolute bottom-[5%] left-[12%] right-[3%] h-[34px]" aria-hidden="true">
          <span className="paper block h-full w-full [clip-path:polygon(3%_0,100%_0,97%_100%,0_100%)]" />
        </div>
        <div className="pointer-events-none absolute bottom-[7%] right-[3%] aspect-[3/2] h-[38%]">
          <Image
            src="/Cheerful Robot Workspace Cutout.png"
            alt="AI Interview Labs robot working at a laptop"
            fill
            priority
            sizes="(min-width: 1024px) 40vw, 0px"
            className="object-contain object-bottom"
          />
        </div>
      </section>

      {/* ───────── Sign-in panel ───────── */}
      <section className="relative flex justify-center px-5 py-10 sm:px-10 lg:overflow-y-auto lg:py-6 tiny:lg:py-4">
        <div className="relative my-auto w-full max-w-[640px] short:max-w-[580px] tiny:max-w-[540px]">
          {/* orange origami peeking out from behind the card */}
          <Origami className="absolute -left-[52px] top-[24%] hidden w-[90px] -rotate-[75deg] opacity-90 sm:block" />
          <Origami className="absolute -right-[40px] bottom-[6%] hidden w-[80px] rotate-[110deg] opacity-90 sm:block" flip />

          <div className="paper-lift relative">
            <div className="paper paper-dogear-lg rounded-[30px] px-6 py-9 sm:px-[78px] sm:py-10 short:py-7 short:sm:px-14 tiny:py-5 tiny:sm:px-12">
              <Link href="/" className="mb-6 inline-block lg:hidden" aria-label="AI Interview Labs home">
                <Logo />
              </Link>

              <h2 className="text-[40px] font-medium leading-tight tracking-tight text-[#1f2937] short:text-[32px] tiny:text-[28px]">
                {mode === 'signin' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="mt-2 text-[19px] text-slate-500 short:mt-1 short:text-base tiny:mt-0.5 tiny:text-sm">
                {mode === 'signin' ? 'Sign in to continue to your workspace.' : 'It takes less than a minute.'}
              </p>

              <div role="radiogroup" aria-label="Sign in as" className="mt-7 grid grid-cols-2 gap-5 short:mt-5 short:gap-4 tiny:mt-4 tiny:gap-3">
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
                        'relative flex min-h-[155px] cursor-pointer flex-col items-start rounded-2xl border px-7 pt-4 text-left transition-all short:min-h-0 short:px-5 short:pb-4 tiny:px-4 tiny:pb-3 tiny:pt-3',
                        selected
                          ? 'border-orange-400 bg-[#fff1e5] shadow-[0_8px_20px_-12px_rgba(234,88,12,0.35)]'
                          : 'border-[#eadfd5] bg-white/60 shadow-[0_8px_20px_-14px_rgba(154,72,20,0.25)] hover:border-orange-200'
                      )}
                    >
                      {selected && (
                        <span className="absolute right-3 top-3 flex size-[26px] items-center justify-center rounded-full bg-orange-500 text-white">
                          <Check className="size-4" strokeWidth={3} />
                        </span>
                      )}
                      <span className={cn(
                        'flex size-[42px] items-center justify-center rounded-full tiny:size-8',
                        selected ? 'bg-[#fdd5b4] text-orange-600' : 'bg-slate-100 text-slate-600'
                      )}>
                        <choice.icon className="size-5 tiny:size-4" fill="currentColor" strokeWidth={1.5} />
                      </span>
                      <span className="mt-4 text-xl text-slate-900 short:mt-3 short:text-lg tiny:mt-2 tiny:text-base">{choice.label}</span>
                      <span className="mt-0.5 text-base leading-snug text-slate-500 short:text-[15px] tiny:text-sm">{choice.hint}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={loading || emailLoading}
                className="mt-6 flex h-[52px] w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-[#eadfd5] bg-white/80 text-[17px] text-slate-900 shadow-[0_6px_16px_-12px_rgba(154,72,20,0.3)] transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 short:mt-4 short:h-11 tiny:mt-3 tiny:h-10"
              >
                {loading ? <Loader2 className="size-5 animate-spin" /> : <GoogleIcon />}
                {loading ? 'Redirecting to Google…' : 'Continue with Google'}
              </button>

              <div className="my-7 flex items-center gap-6 text-[13px] uppercase tracking-wide text-slate-500 short:my-4 tiny:my-3">
                <span className="h-px flex-1 bg-[#e7dcd2]" /> or with email <span className="h-px flex-1 bg-[#e7dcd2]" />
              </div>

              <form onSubmit={submitEmailForm}>
                {mode === 'signup' && (
                  <div className="mb-4 short:mb-3">
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
                <div className="mt-4 short:mt-3 tiny:mt-2">
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
                      className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:text-slate-800"
                    >
                      {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={emailLoading || loading}
                  className="mt-6 flex h-[50px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#ff8a2b] via-[#f47c20] to-[#ee6a12] text-[17px] text-white shadow-[0_10px_20px_-10px_rgba(234,88,12,0.6)] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 short:mt-4 short:h-11 tiny:mt-3 tiny:h-10"
                >
                  {emailLoading && <Loader2 className="size-4 animate-spin" />}
                  {mode === 'signin' ? 'Sign in' : 'Create account'}
                  {!emailLoading && <ArrowRight className="size-5" />}
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

              <p className="mt-7 text-center text-base text-slate-800 short:mt-4 tiny:mt-3 tiny:text-sm">
                {mode === 'signin' ? 'New here?' : 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'signin' ? 'signup' : 'signin');
                    setErrorMessage('');
                    setInfoMessage('');
                  }}
                  className="cursor-pointer text-orange-600 hover:text-orange-700"
                >
                  {mode === 'signin' ? 'Create an account' : 'Sign in'}
                </button>
              </p>

              <div className="mt-6 border-t border-[#e7dcd2] pt-5 short:mt-4 short:pt-4 tiny:mt-3 tiny:pt-3">
                <div className="mx-auto flex max-w-[330px] items-center gap-5 text-[13px] leading-relaxed text-slate-500">
                  <ArrowLeftRight className="size-5 shrink-0" />
                  <p>You can switch between workspaces anytime from the sidebar menu.</p>
                </div>
              </div>
            </div>
            <span className="paper-fold-light" aria-hidden="true" />
          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;
