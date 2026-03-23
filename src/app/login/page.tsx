'use client';

import { startTransition, useMemo, useState } from 'react';
import { ArrowRight, KeyRound, Lock, Mail } from 'lucide-react';
import { Btn, Input } from '@/components/ui';
import { cn } from '@/lib/utils';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type AuthMode = 'sign-in' | 'sign-up';

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const submit = () => {
    setSubmitting(true);
    setError(null);
    setStatus(null);

    void (async () => {
      try {
        if (mode === 'sign-in') {
          const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) throw signInError;

          startTransition(() => {
            window.location.href = '/';
          });
          return;
        }

        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setStatus('Account created. If email confirmation is enabled, confirm it first and then sign in.');
        setMode('sign-in');
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Authentication failed.');
      } finally {
        setSubmitting(false);
      }
    })();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-5">
      <div className="grid w-full max-w-[1040px] overflow-hidden rounded-sm border bg-[var(--bg2)] lg:grid-cols-[1.1fr,0.9fr]">
        <section className="border-b bg-[var(--bg2)] p-6 sm:p-8 lg:border-b-0 lg:border-r">
          <div className="font-display text-[26px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
            IronDesk
          </div>
          <div className="mt-2 font-mono-iron text-[10px] uppercase tracking-[0.18em] text-[var(--text3)]">
            AUTHENTICATED STORE WORKSPACE
          </div>

          <div className="mt-10 space-y-6">
            {[
              ['Trade accounts, orders, and live stock under one login', Mail],
              ['Per-user RLS policies protect the workspace data boundary', Lock],
              ['Demo data is now explicit, not silently mixed into production flow', KeyRound],
            ].map(([copy, Icon]) => {
              const ItemIcon = Icon as typeof Mail;
              return (
                <div key={copy} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-sm border border-[var(--border2)] bg-[var(--bg3)] text-[var(--accent)]">
                    <ItemIcon className="h-4 w-4" />
                  </div>
                  <div className="max-w-[440px] text-[14px] text-[var(--text2)]">{copy}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="p-6 sm:p-8">
          <div className="flex gap-1.5 rounded-sm border bg-[var(--bg3)] p-1">
            {([
              ['sign-in', 'Sign In'],
              ['sign-up', 'Create Account'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={cn(
                  'flex-1 rounded-sm px-3 py-2 font-display text-[13px] font-semibold uppercase tracking-[0.1em] transition-colors',
                  mode === value
                    ? 'bg-[rgba(232,160,32,0.14)] text-[var(--accent)]'
                    : 'text-[var(--text3)] hover:text-[var(--text)]'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block font-mono-iron text-[10px] uppercase tracking-[0.18em] text-[var(--text3)]">
                Email
              </label>
              <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="manager@store.com" />
            </div>
            <div>
              <label className="mb-1.5 block font-mono-iron text-[10px] uppercase tracking-[0.18em] text-[var(--text3)]">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimum 6 characters"
              />
            </div>
          </div>

          {status ? (
            <div className="mt-4 rounded-sm border border-[#365f49] bg-[#15231b] px-3 py-2 text-[13px] text-[#7bc196]">
              {status}
            </div>
          ) : null}
          {error ? (
            <div className="mt-4 rounded-sm border border-[#6c3030] bg-[#251313] px-3 py-2 text-[13px] text-[#ef7676]">
              {error}
            </div>
          ) : null}

          <div className="mt-6">
            <Btn
              variant="primary"
              className="w-full"
              disabled={submitting || email.trim().length === 0 || password.trim().length < 6}
              onClick={submit}
            >
              {submitting ? 'Working...' : mode === 'sign-in' ? 'Enter IronDesk' : 'Create Workspace User'}
              <ArrowRight className="h-4 w-4" />
            </Btn>
          </div>
        </section>
      </div>
    </main>
  );
}
