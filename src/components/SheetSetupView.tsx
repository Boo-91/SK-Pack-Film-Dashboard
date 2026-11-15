import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User } from 'firebase/auth';
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  ExternalLink,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { buildCsvTemplate, TEMPLATE_HEADERS } from '../lib/sheetParser';
import { SheetConnectionState, SheetTabInfo } from '../types/packing';
import { GoogleSignInButton } from './GoogleSignInButton';

interface SheetSetupViewProps {
  connection: SheetConnectionState;
  user: User | null;
  needsAuth: boolean;
  isLoggingIn: boolean;
  isSyncing: boolean;
  errorMessage: string | null;
  onGoogleLogin: () => Promise<void>;
  onGoogleLogout: () => Promise<void>;
  onConnectPublicSheet: (
    url: string,
    tabName?: string,
    dailyIssuesTab?: string,
    monthlyIssuesTab?: string
  ) => Promise<void>;
  onFetchPrivateTabs: (urlOrId: string) => Promise<{
    spreadsheetId: string;
    title: string;
    tabs: SheetTabInfo[];
  } | null>;
  onLoadPrivateTab: (
    spreadsheetId: string,
    title: string,
    tabTitle: string,
    tabs: SheetTabInfo[]
  ) => Promise<void>;
  onLoadSampleData: () => void;
}

export function SheetSetupView({
  connection,
  user,
  needsAuth,
  isLoggingIn,
  isSyncing,
  errorMessage,
  onGoogleLogin,
  onGoogleLogout,
  onConnectPublicSheet,
  onFetchPrivateTabs,
  onLoadPrivateTab,
  onLoadSampleData,
}: SheetSetupViewProps) {
  const [connectMethod, setConnectMethod] = useState<'public' | 'oauth'>(
    connection.mode === 'google-oauth' ? 'oauth' : 'public'
  );
  const [publicUrl, setPublicUrl] = useState(
    connection.sheetUrl && connection.sheetUrl !== 'ENV:GOOGLE_SHEET_URL'
      ? connection.sheetUrl
      : ''
  );
  const [publicTab, setPublicTab] = useState('');
  const [dailyIssuesTab, setDailyIssuesTab] = useState(
    connection.dailyIssuesTab || 'Daily Internal Issues'
  );
  const [monthlyIssuesTab, setMonthlyIssuesTab] = useState(
    connection.monthlyIssuesTab || 'Monthly Internal Issues'
  );

  const [privateUrl, setPrivateUrl] = useState(connection.spreadsheetId || '');
  const [fetchedSheet, setFetchedSheet] = useState<{
    spreadsheetId: string;
    title: string;
    tabs: SheetTabInfo[];
  } | null>(
    connection.mode === 'google-oauth' &&
      connection.spreadsheetId &&
      connection.tabs
      ? {
          spreadsheetId: connection.spreadsheetId,
          title: connection.sourceLabel,
          tabs: connection.tabs,
        }
      : null
  );
  const [selectedTab, setSelectedTab] = useState(
    connection.selectedTab || ''
  );
  const [copiedHeaders, setCopiedHeaders] = useState(false);

  const handlePublicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicUrl.trim()) return;
    await onConnectPublicSheet(
      publicUrl.trim(),
      publicTab.trim() || undefined,
      dailyIssuesTab.trim() || 'Daily Internal Issues',
      monthlyIssuesTab.trim() || 'Monthly Internal Issues'
    );
  };

  const handleFindTabs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privateUrl.trim()) return;
    const res = await onFetchPrivateTabs(privateUrl.trim());
    if (res && res.tabs.length > 0) {
      setFetchedSheet(res);
      setSelectedTab(res.tabs[0].title);
      await onLoadPrivateTab(
        res.spreadsheetId,
        res.title,
        res.tabs[0].title,
        res.tabs
      );
    }
  };

  const handleDownloadTemplate = () => {
    const csv = buildCsvTemplate();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sk-pack-film-capacity-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyHeaders = async () => {
    try {
      await navigator.clipboard.writeText(TEMPLATE_HEADERS.join('\t'));
      setCopiedHeaders(true);
      setTimeout(() => setCopiedHeaders(false), 1800);
    } catch {
      // Ignore clipboard error
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Live Sheet Connection Panel */}
      <section className="bg-[#0C172B] border border-[#1B2B48] rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#162542]">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              Connect Your Live Google Sheet
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Connect your SK Pack Film spreadsheet via a shared Google Sheet link (recommended for Vercel) or Google Account Sign-In.
            </p>
          </div>
          {connection.mode !== 'demo' && (
            <button
              type="button"
              onClick={onLoadSampleData}
              className="px-3 py-2 text-xs font-medium text-slate-200 bg-[#13223D] hover:bg-[#1A2E52] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Restore Uploaded Snapshot
            </button>
          )}
        </div>

        {/* Segmented Method Toggle */}
        <div className="flex items-center gap-1 p-1 bg-[#081020] border border-[#162542] rounded-lg w-fit">
          <button
            type="button"
            onClick={() => setConnectMethod('public')}
            className={`relative px-3.5 py-2 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap cursor-pointer ${
              connectMethod === 'public'
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            {connectMethod === 'public' && (
              <motion.span
                layoutId="connectMethodPill"
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 bg-blue-600 rounded-md"
              />
            )}
            <span className="relative z-10">Shared Sheet Link (No Login)</span>
          </button>
          <button
            type="button"
            onClick={() => setConnectMethod('oauth')}
            className={`relative px-3.5 py-2 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap cursor-pointer ${
              connectMethod === 'oauth'
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            {connectMethod === 'oauth' && (
              <motion.span
                layoutId="connectMethodPill"
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 bg-blue-600 rounded-md"
              />
            )}
            <span className="relative z-10">
              Google Account Sign-In (Private Sheets)
            </span>
          </button>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-lg bg-red-950/50 border border-red-800/60 flex items-start gap-3 text-sm text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}

        {connectMethod === 'public' ? (
          <form onSubmit={handlePublicSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6">
                <label
                  htmlFor="public-sheet-url"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Google Sheet URL or Spreadsheet ID
                </label>
                <input
                  id="public-sheet-url"
                  type="text"
                  value={publicUrl}
                  onChange={(e) => setPublicUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=0"
                  className="w-full h-10 px-3 text-sm bg-[#081020] border border-[#1E3154] rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors duration-150"
                />
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="public-sheet-tab"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Packing Tab
                </label>
                <input
                  id="public-sheet-tab"
                  type="text"
                  value={publicTab}
                  onChange={(e) => setPublicTab(e.target.value)}
                  placeholder="Auto / #gid"
                  className="w-full h-10 px-3 text-sm bg-[#081020] border border-[#1E3154] rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors duration-150"
                />
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="daily-issues-tab"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Daily Issues Tab
                </label>
                <input
                  id="daily-issues-tab"
                  type="text"
                  value={dailyIssuesTab}
                  onChange={(e) => setDailyIssuesTab(e.target.value)}
                  placeholder="Daily Internal Issues"
                  className="w-full h-10 px-3 text-sm bg-[#081020] border border-[#1E3154] rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors duration-150"
                />
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="monthly-issues-tab"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Monthly Issues Tab
                </label>
                <input
                  id="monthly-issues-tab"
                  type="text"
                  value={monthlyIssuesTab}
                  onChange={(e) => setMonthlyIssuesTab(e.target.value)}
                  placeholder="Monthly Internal Issues"
                  className="w-full h-10 px-3 text-sm bg-[#081020] border border-[#1E3154] rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors duration-150"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <p className="text-xs text-slate-400">
                Loads all 3 tabs (<strong className="text-slate-200">Packing Capacity</strong>,{' '}
                <strong className="text-slate-200">Daily Internal Issues</strong>, and{' '}
                <strong className="text-slate-200">Monthly Internal Issues</strong>) simultaneously.
              </p>
              <button
                type="submit"
                disabled={isSyncing || !publicUrl.trim()}
                className="inline-flex items-center gap-2 h-10 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`}
                />
                <span>{isSyncing ? 'Loading All 3 Tabs...' : 'Load All 3 Sheets'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-5">
            {needsAuth || !user ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#081020] border border-[#1B2B48] rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-100">
                    Sign in to read private Google Sheets
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Uses read-only Google Sheets access. Your data stays in your browser session.
                  </p>
                </div>
                <GoogleSignInButton
                  onClick={onGoogleLogin}
                  disabled={isLoggingIn}
                  label={isLoggingIn ? 'Signing in...' : 'Sign in with Google'}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#162542] text-xs">
                  <span className="text-slate-400">
                    Signed in as{' '}
                    <strong className="text-slate-100">
                      {user.email || user.displayName}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={onGoogleLogout}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>

                <form
                  onSubmit={handleFindTabs}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <input
                    type="text"
                    value={privateUrl}
                    onChange={(e) => setPrivateUrl(e.target.value)}
                    placeholder="Paste your Google Sheet URL or Spreadsheet ID..."
                    aria-label="Private Google Sheet URL or ID"
                    className="flex-1 h-10 px-3 text-sm bg-[#081020] border border-[#1E3154] rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors duration-150"
                  />
                  <button
                    type="submit"
                    disabled={isSyncing || !privateUrl.trim()}
                    className="h-10 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {isSyncing ? 'Fetching...' : 'Connect Sheet'}
                  </button>
                </form>

                {fetchedSheet && fetchedSheet.tabs.length > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
                    <label
                      htmlFor="private-tab-select"
                      className="text-xs font-medium text-slate-300 whitespace-nowrap"
                    >
                      Packing Tab ({fetchedSheet.title}):
                    </label>
                    <select
                      id="private-tab-select"
                      value={selectedTab}
                      onChange={async (e) => {
                        const nextTab = e.target.value;
                        setSelectedTab(nextTab);
                        await onLoadPrivateTab(
                          fetchedSheet.spreadsheetId,
                          fetchedSheet.title,
                          nextTab,
                          fetchedSheet.tabs
                        );
                      }}
                      className="h-10 px-3 text-sm bg-[#081020] border border-[#1E3154] rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    >
                      {fetchedSheet.tabs.map((tab) => (
                        <option key={tab.sheetId} value={tab.title}>
                          {tab.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3-Tab Multi-Sync Status Strip */}
        <div className="pt-4 border-t border-[#162542] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-[#081020] border border-[#162542] rounded-lg px-3.5 py-2.5 flex items-center justify-between gap-2">
            <span className="text-slate-300 font-medium">
              1. Packing Capacity
            </span>
            <span
              className={`font-mono ${
                connection.mode === 'demo'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {connection.mode === 'demo' ? 'CSV Snapshot' : 'Live Synced'}
            </span>
          </div>
          <div className="bg-[#081020] border border-[#162542] rounded-lg px-3.5 py-2.5 flex items-center justify-between gap-2">
            <span className="text-slate-300 font-medium">
              2. Daily Internal Issues
            </span>
            <span
              className={`font-mono ${
                connection.dailyIssuesSynced
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }`}
            >
              {connection.dailyIssuesSynced ? 'Live Synced' : 'CSV Snapshot'}
            </span>
          </div>
          <div className="bg-[#081020] border border-[#162542] rounded-lg px-3.5 py-2.5 flex items-center justify-between gap-2">
            <span className="text-slate-300 font-medium">
              3. Monthly Internal Issues
            </span>
            <span
              className={`font-mono ${
                connection.monthlyIssuesSynced
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }`}
            >
              {connection.monthlyIssuesSynced ? 'Live Synced' : 'CSV Snapshot'}
            </span>
          </div>
        </div>
      </section>

      {/* Two-Column Column Match & Vercel Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-[#0C172B] border border-[#1B2B48] rounded-xl p-6 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              01. Matched Spreadsheet Columns
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Configured for your exact 12-column Packing Capacity sheet structure.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors duration-150 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Current CSV</span>
            </button>
            <button
              type="button"
              onClick={handleCopyHeaders}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-[#13223D] hover:bg-[#1A2E52] rounded-lg transition-colors duration-150 cursor-pointer"
            >
              {copiedHeaders ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied Headers</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Row 1 Headers</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-2 border-t border-[#162542]">
            <p className="text-xs font-medium text-slate-300 mb-2">
              Column Detection ({connection.sourceLabel})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              {connection.matchedColumns.map((col) => (
                <div
                  key={col.field}
                  className="flex items-center justify-between gap-2 py-1 border-b border-[#162542]"
                >
                  <span className="text-slate-400 truncate">
                    {col.expectedHeader}
                  </span>
                  <span
                    className={`font-mono truncate ${
                      col.matchedHeader ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {col.matchedHeader || 'Not found'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#0C172B] border border-[#1B2B48] rounded-xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                02. Publishing Options
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Includes <span className="font-mono text-slate-300">/api/sheet</span> for both AI Studio Publish and Vercel Serverless deployment.
              </p>
            </div>
            <a
              href="https://vercel.com/new"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors whitespace-nowrap shrink-0"
            >
              <span>Vercel</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <ol className="space-y-3 text-sm text-slate-300 divide-y divide-[#162542]">
            <li className="pt-1">
              <p className="font-medium text-slate-100 text-xs">
                1. Publish directly in Google AI Studio (Top Right)
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Click Publish in the top-right corner for a live link without GitHub or Vercel.
              </p>
            </li>
            <li className="pt-3">
              <p className="font-medium text-slate-100 text-xs">
                2. Or deploy to Vercel (via GitHub or npx vercel)
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload files to GitHub and import in Vercel, or run <span className="font-mono text-slate-200">npx vercel</span> inside the unzipped folder.
              </p>
            </li>
            <li className="pt-3">
              <p className="font-medium text-slate-100 text-xs">
                3. Set Vercel Environment Variables (Auto Live Sync)
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                In Vercel → Project Settings → Environment Variables, add{' '}
                <span className="font-mono text-slate-200">GOOGLE_SHEET_URL</span>{' '}
                (your sheet ID/URL) and{' '}
                <span className="font-mono text-slate-200">
                  GOOGLE_SERVICE_ACCOUNT_JSON
                </span>{' '}
                for private organization sheets without user login.
              </p>
            </li>
            <li className="pt-3">
              <p className="font-medium text-slate-100 text-xs">
                4. Turn on Auto-Sync
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Select <strong>Auto-Sync: 30s</strong> or <strong>60s</strong> in the top bar for live factory floor monitors.
              </p>
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
}
