'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { createClient } from '@/services/supabaseClient.js';
import { safeNextPath } from '@/services/roles';

const ERROR_MESSAGES = {
  login_failed: 'We couldn’t complete your sign-in. Please try again.',
  missing_code: 'The sign-in link was incomplete. Please try again.',
};

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

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('error');
    if (code) setErrorMessage(ERROR_MESSAGES[code] ?? ERROR_MESSAGES.login_failed);
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    setErrorMessage('');

    const next = safeNextPath(new URLSearchParams(window.location.search).get('next'));
    const callbackUrl = new URL('/auth/callback', window.location.origin);
    if (next) callbackUrl.searchParams.set('next', next);

    const { error } = await createClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl.toString() },
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
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome</h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Sign in to continue to your workspace.
            </p>

            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={loading}
              className="mt-8 flex h-11 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50 hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="size-5 animate-spin" /> : <GoogleIcon />}
              {loading ? 'Redirecting to Google…' : 'Continue with Google'}
            </button>

            {errorMessage && (
              <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </p>
            )}

            <p className="mt-6 text-center text-xs text-slate-400">
              New here? You’ll choose whether you’re a recruiter or a candidate after signing in.
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
