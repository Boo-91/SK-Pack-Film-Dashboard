import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, BarChart3, CalendarRange, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { ALLOWED_EMAIL_DOMAIN } from '../lib/googleAuth';

interface LoginViewProps {
  onSignIn: () => void;
  isLoading: boolean;
  error: string | null;
}

export function LoginView({ onSignIn, isLoading, error }: LoginViewProps) {
  return (
    <div className="min-h-screen bg-[#060D1A] text-slate-100 flex items-center justify-center p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-[#091224] border border-[#1B2B48] rounded-2xl overflow-hidden"
      >
        {/* Left Context Column */}
        <div className="lg:col-span-7 p-7 sm:p-10 flex flex-col justify-between gap-8 border-b lg:border-b-0 lg:border-r border-[#162542]">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-medium text-sky-400 tracking-wide">
                SK Pack Film Department
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1.5 text-balance">
                Insight Dashboard
              </h1>
              <p className="text-sm text-slate-400 mt-3 leading-relaxed max-w-md">
                Production capacity tracking, daily operational logs, and internal quality issue reporting synced directly from department sheets.
              </p>
            </div>

            <div className="pt-4 border-t border-[#162542] space-y-3.5">
              <div className="flex items-start gap-3">
                <LayoutDashboard className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-100">
                    Packing Capacity &amp; QC Overview
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Plan vs. input volume, finished output, and remaining rework across rolling 3-week windows.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CalendarRange className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-100">
                    31-Day Log &amp; Weekly Summary
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Day-by-day capacity records with week and weekday breakdown filters.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <BarChart3 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-100">
                    Daily &amp; Monthly Internal Issues
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Quality issue inspection logs with current-month default filtering and monthly trend rollups.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2 pt-2">
            <span>Packing Operations</span>
            <span aria-hidden="true">·</span>
            <span>Quality Control</span>
            <span aria-hidden="true">·</span>
            <span>Live Sheet Sync</span>
          </div>
        </div>

        {/* Right Sign-In Column */}
        <div className="lg:col-span-5 p-7 sm:p-10 flex flex-col justify-center bg-[#070F1F] space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-sky-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>@{ALLOWED_EMAIL_DOMAIN} Only</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Company Google Sign-In
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Sign in using your <span className="font-mono text-slate-200">@{ALLOWED_EMAIL_DOMAIN}</span> Google account. No separate password is required. External accounts are not permitted.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="bg-red-950/50 border border-red-800/60 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-red-200 leading-relaxed"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
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

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Restricted to authorized <span className="font-mono text-slate-400">@{ALLOWED_EMAIL_DOMAIN}</span> team members.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
