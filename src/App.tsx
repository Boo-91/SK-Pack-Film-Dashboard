import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { User } from 'firebase/auth';
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  CalendarRange,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Mail,
  Menu,
  RefreshCw,
  Sheet,
  X,
} from 'lucide-react';
import { DailyIssuesView } from './components/DailyIssuesView';
import { MonthlyIssuesView } from './components/MonthlyIssuesView';
import { OrderDetailDrawer } from './components/OrderDetailDrawer';
import { PackingQueueTable } from './components/PackingQueueTable';
import { SheetSetupView } from './components/SheetSetupView';
import { WeeklyCapacityView } from './components/StationsView';
import {
  CapacityScorecardStrip,
  CapacityStatusLabel,
  PackingOverviewVisuals,
} from './components/StatusVisuals';
import {
  fetchSpreadsheetMetadata,
  fetchSpreadsheetValues,
  getAccessToken,
  googleSignIn,
  initAuth,
  logout,
} from './lib/googleAuth';
import {
  DEFAULT_DAILY_ISSUES_TAB,
  DEFAULT_MONTHLY_ISSUES_TAB,
  INITIAL_DAILY_ISSUES,
  INITIAL_MONTHLY_ISSUES,
  parseRowsToDailyIssues,
  parseRowsToMonthlyIssues,
} from './lib/issuesParser';
import {
  BASELINE_PACKING_CSV,
  extractGoogleSheetInfo,
  getDailyThirtyOneDayWindow,
  getThreeWeekWindow,
  getTodayCapacityRecord,
  parseCsvText,
  parseRowsToCapacityData,
  TEMPLATE_HEADERS,
} from './lib/sheetParser';
import {
  CapacityStatus,
  DailyIssueRow,
  MonthlyIssueRow,
  PackingCapacityRow,
  SheetConnectionState,
  SheetTabInfo,
} from './types/packing';

type ActiveView =
  | 'overview'
  | 'daily'
  | 'weekly'
  | 'daily-issues'
  | 'monthly-issues'
  | 'setup';

const STORAGE_PUBLIC_SHEET_KEY = 'packline_public_sheet_config';

function findMatchingTabTitle(
  tabs: SheetTabInfo[],
  preferred: string,
  keywords: string[]
): string | null {
  if (!tabs || tabs.length === 0) return null;
  const prefLower = preferred.trim().toLowerCase();
  const exact = tabs.find((t) => t.title.trim().toLowerCase() === prefLower);
  if (exact) return exact.title;
  const byKeyword = tabs.find((t) => {
    const lower = t.title.trim().toLowerCase();
    return keywords.every((kw) => lower.includes(kw));
  });
  return byKeyword ? byKeyword.title : null;
}

function formatClockTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

const INITIAL_PARSED = parseRowsToCapacityData(
  parseCsvText(BASELINE_PACKING_CSV)
);

const DEFAULT_CONNECTION: SheetConnectionState = {
  mode: 'demo',
  sourceLabel: 'SK Pack Film (Uploaded Sheet)',
  dailyIssuesTab: DEFAULT_DAILY_ISSUES_TAB,
  monthlyIssuesTab: DEFAULT_MONTHLY_ISSUES_TAB,
  dailyIssuesSynced: false,
  monthlyIssuesSynced: false,
  lastSyncedAt: formatClockTime(new Date()),
  headers: INITIAL_PARSED.headers.length
    ? INITIAL_PARSED.headers
    : TEMPLATE_HEADERS,
  matchedColumns: INITIAL_PARSED.matchedColumns,
};

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [records, setRecords] = useState<PackingCapacityRow[]>(
    INITIAL_PARSED.records
  );
  const [dailyIssues, setDailyIssues] = useState<DailyIssueRow[]>(
    INITIAL_DAILY_ISSUES
  );
  const [monthlyIssues, setMonthlyIssues] = useState<MonthlyIssueRow[]>(
    INITIAL_MONTHLY_ISSUES
  );
  const [connection, setConnection] =
    useState<SheetConnectionState>(DEFAULT_CONNECTION);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [autoRefreshSec, setAutoRefreshSec] = useState<number>(30);

  const [user, setUser] = useState<User | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CapacityStatus | 'All'>(
    'All'
  );
  const [weekFilter, setWeekFilter] = useState<string>('All');
  const [weekdayFilter, setWeekdayFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date' | 'plan' | 'ng' | 'rework'>(
    'date'
  );
  const [selectedRecord, setSelectedRecord] =
    useState<PackingCapacityRow | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (signedInUser) => {
        setUser(signedInUser);
        setNeedsAuth(false);
      },
      (existingUser) => {
        setUser(existingUser);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const fetchPublicTabRows = async (sheetUrl: string, tabName?: string) => {
    const params = new URLSearchParams();
    if (sheetUrl) params.set('url', sheetUrl);
    if (tabName) params.set('sheet', tabName);
    params.set('_t', String(Date.now()));

    const res = await fetch(`/api/sheet?${params.toString()}`, {
      cache: 'no-store',
    });
    const payload = await res.json();
    if (!res.ok) {
      throw new Error(payload?.error || 'Unable to load Google Sheet.');
    }
    return payload as { spreadsheetId?: string; rows?: string[][] };
  };

  const loadPublicSheet = useCallback(
    async (
      sheetUrl: string,
      tabName?: string,
      persist = true,
      dailyIssuesTab = DEFAULT_DAILY_ISSUES_TAB,
      monthlyIssuesTab = DEFAULT_MONTHLY_ISSUES_TAB
    ) => {
      setIsSyncing(true);
      setSyncError(null);
      try {
        const [packingRes, dailyRes, monthlyRes] = await Promise.allSettled([
          fetchPublicTabRows(sheetUrl, tabName),
          dailyIssuesTab
            ? fetchPublicTabRows(sheetUrl, dailyIssuesTab)
            : Promise.reject(new Error('Skipped')),
          monthlyIssuesTab
            ? fetchPublicTabRows(sheetUrl, monthlyIssuesTab)
            : Promise.reject(new Error('Skipped')),
        ]);

        if (packingRes.status === 'rejected') {
          throw packingRes.reason;
        }

        const payload = packingRes.value;
        const parsed = parseRowsToCapacityData(payload.rows || []);
        setRecords(parsed.records);

        let dailyIssuesSynced = false;
        if (dailyRes.status === 'fulfilled' && dailyRes.value.rows?.length) {
          const parsedDaily = parseRowsToDailyIssues(dailyRes.value.rows);
          if (parsedDaily.length > 0) {
            setDailyIssues(parsedDaily);
            dailyIssuesSynced = true;
          }
        }

        let monthlyIssuesSynced = false;
        if (monthlyRes.status === 'fulfilled' && monthlyRes.value.rows?.length) {
          const parsedMonthly = parseRowsToMonthlyIssues(monthlyRes.value.rows);
          if (parsedMonthly.length > 0) {
            setMonthlyIssues(parsedMonthly);
            monthlyIssuesSynced = true;
          }
        }

        setConnection({
          mode: 'public-url',
          sourceLabel: tabName
            ? `Google Sheet (${tabName})`
            : 'Live Google Sheet',
          spreadsheetId: payload.spreadsheetId,
          sheetUrl: sheetUrl || 'ENV:GOOGLE_SHEET_URL',
          selectedTab: tabName,
          dailyIssuesTab,
          monthlyIssuesTab,
          dailyIssuesSynced,
          monthlyIssuesSynced,
          lastSyncedAt: formatClockTime(new Date()),
          headers: parsed.headers,
          matchedColumns: parsed.matchedColumns,
        });

        if (persist && sheetUrl) {
          try {
            localStorage.setItem(
              STORAGE_PUBLIC_SHEET_KEY,
              JSON.stringify({
                url: sheetUrl,
                tabName: tabName || '',
                dailyIssuesTab,
                monthlyIssuesTab,
              })
            );
          } catch {
            // Ignore storage issues
          }
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Failed to fetch Google Sheet.';
        setSyncError(msg);
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );

  const loadPrivateTab = useCallback(
    async (
      spreadsheetId: string,
      title: string,
      tabTitle: string,
      tabs: SheetTabInfo[]
    ) => {
      setIsSyncing(true);
      setSyncError(null);
      try {
        const accessToken = await getAccessToken();
        if (!accessToken) {
          setNeedsAuth(true);
          throw new Error(
            'Your Google session expired. Please sign in with Google again.'
          );
        }

        const detectedDailyTab = findMatchingTabTitle(
          tabs,
          DEFAULT_DAILY_ISSUES_TAB,
          ['daily', 'issue']
        );
        const detectedMonthlyTab = findMatchingTabTitle(
          tabs,
          DEFAULT_MONTHLY_ISSUES_TAB,
          ['monthly', 'issue']
        );

        const [packingRes, dailyRes, monthlyRes] = await Promise.allSettled([
          fetchSpreadsheetValues(spreadsheetId, tabTitle, accessToken),
          detectedDailyTab
            ? fetchSpreadsheetValues(spreadsheetId, detectedDailyTab, accessToken)
            : Promise.reject(new Error('Tab not found')),
          detectedMonthlyTab
            ? fetchSpreadsheetValues(
                spreadsheetId,
                detectedMonthlyTab,
                accessToken
              )
            : Promise.reject(new Error('Tab not found')),
        ]);

        if (packingRes.status === 'rejected') {
          throw packingRes.reason;
        }

        const parsed = parseRowsToCapacityData(packingRes.value);
        setRecords(parsed.records);

        let dailyIssuesSynced = false;
        if (dailyRes.status === 'fulfilled' && dailyRes.value.length > 0) {
          const parsedDaily = parseRowsToDailyIssues(dailyRes.value);
          if (parsedDaily.length > 0) {
            setDailyIssues(parsedDaily);
            dailyIssuesSynced = true;
          }
        }

        let monthlyIssuesSynced = false;
        if (monthlyRes.status === 'fulfilled' && monthlyRes.value.length > 0) {
          const parsedMonthly = parseRowsToMonthlyIssues(monthlyRes.value);
          if (parsedMonthly.length > 0) {
            setMonthlyIssues(parsedMonthly);
            monthlyIssuesSynced = true;
          }
        }

        setConnection({
          mode: 'google-oauth',
          sourceLabel: `${title} (${tabTitle})`,
          spreadsheetId,
          selectedTab: tabTitle,
          dailyIssuesTab: detectedDailyTab || DEFAULT_DAILY_ISSUES_TAB,
          monthlyIssuesTab: detectedMonthlyTab || DEFAULT_MONTHLY_ISSUES_TAB,
          dailyIssuesSynced,
          monthlyIssuesSynced,
          tabs,
          lastSyncedAt: formatClockTime(new Date()),
          headers: parsed.headers,
          matchedColumns: parsed.matchedColumns,
        });
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Unable to read Google Sheet rows.';
        setSyncError(msg);
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );

  useEffect(() => {
    let active = true;
    const bootstrap = async () => {
      try {
        const checkRes = await fetch('/api/sheet?check=1');
        if (checkRes.ok) {
          const info = await checkRes.json();
          if (active && info?.hasDefaultEnvSheet) {
            await loadPublicSheet(
              '',
              undefined,
              false,
              DEFAULT_DAILY_ISSUES_TAB,
              DEFAULT_MONTHLY_ISSUES_TAB
            );
            return;
          }
        }
      } catch {
        // Ignore check error
      }

      try {
        const saved = localStorage.getItem(STORAGE_PUBLIC_SHEET_KEY);
        if (saved && active) {
          const parsed = JSON.parse(saved);
          if (parsed?.url) {
            await loadPublicSheet(
              parsed.url,
              parsed.tabName || undefined,
              false,
              parsed.dailyIssuesTab || DEFAULT_DAILY_ISSUES_TAB,
              parsed.monthlyIssuesTab || DEFAULT_MONTHLY_ISSUES_TAB
            );
          }
        }
      } catch {
        // Stay on uploaded snapshot
      }
    };
    bootstrap();
    return () => {
      active = false;
    };
  }, [loadPublicSheet]);

  const handleSyncNow = useCallback(async () => {
    if (connection.mode === 'public-url') {
      const urlArg =
        connection.sheetUrl === 'ENV:GOOGLE_SHEET_URL'
          ? ''
          : connection.sheetUrl || '';
      await loadPublicSheet(
        urlArg,
        connection.selectedTab,
        false,
        connection.dailyIssuesTab || DEFAULT_DAILY_ISSUES_TAB,
        connection.monthlyIssuesTab || DEFAULT_MONTHLY_ISSUES_TAB
      );
    } else if (
      connection.mode === 'google-oauth' &&
      connection.spreadsheetId &&
      connection.selectedTab
    ) {
      await loadPrivateTab(
        connection.spreadsheetId,
        connection.sourceLabel.replace(/\s*\([^)]*\)$/, ''),
        connection.selectedTab,
        connection.tabs || []
      );
    } else {
      setConnection((prev) => ({
        ...prev,
        lastSyncedAt: formatClockTime(new Date()),
      }));
    }
  }, [connection, loadPrivateTab, loadPublicSheet]);

  useEffect(() => {
    if (autoRefreshSec <= 0 || connection.mode === 'demo') return;
    const timer = window.setInterval(() => {
      handleSyncNow();
    }, autoRefreshSec * 1000);
    return () => window.clearInterval(timer);
  }, [autoRefreshSec, connection.mode, handleSyncNow]);

  useEffect(() => {
    if (connection.mode === 'demo') return;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleSyncNow();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [connection.mode, handleSyncNow]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setSyncError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err) {
      setSyncError(
        err instanceof Error
          ? err.message
          : 'Google sign-in was cancelled or blocked.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logout();
    setUser(null);
    setNeedsAuth(true);
    if (connection.mode === 'google-oauth') {
      handleLoadSampleData();
    }
  };

  const handleFetchPrivateTabs = async (urlOrId: string) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setNeedsAuth(true);
        throw new Error('Please sign in with Google first.');
      }

      const { spreadsheetId } = extractGoogleSheetInfo(urlOrId);
      if (!spreadsheetId) {
        throw new Error(
          'Invalid Google Sheet link or ID. Paste the full spreadsheet URL.'
        );
      }

      const meta = await fetchSpreadsheetMetadata(spreadsheetId, accessToken);
      return {
        spreadsheetId,
        title: meta.title,
        tabs: meta.tabs,
      };
    } catch (err) {
      setSyncError(
        err instanceof Error ? err.message : 'Unable to access spreadsheet.'
      );
      return null;
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLoadSampleData = () => {
    try {
      localStorage.removeItem(STORAGE_PUBLIC_SHEET_KEY);
    } catch {
      // Ignore
    }
    setSyncError(null);
    setRecords(INITIAL_PARSED.records);
    setDailyIssues(INITIAL_DAILY_ISSUES);
    setMonthlyIssues(INITIAL_MONTHLY_ISSUES);
    setConnection({
      ...DEFAULT_CONNECTION,
      lastSyncedAt: formatClockTime(new Date()),
    });
  };

  const availableWeeks = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    records.forEach((r) => {
      if (r.weekNo && !seen.has(r.weekNo)) {
        seen.add(r.weekNo);
        list.push(r.weekNo);
      }
    });
    return list;
  }, [records]);

  const availableWeekdays = useMemo(() => {
    const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.weekday && r.weekday !== '—') set.add(r.weekday);
    });
    return Array.from(set).sort(
      (a, b) => order.indexOf(a) - order.indexOf(b)
    );
  }, [records]);

  const weekWindow = useMemo(() => getThreeWeekWindow(records), [records]);
  const todayRecord = useMemo(() => getTodayCapacityRecord(records), [records]);
  const dailyWindow = useMemo(
    () => getDailyThirtyOneDayWindow(records),
    [records]
  );
  const dailyAvailableWeeks = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    dailyWindow.records.forEach((r) => {
      if (r.weekNo && !seen.has(r.weekNo)) {
        seen.add(r.weekNo);
        list.push(r.weekNo);
      }
    });
    return list;
  }, [dailyWindow.records]);

  const overviewWindowRecords = useMemo(() => {
    const allowed = new Set(weekWindow.orderedWindowWeeks);
    if (allowed.size === 0) return records;
    return records.filter((r) => allowed.has(r.weekNo));
  }, [records, weekWindow]);

  const overviewScopedRecords = useMemo(() => {
    if (weekFilter === 'All') return overviewWindowRecords;
    return records.filter((r) => r.weekNo === weekFilter);
  }, [overviewWindowRecords, records, weekFilter]);

  const overviewFilteredTableRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const base =
      weekFilter === 'All' ? overviewWindowRecords : records;

    const result = base.filter((row) => {
      if (statusFilter !== 'All' && row.status !== statusFilter) return false;
      if (weekFilter !== 'All' && row.weekNo !== weekFilter) return false;
      if (weekdayFilter !== 'All' && row.weekday !== weekdayFilter)
        return false;
      if (query) {
        const haystack = [row.dateLabel, row.weekday, row.weekNo, row.status]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'plan') return b.planQty - a.planQty;
      if (sortBy === 'ng') return b.totalNgQty - a.totalNgQty;
      if (sortBy === 'rework') return a.remainReworkQty - b.remainReworkQty;
      return a.dateSortKey - b.dateSortKey;
    });

    return result;
  }, [
    overviewWindowRecords,
    records,
    searchQuery,
    statusFilter,
    weekFilter,
    weekdayFilter,
    sortBy,
  ]);

  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const activeWeekFilter =
      weekFilter !== 'All' && !dailyAvailableWeeks.includes(weekFilter)
        ? 'All'
        : weekFilter;

    const result = dailyWindow.records.filter((row) => {
      if (statusFilter !== 'All' && row.status !== statusFilter) return false;
      if (activeWeekFilter !== 'All' && row.weekNo !== activeWeekFilter)
        return false;
      if (weekdayFilter !== 'All' && row.weekday !== weekdayFilter)
        return false;
      if (query) {
        const haystack = [row.dateLabel, row.weekday, row.weekNo, row.status]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'plan') return b.planQty - a.planQty;
      if (sortBy === 'ng') return b.totalNgQty - a.totalNgQty;
      if (sortBy === 'rework') return a.remainReworkQty - b.remainReworkQty;
      return a.dateSortKey - b.dateSortKey;
    });

    return result;
  }, [
    dailyWindow.records,
    dailyAvailableWeeks,
    searchQuery,
    statusFilter,
    weekFilter,
    weekdayFilter,
    sortBy,
  ]);

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setWeekFilter('All');
    setWeekdayFilter('All');
  };

  const packingNavItems: {
    id: ActiveView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'daily', label: 'Daily Log', icon: ListChecks },
    { id: 'weekly', label: 'Weekly Summary', icon: CalendarRange },
  ];

  const qualityNavItems: {
    id: ActiveView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'daily-issues', label: 'Daily Internal Issues', icon: AlertTriangle },
    { id: 'monthly-issues', label: 'Monthly Internal Issues', icon: BarChart3 },
  ];

  const viewTitles: Record<ActiveView, string> = {
    overview: 'SK Pack Film / Overview',
    daily: 'SK Pack Film / Daily Capacity Log',
    weekly: 'SK Pack Film / Weekly Summary',
    'daily-issues': 'Quality / Daily Internal Issues',
    'monthly-issues': 'Quality / Monthly Internal Issues',
    setup: 'Settings / Sheet & Vercel',
  };

  const renderNavButton = (
    item: {
      id: ActiveView;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
    },
    isMobile: boolean
  ) => {
    const Icon = item.icon;
    const active = activeView === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          setActiveView(item.id);
          setMobileNavOpen(false);
        }}
        className={`group relative w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 whitespace-nowrap cursor-pointer ${
          active
            ? 'text-white'
            : 'text-slate-400 hover:text-slate-100 hover:bg-[#111F38]'
        }`}
      >
        {active && (
          <motion.span
            layoutId={isMobile ? 'mobileNavActive' : 'desktopNavActive'}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 bg-blue-600 rounded-lg"
          />
        )}
        <Icon
          className={`relative z-10 w-4 h-4 shrink-0 transition-transform duration-150 ${
            active ? '' : 'group-hover:translate-x-0.5'
          }`}
        />
        <span
          className={`relative z-10 truncate transition-transform duration-150 ${
            active ? '' : 'group-hover:translate-x-0.5'
          }`}
        >
          {item.label}
        </span>
      </button>
    );
  };

  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col justify-between h-full p-5 overflow-y-auto gap-6">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-2">
          <a
            href="#overview"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('overview');
              setMobileNavOpen(false);
            }}
            className="group block min-w-0"
          >
            <div className="text-lg font-bold tracking-tight text-white whitespace-nowrap group-hover:text-sky-300 transition-colors duration-150">
              Insight Dashboard
            </div>
            <p className="text-xs font-medium text-sky-400/85 tracking-wide mt-0.5 whitespace-nowrap group-hover:text-sky-300 transition-colors duration-150">
              SK Pack Film Department
            </p>
          </a>
          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors cursor-pointer"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="space-y-3.5" aria-label="Primary navigation">
          {/* Packing Section Container */}
          <div className="bg-[#060D1A]/75 border border-[#162542] rounded-xl p-2 space-y-1">
            <p className="px-2.5 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Packing
            </p>
            <div className="space-y-1">
              {packingNavItems.map((item) => renderNavButton(item, isMobile))}
            </div>
          </div>

          {/* Quality Section Container */}
          <div className="bg-[#060D1A]/75 border border-[#162542] rounded-xl p-2 space-y-1">
            <p className="px-2.5 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Quality
            </p>
            <div className="space-y-1">
              {qualityNavItems.map((item) => renderNavButton(item, isMobile))}
            </div>
          </div>

          {/* Connection Setup Item */}
          <div className="pt-0.5">
            {renderNavButton(
              { id: 'setup', label: 'Sheet & Vercel', icon: Sheet },
              isMobile
            )}
          </div>
        </nav>
      </div>

      {/* Data Source & Signed-In User Summary */}
      <div className="pt-5 border-t border-[#1B2B48] space-y-4">
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-400">Data Source</p>
            <p className="text-sm font-semibold text-slate-100 truncate">
              {connection.sourceLabel}
            </p>
            <p className="text-xs text-slate-400 font-mono tabular-nums">
              Synced {connection.lastSyncedAt}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveView('setup');
              setMobileNavOpen(false);
            }}
            className="w-full h-9 px-3 text-xs font-medium text-slate-200 bg-[#13223D] hover:bg-[#1B3157] border border-[#223659] rounded-lg transition-colors duration-150 whitespace-nowrap cursor-pointer"
          >
            {connection.mode === 'demo'
              ? 'Connect Live Sheet'
              : 'Change Data Source'}
          </button>
        </div>

        <div className="pt-3.5 border-t border-[#162542]">
          {user ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-slate-400">
                    Signed-in User
                  </p>
                  <p
                    className="text-xs font-medium text-slate-100 truncate"
                    title={user.email || user.displayName || 'Google User'}
                  >
                    {user.email || user.displayName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGoogleLogout}
                title="Sign out"
                aria-label="Sign out"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-[#13223D] rounded-md transition-colors duration-150 shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-slate-400">
                    User Account
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    Not signed in
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="text-xs font-medium text-sky-400 hover:text-sky-300 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isLoggingIn ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#060D1A] text-slate-100 flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 bg-[#091224] border-r border-[#1B2B48] sticky top-0 h-screen">
          {renderSidebarContent(false)}
        </aside>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileNavOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
                className="fixed inset-0 bg-[#02060F]/75 backdrop-blur-[2px]"
                onClick={() => setMobileNavOpen(false)}
                aria-hidden="true"
              />
              <motion.aside
                initial={{ x: -260 }}
                animate={{ x: 0 }}
                exit={{ x: -260 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-64 bg-[#091224] border-r border-[#1B2B48] h-full"
              >
                {renderSidebarContent(true)}
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top Bar */}
          <header className="h-14 bg-[#091224]/95 backdrop-blur-md border-b border-[#1B2B48] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="lg:hidden p-2 -ml-2 text-slate-300 hover:text-white rounded-lg hover:bg-[#13223D] transition-colors cursor-pointer"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <span className="text-sm font-medium text-slate-300 truncate">
                {viewTitles[activeView]}
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <select
                value={autoRefreshSec}
                onChange={(e) => setAutoRefreshSec(Number(e.target.value))}
                aria-label="Auto-sync interval"
                className="hidden sm:block h-9 px-2.5 text-xs font-medium bg-[#0C172B] border border-[#1E3154] rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors duration-150"
              >
                <option value={0}>Sync: Manual</option>
                <option value={30}>Auto-Sync: 30s</option>
                <option value={60}>Auto-Sync: 60s</option>
              </select>

              {connection.mode === 'demo' ? (
                <button
                  type="button"
                  onClick={() => setActiveView('setup')}
                  className="h-9 px-3.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.98] rounded-lg transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Connect Live Sheet
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-60 rounded-lg transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`}
                  />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              )}
            </div>
          </header>

          {/* Main Workspace Viewport */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto space-y-6">
            {connection.mode === 'demo' && activeView !== 'setup' && (
              <div className="bg-[#0C172B] border border-amber-500/40 rounded-xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs sm:text-sm text-slate-300">
                  <strong className="font-medium text-amber-300">
                    Showing static CSV snapshot (not connected to a live sheet)
                  </strong>
                  {' · '}
                  Paste your live Google Sheet link in Sheet & Vercel (or set GOOGLE_SHEET_URL) to see live updates.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveView('setup')}
                  className="text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors whitespace-nowrap shrink-0 text-left sm:text-right cursor-pointer"
                >
                  Connect Live Google Sheet →
                </button>
              </div>
            )}

            {syncError && activeView !== 'setup' && (
              <div className="bg-red-950/50 border border-red-800/60 rounded-xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 text-xs sm:text-sm text-red-200">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{syncError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveView('setup')}
                  className="text-xs font-medium text-red-300 hover:text-red-100 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Fix Connection
                </button>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              >
                {activeView === 'overview' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                      <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">
                          Packing Capacity & QC Overview
                        </h1>
                        <p className="text-sm text-slate-400 mt-1">
                          {connection.sourceLabel} ·{' '}
                          {weekFilter !== 'All'
                            ? `${weekFilter}${
                                weekWindow.roleByWeek[weekFilter]
                                  ? ` (${weekWindow.roleByWeek[weekFilter]})`
                                  : ''
                              }`
                            : weekWindow.orderedWindowWeeks
                                .map(
                                  (wk) =>
                                    `${wk} (${weekWindow.roleByWeek[wk]})`
                                )
                                .join(' · ')}{' '}
                          · Synced{' '}
                          <span className="font-mono tabular-nums text-slate-300">
                            {connection.lastSyncedAt}
                          </span>
                        </p>
                      </div>
                      {weekFilter !== 'All' && (
                        <button
                          type="button"
                          onClick={() => setWeekFilter('All')}
                          className="text-xs font-medium text-sky-400 hover:text-sky-300 self-start sm:self-auto transition-colors cursor-pointer"
                        >
                          Show 3-Week Window
                        </button>
                      )}
                    </div>

                    <PackingOverviewVisuals
                      records={overviewScopedRecords}
                      allRecords={records}
                      weekWindow={weekWindow}
                      activeStatusFilter={statusFilter}
                      activeWeekFilter={weekFilter}
                      onSelectStatus={setStatusFilter}
                      onSelectWeek={setWeekFilter}
                      isLoading={isSyncing && records.length === 0}
                    />

                    <PackingQueueTable
                      records={overviewFilteredTableRecords}
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      statusFilter={statusFilter}
                      onStatusFilterChange={setStatusFilter}
                      weekFilter={weekFilter}
                      onWeekFilterChange={setWeekFilter}
                      weekdayFilter={weekdayFilter}
                      onWeekdayFilterChange={setWeekdayFilter}
                      weeks={weekWindow.orderedWindowWeeks}
                      weekdays={availableWeekdays}
                      sortBy={sortBy}
                      onSortByChange={setSortBy}
                      onSelectRecord={setSelectedRecord}
                      onResetFilters={resetFilters}
                      isLoading={isSyncing && records.length === 0}
                      todayRecordId={todayRecord?.id}
                    />
                  </div>
                )}

                {activeView === 'daily' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                      <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">
                          Daily Packing Capacity Log
                        </h1>
                        <p className="text-sm text-slate-400 mt-1">
                          {todayRecord
                            ? `Today (${todayRecord.dateLabel} · ${todayRecord.weekday} · ${todayRecord.weekNo}) · `
                            : ''}
                          All 12 columns from {connection.sourceLabel}
                        </p>
                      </div>
                      {todayRecord && (
                        <CapacityStatusLabel status={todayRecord.status} />
                      )}
                    </div>

                    <CapacityScorecardStrip
                      records={todayRecord ? [todayRecord] : []}
                      isLoading={isSyncing && records.length === 0}
                    />

                    <PackingQueueTable
                      records={filteredRecords}
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      statusFilter={statusFilter}
                      onStatusFilterChange={setStatusFilter}
                      weekFilter={
                        weekFilter !== 'All' &&
                        !dailyAvailableWeeks.includes(weekFilter)
                          ? 'All'
                          : weekFilter
                      }
                      onWeekFilterChange={setWeekFilter}
                      weekdayFilter={weekdayFilter}
                      onWeekdayFilterChange={setWeekdayFilter}
                      weeks={dailyAvailableWeeks}
                      weekdays={availableWeekdays}
                      sortBy={sortBy}
                      onSortByChange={setSortBy}
                      onSelectRecord={setSelectedRecord}
                      onResetFilters={resetFilters}
                      isLoading={isSyncing && records.length === 0}
                      windowDescription={
                        dailyWindow.startDateLabel && dailyWindow.endDateLabel
                          ? `31-day window (${dailyWindow.startDateLabel} – ${dailyWindow.endDateLabel})`
                          : undefined
                      }
                      todayRecordId={todayRecord?.id}
                    />
                  </div>
                )}

                {activeView === 'weekly' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-white">
                        Weekly Capacity Summary
                      </h1>
                      <p className="text-sm text-slate-400 mt-1">
                        Plan vs. Input volume, finished items, PPA/OQC NG, and remaining rework by Week No.
                      </p>
                    </div>

                    <WeeklyCapacityView
                      records={records}
                      weekWindow={weekWindow}
                      onInspectWeek={(wk) => {
                        setWeekFilter(
                          dailyAvailableWeeks.includes(wk) ? wk : 'All'
                        );
                        setStatusFilter('All');
                        setActiveView('daily');
                      }}
                    />
                  </div>
                )}

                {activeView === 'daily-issues' && (
                  <DailyIssuesView
                    records={dailyIssues}
                    sourceLabel={
                      connection.dailyIssuesSynced && connection.dailyIssuesTab
                        ? `Live Tab: ${connection.dailyIssuesTab}`
                        : `Uploaded Snapshot (${connection.dailyIssuesTab || DEFAULT_DAILY_ISSUES_TAB})`
                    }
                    isLoading={isSyncing && dailyIssues.length === 0}
                  />
                )}

                {activeView === 'monthly-issues' && (
                  <MonthlyIssuesView
                    records={monthlyIssues}
                    sourceLabel={
                      connection.monthlyIssuesSynced && connection.monthlyIssuesTab
                        ? `Live Tab: ${connection.monthlyIssuesTab}`
                        : `Uploaded Snapshot (${connection.monthlyIssuesTab || DEFAULT_MONTHLY_ISSUES_TAB})`
                    }
                    isLoading={isSyncing && monthlyIssues.length === 0}
                  />
                )}

                {activeView === 'setup' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-white">
                        Google Sheet & Vercel Setup
                      </h1>
                      <p className="text-sm text-slate-400 mt-1">
                        Connect your live SK Pack Film Google Sheet (all 3 tabs simultaneously) and deploy to Vercel or AI Studio
                      </p>
                    </div>

                    <SheetSetupView
                      connection={connection}
                      user={user}
                      needsAuth={needsAuth}
                      isLoggingIn={isLoggingIn}
                      isSyncing={isSyncing}
                      errorMessage={syncError}
                      onGoogleLogin={handleGoogleLogin}
                      onGoogleLogout={handleGoogleLogout}
                      onConnectPublicSheet={(
                        url,
                        tab,
                        dailyTab,
                        monthlyTab
                      ) =>
                        loadPublicSheet(url, tab, true, dailyTab, monthlyTab)
                      }
                      onFetchPrivateTabs={handleFetchPrivateTabs}
                      onLoadPrivateTab={loadPrivateTab}
                      onLoadSampleData={handleLoadSampleData}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* Daily Record Detail Slide-Over */}
        <OrderDetailDrawer
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      </div>
    </MotionConfig>
  );
}
