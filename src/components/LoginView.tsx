import React from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  BarChart3,
  CalendarRange,
  LayoutDashboard,
  ShieldCheck,
} from 'lucide-react';
import { ALLOWED_EMAIL_DOMAIN } from '../lib/googleAuth';

interface LoginViewProps {
  onSignIn: () => void;
  isLoading: boolean;
  error: string | null;
}

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: 'Packing Capacity & QC Overview',
    desc: 'Plan vs. input volume, finished output, and remaining rework across rolling 3-week windows.',
  },
  {
    icon: CalendarRange,
    title: '31-Day Log & Weekly Summary',
    desc: 'Day-by-day capacity records with week and weekday breakdown filters.',
  },
  {
    icon: BarChart3,
    title: 'Daily & Monthly Internal Issues',
    desc: 'Quality issue inspection logs with current-month default filtering and monthly trend rollups.',
  },
];

export function LoginView({ onSignIn, isLoading, error }: LoginViewProps) {
  return (
    <div className="min-h-screen cosmic-stage text-[#F2E9FF] relative overflow-hidden flex items-center justify-center p-4 sm:p-8">
      {/* Ambient Cosmic Glow Orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full bg-[#6A2FC8]/25 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-36 -right-24 w-[460px] h-[460px] rounded-full bg-[#9D71E8]/20 blur-[130px]"
      />

      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 glass-panel rounded-2xl overflow-hidden"
      >
        {/* Top Luminous Hairline */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D1B8FF]/50 to-transparent"
        />

        {/* Left Context Column */}
        <div className="lg:col-span-7 p-7 sm:p-10 flex flex-col justify-between gap-8 border-b lg:border-b-0 lg:border-r border-[#D1B8FF]/12">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-medium text-[#D1B8FF] tracking-wide">
                SK Pack Film Department
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F2E9FF] mt-1.5 text-balance">
                Insight Dashboard
              </h1>
              <p className="text-sm text-[#D1B8FF]/70 mt-3 leading-relaxed max-w-md">
                Production capacity tracking, daily operational logs, and internal quality issue reporting synced directly from department sheets.
              </p>
            </div>

            <div className="pt-5 border-t border-[#D1B8FF]/12 space-y-4">
              {FEATURES.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <motion.div
                    key={feat.title}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.24,
                      delay: 0.06 + idx * 0.05,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="flex items-start gap-3.5"
                  >
                    <div className="p-2 rounded-lg bg-[#6A2FC8]/25 border border-[#9D71E8]/30 shadow-[0_0_16px_-4px_rgba(157,113,232,0.5)] shrink-0">
                      <Icon className="w-4 h-4 text-[#D1B8FF]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#F2E9FF]">
                        {feat.title}
                      </p>
                      <p className="text-xs text-[#D1B8FF]/65 mt-0.5 leading-relaxed">
                        {feat.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="text-xs text-[#D1B8FF]/60 flex items-center gap-2 pt-2">
            <span>Packing Operations</span>
            <span aria-hidden="true">·</span>
            <span>Quality Control</span>
            <span aria-hidden="true">·</span>
            <span>Live Sheet Sync</span>
          </div>
        </div>

        {/* Right Sign-In Column */}
        <div className="lg:col-span-5 p-7 sm:p-10 flex flex-col justify-center bg-[#0B0720]/45 backdrop-blur-xl space-y-6">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[#D1B8FF]">
              <ShieldCheck className="w-4 h-4 text-[#9D71E8] shrink-0" />
              <span>@{ALLOWED_EMAIL_DOMAIN} Only</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[#F2E9FF]">
              Company Google Sign-In
            </h2>
            <p className="text-xs sm:text-sm text-[#D1B8FF]/70 leading-relaxed">
              Sign in using your{' '}
              <span className="font-mono text-[#F2E9FF]">
                @{ALLOWED_EMAIL_DOMAIN}
              </span>{' '}
              Google account. No separate password is required. External accounts are not permitted.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              role="alert"
              className="bg-rose-950/50 backdrop-blur-md border border-rose-400/35 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-rose-100 leading-relaxed shadow-[0_0_24px_-8px_rgba(244,63,94,0.45)]"
            >
              <AlertCircle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={onSignIn}
              disabled={isLoading}
              className="gsi-material-button w-full"
            >
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon" aria-hidden="true">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    className="w-4 h-4 block"
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                </div>
                <span className="gsi-material-button-contents">
                  {isLoading ? 'Verifying account...' : 'Continue with Google'}
                </span>
              </div>
            </button>
          </div>

          <p className="text-[11px] text-[#D1B8FF]/55 leading-relaxed">
            Restricted to authorized{' '}
            <span className="font-mono text-[#D1B8FF]/80">
              @{ALLOWED_EMAIL_DOMAIN}
            </span>{' '}
            team members.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
