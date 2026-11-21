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
  X,
} from 'lucide-react';
import { DailyIssuesView } from './components/DailyIssuesView';
import { LoginView } from './components/LoginView';
import { MonthlyIssuesView } from './components/MonthlyIssuesView';
import { OrderDetailDrawer } from './components/OrderDetailDrawer';
import { PackingQueueTable } from './components/PackingQueueTable';
import { WeeklyCapacityView } from './components/StationsView';
import {
  CapacityScorecardStrip,
  CapacityStatusLabel,
  PackingOverviewVisuals,
} from './components/StatusVisuals';
import {
  formatAuthError,
  getCurrentUserIdToken,
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
} from './types/packing';

type ActiveView =
  | 'overview'
  | 'daily'
  | 'weekly'
  | 'daily-issues'
  | 'monthly-issues';

const STORAGE_PUBLIC_SHEET_KEY = 'packline_public_sheet_config';

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
  sourceLabel: 'Live Google Sheet',
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
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [autoRefreshSec, setAutoRefreshSec] = useState<number>(30);

  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

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
      (authUser) => {
        setUser(authUser);
        setIsAuthChecking(false);
      },
      (rejectedMessage) => {
        setAuthError(rejectedMessage);
      }
    );
    return () => unsubscribe();
  }, []);

  const fetchPublicTabRows = async (sheetUrl: string, tabName?: string) => {
    const idToken = await getCurrentUserIdToken();
    if (!idToken) {
      throw new Error('Authentication required to load company Google Sheets.');
    }

    const params = new URLSearchParams();
    if (sheetUrl) params.set('url', sheetUrl);
    if (tabName) params.set('sheet', tabName);
    params.set('_t', String(Date.now()));

    const res = await fetch(`/api/sheet?${params.toString()}`, {
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
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

  useEffect(() => {
    if (!user) {
      setIsBootstrapping(false);
      return;
    }

    let active = true;
    setIsBootstrapping(true);
    const bootstrap = async () => {
      try {
        try {
          const checkRes = await fetch('/api/sheet?check=1', {
            cache: 'no-store',
          });
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
          // Stay on baseline snapshot
        }
      } finally {
        if (active) setIsBootstrapping(false);
      }
    };
    bootstrap();
    return () => {
      active = false;
    };
  }, [user, loadPublicSheet]);

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
    } else {
      try {
        const checkRes = await fetch('/api/sheet?check=1', {
          cache: 'no-store',
        });
        if (checkRes.ok) {
          const info = await checkRes.json();
          if (info?.hasDefaultEnvSheet) {
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
      setConnection((prev) => ({
        ...prev,
        lastSyncedAt: formatClockTime(new Date()),
      }));
    }
  }, [connection, loadPublicSheet]);

  useEffect(() => {
    if (!user || autoRefreshSec <= 0 || connection.mode === 'demo') return;
    const timer = window.setInterval(() => {
      handleSyncNow();
    }, autoRefreshSec * 1000);
    return () => window.clearInterval(timer);
  }, [user, autoRefreshSec, connection.mode, handleSyncNow]);

  useEffect(() => {
    if (!user || connection.mode === 'demo') return;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleSyncNow();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [user, connection.mode, handleSyncNow]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    setSyncError(null);
    try {
      const signedInUser = await googleSignIn();
      setUser(signedInUser);
    } catch (err) {
      const msg = formatAuthError(err);
      setAuthError(msg);
      setSyncError(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logout();
    setUser(null);
    setAuthError(null);
    setSyncError(null);
    setConnection(DEFAULT_CONNECTION);
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
            ? 'text-[#F2E9FF]'
            : 'text-[#D1B8FF]/65 hover:text-[#F2E9FF] hover:bg-[#6A2FC8]/18'
        }`}
      >
        {active && (
          <motion.span
            layoutId={isMobile ? 'mobileNavActive' : 'desktopNavActive'}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 bg-gradient-to-r from-[#6A2FC8] to-[#9D71E8]/90 rounded-lg shadow-[0_0_24px_-4px_rgba(106,47,200,0.8),inset_0_1px_0_0_rgba(242,233,255,0.28)]"
          />
        )}
        <Icon
          className={`relative z-10 w-4 h-4 shrink-0 transition-transform duration-150 ${
            active ? 'text-[#F2E9FF]' : 'text-[#9D71E8] group-hover:translate-x-0.5'
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
            <div className="text-lg font-bold tracking-tight text-[#F2E9FF] whitespace-nowrap group-hover:text-[#D1B8FF] transition-colors duration-150">
              Insight Dashboard
            </div>
            <p className="text-xs font-medium text-[#9D71E8] tracking-wide mt-0.5 whitespace-nowrap group-hover:text-[#D1B8FF] transition-colors duration-150">
              SK Pack Film Department
            </p>
          </a>
          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="p-1.5 text-[#D1B8FF]/70 hover:text-[#F2E9FF] rounded-md transition-colors cursor-pointer"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="space-y-3.5" aria-label="Primary navigation">
          {/* Packing Section Container */}
          <div className="bg-[#25134D]/35 backdrop-blur-md border border-[#D1B8FF]/14 rounded-xl p-2 space-y-1 shadow-[inset_0_1px_0_0_rgba(242,233,255,0.06)]">
            <p className="px-2.5 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#D1B8FF]/65">
              Packing
            </p>
            <div className="space-y-1">
              {packingNavItems.map((item) => renderNavButton(item, isMobile))}
            </div>
          </div>

          {/* Quality Section Container */}
          <div className="bg-[#25134D]/35 backdrop-blur-md border border-[#D1B8FF]/14 rounded-xl p-2 space-y-1 shadow-[inset_0_1px_0_0_rgba(242,233,255,0.06)]">
            <p className="px-2.5 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#D1B8FF]/65">
              Quality
            </p>
            <div className="space-y-1">
              {qualityNavItems.map((item) => renderNavButton(item, isMobile))}
            </div>
          </div>
        </nav>
      </div>

      {/* Data Source & Signed-In User Summary */}
      <div className="pt-5 border-t border-[#D1B8FF]/14 space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-[#D1B8FF]/65">Data Source</p>
          <p className="text-sm font-semibold text-[#F2E9FF] truncate">
            {isBootstrapping && connection.mode === 'demo'
              ? 'Connecting Live Sheet...'
              : connection.sourceLabel}
          </p>
          <p className="text-xs text-[#D1B8FF]/65 font-mono tabular-nums">
            Synced {connection.lastSyncedAt}
          </p>
        </div>

        <div className="pt-3.5 border-t border-[#D1B8FF]/12">
          {user ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Mail className="w-3.5 h-3.5 text-[#9D71E8] shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-[#D1B8FF]/65">
                    Signed-in User
                  </p>
                  <p
                    className="text-xs font-medium text-[#F2E9FF] truncate"
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
                className="p-1.5 text-[#D1B8FF]/70 hover:text-[#F2E9FF] hover:bg-[#6A2FC8]/25 rounded-md transition-colors duration-150 shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Mail className="w-3.5 h-3.5 text-[#D1B8FF]/50 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-[#D1B8FF]/65">
                    User Account
                  </p>
                  <p className="text-xs text-[#D1B8FF]/65 truncate">
                    Not signed in
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="text-xs font-medium text-[#D1B8FF] hover:text-[#F2E9FF] disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isLoggingIn ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isAuthChecking) {
    return (
      <MotionConfig reducedMotion="user">
        <div className="min-h-screen cosmic-stage text-[#F2E9FF] flex items-center justify-center p-6">
          <div className="glass-panel rounded-2xl px-6 py-4 flex items-center gap-3 text-sm text-[#D1B8FF]">
            <RefreshCw className="w-4 h-4 text-[#9D71E8] animate-spin" />
            <span>Checking sign-in session...</span>
          </div>
        </div>
      </MotionConfig>
    );
  }

  if (!user) {
    return (
      <MotionConfig reducedMotion="user">
        <LoginView
          onSignIn={handleGoogleLogin}
          isLoading={isLoggingIn}
          error={authError}
        />
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen cosmic-stage text-[#F2E9FF] flex relative">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 glass-sidebar border-r sticky top-0 h-screen z-20">
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
                transition={{ duration: 0.18 }}
                className="fixed inset-0 bg-[#0B0720]/75 backdrop-blur-sm"
                onClick={() => setMobileNavOpen(false)}
                aria-hidden="true"
              />
              <motion.aside
                initial={{ x: -260 }}
                animate={{ x: 0 }}
                exit={{ x: -260 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-64 glass-sidebar border-r h-full shadow-[20px_0_50px_-15px_rgba(106,47,200,0.45)]"
              >
                {renderSidebarContent(true)}
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 flex flex-col relative z-10">
          {/* Top Bar */}
          <header className="h-14 glass-header border-b px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="lg:hidden p-2 -ml-2 text-[#D1B8FF]/80 hover:text-[#F2E9FF] rounded-lg hover:bg-[#6A2FC8]/25 transition-colors cursor-pointer"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <span className="text-sm font-medium text-[#D1B8FF] truncate">
                {viewTitles[activeView]}
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <select
                value={autoRefreshSec}
                onChange={(e) => setAutoRefreshSec(Number(e.target.value))}
                aria-label="Auto-sync interval"
                className="hidden sm:block h-9 px-2.5 text-xs font-medium glass-control rounded-lg cursor-pointer"
              >
                <option value={0}>Sync: Manual</option>
                <option value={30}>Auto-Sync: 30s</option>
                <option value={60}>Auto-Sync: 60s</option>
              </select>

              <button
                type="button"
                onClick={handleSyncNow}
                disabled={isBootstrapping || isSyncing}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-medium btn-violet-glow disabled:opacity-60 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    isBootstrapping || isSyncing ? 'animate-spin' : ''
                  }`}
                />
                <span>
                  {isBootstrapping || isSyncing ? 'Syncing...' : 'Sync Now'}
                </span>
              </button>
            </div>
          </header>

          {/* Main Workspace Viewport */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto space-y-6">
            {syncError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-950/45 backdrop-blur-md border border-rose-400/35 rounded-xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_24px_-8px_rgba(244,63,94,0.4)]"
              >
                <div className="flex items-start gap-2.5 text-xs sm:text-sm text-rose-100">
                  <AlertCircle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
                  <span>{syncError}</span>
                </div>
                <button
                  type="button"
                  onClick={handleSyncNow}
                  className="text-xs font-medium text-rose-200 hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Retry Sync
                </button>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                {activeView === 'overview' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                      <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#F2E9FF]">
                          Packing Capacity & QC Overview
                        </h1>
                        <p className="text-sm text-[#D1B8FF]/70 mt-1">
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
                          <span className="font-mono tabular-nums text-[#F2E9FF]">
                            {connection.lastSyncedAt}
                          </span>
                        </p>
                      </div>
                      {weekFilter !== 'All' && (
                        <button
                          type="button"
                          onClick={() => setWeekFilter('All')}
                          className="text-xs font-medium text-[#D1B8FF] hover:text-[#F2E9FF] self-start sm:self-auto transition-colors cursor-pointer"
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
                        <h1 className="text-2xl font-bold tracking-tight text-[#F2E9FF]">
                          Daily Packing Capacity Log
                        </h1>
                        <p className="text-sm text-[#D1B8FF]/70 mt-1">
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
                      <h1 className="text-2xl font-bold tracking-tight text-[#F2E9FF]">
                        Weekly Capacity Summary
                      </h1>
                      <p className="text-sm text-[#D1B8FF]/70 mt-1">
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
