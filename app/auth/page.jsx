'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BriefcaseBusiness, CheckCircle2, GraduationCap, Loader2 } from 'lucide-react';
import { createClient } from '@/services/supabaseClient.js';
import { ROLES, canAccess, homeForRole, safeNextPath } from '@/services/roles';
import { RECRUITER_NOT_APPROVED_NOTICE, saveRoleOrFallBackToCandidate } from '@/services/userProfile';
import { cn } from '@/lib/utils';

const ERROR_MESSAGES = {
  login_failed: 'We couldn’t complete your sign-in. Please try again.',
  missing_code: 'The sign-in link was incomplete. Please try again.',
};

const ROLE_STORAGE_KEY = 'ai-interview:last-role';

const ROLE_CHOICES = [
  { value: ROLES.CANDIDATE, label: 'Candidate', hint: 'Practice & take interviews', icon: GraduationCap },
  { value: ROLES.RECRUITER, label: 'Recruiter', hint: 'Approved accounts only', icon: BriefcaseBusiness },
];

const HIGHLIGHTS = [
  'Natural voice interviews run by an AI interviewer',
  'Instant scored reports with strengths and gaps',
  'Practice mode to track your improvement',
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

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-violet-700 via-violet-600 to-fuchsia-500 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-fuchsia-300/20 blur-3xl" />

        <Link href="/" className="relative w-fit rounded-2xl bg-white/95 px-4 py-2 shadow-lg">
          <Image src="/AI Interview Voice Agent Logo.png" alt="AI Interview" width={2172} height={724} priority className="h-auto w-[150px]" />
        </Link>

        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Interviews that run themselves.
          </h1>
          <p className="mt-4 text-lg text-violet-100">
            Hire faster as a recruiter, or practice until you’re confident as a candidate.
          </p>
          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-3 text-violet-50">
                <CheckCircle2 className="size-5 shrink-0 text-fuchsia-200" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-2 shadow-2xl backdrop-blur">
          <Image src="/login.png" alt="" width={708} height={456} className="h-auto w-full rounded-xl" />
        </div>
      </section>

      {/* Sign-in panel */}
      <section className="flex items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-sm">
          <Image
            src="/AI Interview Voice Agent Logo.png"
            alt="AI Interview"
            width={2172}
            height={724}
            className="mx-auto mb-8 h-auto w-[180px] lg:hidden"
          />

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              {mode === 'signin' ? 'Sign in to continue to your workspace.' : 'It takes less than a minute.'}
            </p>

            <div role="radiogroup" aria-label="Sign in as" className="mt-6 grid grid-cols-2 gap-2">
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
                      'flex cursor-pointer flex-col items-start rounded-xl border-2 p-3 text-left transition-all',
                      selected ? 'border-violet-600 bg-violet-50' : 'border-slate-200 hover:border-violet-300'
                    )}
                  >
                    <choice.icon className={cn('size-5', selected ? 'text-violet-600' : 'text-slate-400')} />
                    <span className={cn('mt-2 text-sm font-semibold', selected ? 'text-violet-700' : 'text-slate-800')}>{choice.label}</span>
                    <span className="text-xs text-slate-500">{choice.hint}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={loading || emailLoading}
              className="mt-5 flex h-11 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50 hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="size-5 animate-spin" /> : <GoogleIcon />}
              {loading ? 'Redirecting to Google…' : 'Continue with Google'}
            </button>

            <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-slate-400">
              <span className="h-px flex-1 bg-slate-200" /> or with email <span className="h-px flex-1 bg-slate-200" />
            </div>

            <form onSubmit={submitEmailForm} className="space-y-3">
              {mode === 'signup' && (
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Full name"
                  autoComplete="name"
                  className="h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm outline-none transition focus:border-violet-500 focus:ring-3 focus:ring-violet-100"
                />
              )}
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm outline-none transition focus:border-violet-500 focus:ring-3 focus:ring-violet-100"
              />
              <input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={mode === 'signup' ? 'Password (min. 6 characters)' : 'Password'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm outline-none transition focus:border-violet-500 focus:ring-3 focus:ring-violet-100"
              />
              <button
                type="submit"
                disabled={emailLoading || loading}
                className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-sm font-medium text-white shadow-md shadow-violet-500/25 transition-all hover:shadow-lg hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {emailLoading && <Loader2 className="size-4 animate-spin" />}
                {mode === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            {errorMessage && (
              <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </p>
            )}
            {infoMessage && (
              <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {infoMessage}
              </p>
            )}

            <p className="mt-6 text-center text-sm text-slate-500">
              {mode === 'signin' ? 'New here?' : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setErrorMessage('');
                  setInfoMessage('');
                }}
                className="cursor-pointer font-medium text-violet-600 hover:text-violet-700"
              >
                {mode === 'signin' ? 'Create an account' : 'Sign in'}
              </button>
            </p>

            <p className="mt-6 text-center text-xs text-slate-400">
              You can switch between workspaces any time from the sidebar.
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            <Link href="/" className="font-medium text-violet-600 hover:text-violet-700">← Back to home</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;
