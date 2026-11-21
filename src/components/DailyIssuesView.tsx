import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Info,
  Search,
  X,
} from 'lucide-react';
import { DailyIssueRow, IssueSeverity } from '../types/packing';
import {
  getCurrentYearMonth,
  getIssueYearMonth,
} from '../lib/issuesParser';
import { CosmicDonutChart, CosmicTrendBarChart } from './CosmicCharts';

const SEVERITY_ORDER: IssueSeverity[] = ['Major', 'Minor', 'Other'];

const SEVERITY_META: Record<
  IssueSeverity,
  {
    label: string;
    color: string;
    highlightColor: string;
    textClass: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  Major: {
    label: 'Major',
    color: '#FB7185',
    highlightColor: '#FDA4AF',
    textClass: 'text-rose-400',
    icon: AlertTriangle,
  },
  Minor: {
    label: 'Minor (Miner)',
    color: '#FBBF24',
    highlightColor: '#FDE68A',
    textClass: 'text-amber-300',
    icon: Info,
  },
  Other: {
    label: 'Other',
    color: '#38BDF8',
    highlightColor: '#7DD3FC',
    textClass: 'text-sky-300',
    icon: CheckCircle2,
  },
};

function SeverityLabel({
  severity,
  rawLabel,
}: {
  severity: IssueSeverity;
  rawLabel?: string;
}) {
  const meta = SEVERITY_META[severity];
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${meta.textClass}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{rawLabel || meta.label}</span>
    </span>
  );
}

const MONTH_NAMES: Record<number, string> = {
  1: 'Jan',
  2: 'Feb',
  3: 'Mar',
  4: 'Apr',
  5: 'May',
  6: 'Jun',
  7: 'Jul',
  8: 'Aug',
  9: 'Sep',
  10: 'Oct',
  11: 'Nov',
  12: 'Dec',
};

interface DailyIssuesViewProps {
  records: DailyIssueRow[];
  sourceLabel: string;
  isLoading?: boolean;
}

export function DailyIssuesView({
  records,
  sourceLabel,
  isLoading = false,
}: DailyIssuesViewProps) {
  const currentMonthInfo = useMemo(() => getCurrentYearMonth(), []);

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(
    currentMonthInfo.key
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<IssueSeverity | 'All'>(
    'All'
  );
  const [lineFilter, setLineFilter] = useState<string>('All');
  const [conditionFilter, setConditionFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date' | 'qty' | 'line'>('date');
  const [selectedIssue, setSelectedIssue] = useState<DailyIssueRow | null>(
    null
  );

  const availableMonthOptions = useMemo(() => {
    const map = new Map<
      string,
      { key: string; label: string; year: number; month: number; count: number }
    >();

    map.set(currentMonthInfo.key, {
      key: currentMonthInfo.key,
      label: currentMonthInfo.label,
      year: currentMonthInfo.year,
      month: currentMonthInfo.month,
      count: 0,
    });

    for (const r of records) {
      const ym = getIssueYearMonth(r);
      if (ym.key === 'unknown') continue;
      const existing = map.get(ym.key) ?? {
        key: ym.key,
        label: ym.label,
        year: ym.year,
        month: ym.month,
        count: 0,
      };
      existing.count += 1;
      map.set(ym.key, existing);
    }

    return Array.from(map.values()).sort((a, b) =>
      b.year !== a.year ? b.year - a.year : b.month - a.month
    );
  }, [records, currentMonthInfo]);

  const monthScopedRecords = useMemo(() => {
    if (selectedMonthKey === 'All') return records;
    return records.filter(
      (row) => getIssueYearMonth(row).key === selectedMonthKey
    );
  }, [records, selectedMonthKey]);

  const activeMonthLabel = useMemo(() => {
    if (selectedMonthKey === 'All') return 'All Months';
    const match = availableMonthOptions.find((m) => m.key === selectedMonthKey);
    return match ? match.label : currentMonthInfo.label;
  }, [availableMonthOptions, selectedMonthKey, currentMonthInfo.label]);

  const availableLines = useMemo(() => {
    const set = new Set<string>();
    monthScopedRecords.forEach((r) => {
      if (r.user) set.add(r.user);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [monthScopedRecords]);

  const availableConditions = useMemo(() => {
    const set = new Set<string>();
    monthScopedRecords.forEach((r) => {
      if (r.condition) set.add(r.condition);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [monthScopedRecords]);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const res = monthScopedRecords.filter((row) => {
      if (severityFilter !== 'All' && row.severity !== severityFilter)
        return false;
      if (lineFilter !== 'All' && row.user !== lineFilter) return false;
      if (conditionFilter !== 'All' && row.condition !== conditionFilter)
        return false;
      if (q) {
        const hay = [
          row.dateLabel,
          row.user,
          row.errorCase,
          row.tpkNo,
          row.condition,
          row.severityRaw,
          row.remark,
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    res.sort((a, b) => {
      if (sortBy === 'qty') return b.qtyError - a.qtyError;
      if (sortBy === 'line') return a.user.localeCompare(b.user);
      return b.dateSortKey - a.dateSortKey;
    });

    return res;
  }, [
    monthScopedRecords,
    searchQuery,
    severityFilter,
    lineFilter,
    conditionFilter,
    sortBy,
  ]);

  const scopedForVisuals = useMemo(() => {
    return monthScopedRecords.filter((row) => {
      if (conditionFilter !== 'All' && row.condition !== conditionFilter)
        return false;
      return true;
    });
  }, [monthScopedRecords, conditionFilter]);

  const totalCases = scopedForVisuals.length;
  const totalQtyError = scopedForVisuals.reduce((s, r) => s + r.qtyError, 0);
  const majorCases = scopedForVisuals.filter((r) => r.severity === 'Major');
  const minorCases = scopedForVisuals.filter((r) => r.severity === 'Minor');
  const majorQty = majorCases.reduce((s, r) => s + r.qtyError, 0);
  const minorQty = minorCases.reduce((s, r) => s + r.qtyError, 0);
  const majorCasePct =
    totalCases > 0 ? Math.round((majorCases.length / totalCases) * 1000) / 10 : 0;
  const generalCasesCount = scopedForVisuals.filter(
    (r) => r.condition.toLowerCase() === 'general'
  ).length;
  const tradeCasesCount = scopedForVisuals.filter(
    (r) => r.condition.toLowerCase() === 'trade'
  ).length;
  const generalSharePct =
    totalCases > 0
      ? Math.round((generalCasesCount / totalCases) * 1000) / 10
      : 0;

  const lineBreakdown = useMemo(() => {
    const map = new Map<
      string,
      { line: string; cases: number; qtyError: number; majorQty: number }
    >();
    for (const r of scopedForVisuals) {
      const existing = map.get(r.user) ?? {
        line: r.user,
        cases: 0,
        qtyError: 0,
        majorQty: 0,
      };
      existing.cases += 1;
      existing.qtyError += r.qtyError;
      if (r.severity === 'Major') existing.majorQty += r.qtyError;
      map.set(r.user, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.qtyError - a.qtyError);
  }, [scopedForVisuals]);

  const errorCaseBreakdown = useMemo(() => {
    const map = new Map<
      string,
      { errorCase: string; cases: number; qtyError: number }
    >();
    for (const r of scopedForVisuals) {
      const existing = map.get(r.errorCase) ?? {
        errorCase: r.errorCase,
        cases: 0,
        qtyError: 0,
      };
      existing.cases += 1;
      existing.qtyError += r.qtyError;
      map.set(r.errorCase, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.qtyError - a.qtyError);
  }, [scopedForVisuals]);

  const topLine = lineBreakdown[0];
  const topErrorCase = errorCaseBreakdown[0];
  const maxLineQty = Math.max(1, ...lineBreakdown.map((l) => l.qtyError));

  const dailyTrend = useMemo(() => {
    const map = new Map<
      string,
      {
        dateLabel: string;
        sortKey: number;
        majorQty: number;
        minorQty: number;
        totalQty: number;
        cases: number;
      }
    >();
    for (const r of scopedForVisuals) {
      const key = r.dateLabel;
      const existing = map.get(key) ?? {
        dateLabel: r.dateLabel,
        sortKey: r.dateSortKey,
        majorQty: 0,
        minorQty: 0,
        totalQty: 0,
        cases: 0,
      };
      existing.cases += 1;
      existing.totalQty += r.qtyError;
      if (r.severity === 'Major') existing.majorQty += r.qtyError;
      else existing.minorQty += r.qtyError;
      map.set(key, existing);
    }
    return Array.from(map.values())
      .sort((a, b) => a.sortKey - b.sortKey)
      .slice(-22);
  }, [scopedForVisuals]);

  const maxDailyTrendQty = Math.max(1, ...dailyTrend.map((d) => d.totalQty));

  // Severity Donut & Trend Chart Data
  const activeSeverities = SEVERITY_ORDER.filter((sev) =>
    scopedForVisuals.some((r) => r.severity === sev)
  );
  const severityDonutSegments = activeSeverities.map((sev) => {
    const matching = scopedForVisuals.filter((r) => r.severity === sev);
    const count = matching.length;
    const qty = matching.reduce((s, r) => s + r.qtyError, 0);
    return {
      id: sev,
      label: SEVERITY_META[sev].label,
      subLabel: `${qty.toLocaleString()} error qty`,
      count,
      valueText: `${count} (${qty}q)`,
      color: SEVERITY_META[sev].color,
      highlightColor: SEVERITY_META[sev].highlightColor,
    };
  });

  const dailyErrorTrendItems = dailyTrend.map((day) => ({
    id: day.dateLabel,
    axisLabel: day.dateLabel,
    headerTitle: day.dateLabel,
    headerSub: `${day.cases} logged ${day.cases === 1 ? 'case' : 'cases'}`,
    totalValue: day.totalQty,
    segments: [
      {
        key: 'minor',
        label: 'Minor / Other',
        value: day.minorQty,
        gradientClass: 'bg-gradient-to-t from-amber-500/85 via-amber-400 to-amber-200',
        swatchClass: 'bg-amber-300',
        glowColor: 'rgba(252, 211, 77, 0.65)',
      },
      {
        key: 'major',
        label: 'Major',
        value: day.majorQty,
        gradientClass: 'bg-gradient-to-t from-rose-500/85 via-rose-400 to-rose-300',
        swatchClass: 'bg-rose-400',
        glowColor: 'rgba(251, 113, 133, 0.7)',
      },
    ],
  }));

  const tableTotals = filteredRecords.reduce(
    (acc, r) => {
      acc.qtyError += r.qtyError;
      if (r.severity === 'Major') acc.majorCount += 1;
      else acc.minorCount += 1;
      return acc;
    },
    { qtyError: 0, majorCount: 0, minorCount: 0 }
  );

  const hasFilters =
    searchQuery.trim() !== '' ||
    severityFilter !== 'All' ||
    lineFilter !== 'All' ||
    conditionFilter !== 'All' ||
    selectedMonthKey !== currentMonthInfo.key;

  const resetFilters = () => {
    setSearchQuery('');
    setSeverityFilter('All');
    setLineFilter('All');
    setConditionFilter('All');
    setSelectedMonthKey(currentMonthInfo.key);
  };

  const handleExportCsv = () => {
    const headers = [
      'Date',
      'User',
      'Error Case',
      "Qty's Error",
      'Month',
      'Condition',
      'Case Severity',
      'Year',
      'TPK no.',
      'Remark',
    ];
    const escape = (val: string | number) => {
      const s = String(val);
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };
    const lines = [
      headers.map(escape).join(','),
      ...filteredRecords.map((r) =>
        [
          r.dateLabel,
          r.user,
          r.errorCase,
          r.qtyError,
          r.month,
          r.condition,
          r.severityRaw,
          r.year,
          r.tpkNo,
          r.remark,
        ]
          .map(escape)
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `daily-internal-issues-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F2E9FF]">
            Daily Internal Issues
          </h1>
          <p className="text-sm text-[#D1B8FF]/70 mt-1">
            {activeMonthLabel}
            {selectedMonthKey === currentMonthInfo.key
              ? ' (Current Month)'
              : ''}{' '}
            · Internal quality defect log across production lines · {sourceLabel}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <select
            value={selectedMonthKey}
            onChange={(e) => {
              setSelectedMonthKey(e.target.value);
              setLineFilter('All');
              setConditionFilter('All');
            }}
            aria-label="Select month"
            className="h-9 px-3 text-xs font-medium glass-control rounded-lg cursor-pointer"
          >
            {availableMonthOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.key === currentMonthInfo.key
                  ? `${opt.label} (Current · ${opt.count})`
                  : `${opt.label} (${opt.count})`}
              </option>
            ))}
            <option value="All">All Months ({records.length})</option>
          </select>

          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-medium text-[#D1B8FF] hover:text-[#F2E9FF] transition-colors cursor-pointer"
            >
              Reset to Current Month
            </button>
          )}
        </div>
      </div>

      {/* 4 Scorecards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="glass-panel rounded-2xl p-5 h-28 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="glass-panel-interactive rounded-2xl p-5"
          >
            <p className="text-xs font-medium text-[#D1B8FF]/70">
              Total Qty&apos;s Error
            </p>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-2xl font-semibold tracking-tight text-rose-400 font-mono tabular-nums">
                {totalQtyError.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-[#D1B8FF]/65 font-mono tabular-nums">
                {totalCases > 0
                  ? `${(totalQtyError / totalCases).toFixed(1)} avg/case`
                  : '0'}
              </span>
            </div>
            <div className="mt-2.5 h-1.5 w-full bg-[#0B0720]/75 border border-[#D1B8FF]/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${
                    totalQtyError > 0 ? (majorQty / totalQtyError) * 100 : 0
                  }%`,
                }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.65)]"
              />
            </div>
            <p className="mt-2 text-xs text-[#D1B8FF]/65 font-mono tabular-nums">
              Major: {majorQty} · Minor: {minorQty}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
            className="glass-panel-interactive rounded-2xl p-5"
          >
            <p className="text-xs font-medium text-[#D1B8FF]/70">
              Total Issue Cases
            </p>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-2xl font-semibold tracking-tight text-[#F2E9FF] font-mono tabular-nums">
                {totalCases.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-[#D1B8FF] font-mono tabular-nums">
                {generalSharePct}% General
              </span>
            </div>
            <div className="mt-2.5 h-1.5 w-full bg-[#0B0720]/75 border border-[#D1B8FF]/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${generalSharePct}%` }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-[#6A2FC8] to-[#9D71E8] shadow-[0_0_10px_rgba(157,113,232,0.75)]"
              />
            </div>
            <p className="mt-2 text-xs text-[#D1B8FF]/65 font-mono tabular-nums">
              General: {generalCasesCount} · Trade: {tradeCasesCount}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="glass-panel-interactive rounded-2xl p-5"
          >
            <p className="text-xs font-medium text-[#D1B8FF]/70">
              Major Severity Share
            </p>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-2xl font-semibold tracking-tight text-amber-300 font-mono tabular-nums">
                {majorCasePct}%
              </span>
              <span className="text-xs text-[#D1B8FF]/65 font-mono tabular-nums">
                {majorCases.length} / {totalCases} cases
              </span>
            </div>
            <div className="mt-2.5 h-1.5 w-full bg-[#0B0720]/75 border border-[#D1B8FF]/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${majorCasePct}%` }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.65)]"
              />
            </div>
            <p className="mt-2 text-xs text-[#D1B8FF]/65 font-mono tabular-nums">
              {minorCases.length} Minor ({minorQty} qty) logged
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="glass-panel-interactive rounded-2xl p-5"
          >
            <p className="text-xs font-medium text-[#D1B8FF]/70">
              Top Line &amp; Error Case
            </p>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-xl font-semibold tracking-tight text-[#F2E9FF] truncate">
                {topLine ? topLine.line : '—'}
              </span>
              <span className="text-xs text-rose-400 font-mono tabular-nums shrink-0">
                {topLine ? `${topLine.qtyError} qty` : '0 qty'}
              </span>
            </div>
            <p className="mt-3 text-xs text-[#D1B8FF]/80 truncate">
              Top Issue:{' '}
              <span className="text-[#D1B8FF] font-medium">
                {topErrorCase ? topErrorCase.errorCase : '—'}
              </span>
              {topErrorCase && (
                <span className="text-[#D1B8FF]/65 font-mono">
                  {' '}
                  ({topErrorCase.qtyError})
                </span>
              )}
            </p>
          </motion.div>
        </div>
      )}

      {/* Primary Visuals Row: Severity Donut + Line Breakdown Progress Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-5 glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-[#F2E9FF]">
                Case Severity Breakdown
              </h2>
              <p className="text-xs text-[#D1B8FF]/65 mt-0.5">
                Click a severity row to filter the issues log
              </p>
            </div>
            {severityFilter !== 'All' && (
              <button
                type="button"
                onClick={() => setSeverityFilter('All')}
                className="text-xs font-medium text-[#D1B8FF] hover:text-[#F2E9FF] cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          <CosmicDonutChart
            segments={severityDonutSegments}
            totalCount={totalCases}
            totalLabel="Cases"
            activeFilter={severityFilter}
            onSelect={(id) => setSeverityFilter(id as IssueSeverity | 'All')}
            ariaLabel="Issue severity breakdown ring chart"
          />
        </section>

        {/* Line (User) Segmented Severity Bars */}
        <section className="lg:col-span-7 glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#F2E9FF]">
                Issues by Production Line (User)
              </h2>
              <p className="text-xs text-[#D1B8FF]/65 mt-0.5">
                Major vs. Minor quantity per line · Click a line to filter
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#D1B8FF]/70">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.65)]" />
                <span>Major</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#9D71E8] shadow-[0_0_8px_rgba(157,113,232,0.75)]" />
                <span>Minor / Other</span>
              </span>
              {lineFilter !== 'All' && (
                <button
                  type="button"
                  onClick={() => setLineFilter('All')}
                  className="text-xs font-medium text-[#D1B8FF] hover:text-[#F2E9FF] cursor-pointer"
                >
                  All Lines
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {lineBreakdown.length === 0 ? (
              <p className="text-sm text-[#D1B8FF]/65 py-8 text-center">
                No line issues found for current filters.
              </p>
            ) : (
              lineBreakdown.map((item) => {
                const widthPct = (item.qtyError / maxLineQty) * 100;
                const majorShareOfBar =
                  item.qtyError > 0
                    ? (item.majorQty / item.qtyError) * 100
                    : 0;
                const minorShareOfBar = Math.max(0, 100 - majorShareOfBar);
                const sharePct =
                  totalQtyError > 0
                    ? Math.round((item.qtyError / totalQtyError) * 1000) / 10
                    : 0;
                const isSelected = lineFilter === item.line;
                return (
                  <button
                    key={item.line}
                    type="button"
                    onClick={() =>
                      setLineFilter(isSelected ? 'All' : item.line)
                    }
                    className={`w-full text-left p-2.5 -mx-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-[#6A2FC8]/30 ring-1 ring-[#9D71E8]/55'
                        : 'hover:bg-[#6A2FC8]/15'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2 text-xs mb-1.5">
                      <span className="font-medium text-[#F2E9FF]">
                        {item.line}
                      </span>
                      <span className="font-mono tabular-nums text-[#D1B8FF]/80">
                        <strong className="text-[#F2E9FF]">
                          {item.qtyError}
                        </strong>{' '}
                        qty ({item.cases} {item.cases === 1 ? 'case' : 'cases'}{' '}
                        · {sharePct}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-[#0B0720]/75 border border-[#D1B8FF]/12 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPct}%` }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full overflow-hidden flex shadow-[0_0_12px_rgba(157,113,232,0.55)]"
                      >
                        {item.majorQty > 0 && (
                          <div
                            className="h-full bg-gradient-to-r from-rose-500 to-rose-400"
                            style={{ width: `${majorShareOfBar}%` }}
                          />
                        )}
                        {minorShareOfBar > 0 && (
                          <div
                            className="h-full bg-gradient-to-r from-[#6A2FC8] to-[#9D71E8]"
                            style={{ width: `${minorShareOfBar}%` }}
                          />
                        )}
                      </motion.div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Secondary Row: Daily Error Trend Bar Chart + Top Error Cases */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#F2E9FF]">
                Daily Internal Error Trend
              </h2>
              <p className="text-xs text-[#D1B8FF]/65 mt-0.5">
                Last {dailyTrend.length} active issue dates · Hover a bar for exact counts
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#D1B8FF]/70">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.65)]" />
                <span>Major</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.65)]" />
                <span>Minor</span>
              </span>
            </div>
          </div>

          <CosmicTrendBarChart
            items={dailyErrorTrendItems}
            maxValue={maxDailyTrendQty}
            unitLabel="qty"
            emptyMessage="No trend data for current filter."
            heightClass="h-44"
          />
        </section>

        <section className="lg:col-span-5 glass-panel rounded-2xl p-6">
          <h2 className="text-base font-semibold text-[#F2E9FF]">
            Error Case Ranking
          </h2>
          <p className="text-xs text-[#D1B8FF]/65 mt-0.5">
            Breakdown by defect type across {totalCases} logged cases
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#D1B8FF]/16 text-xs font-medium text-[#D1B8FF]/70">
                  <th className="py-2 pr-3 font-medium">Error Case</th>
                  <th className="py-2 px-3 font-medium text-right">Cases</th>
                  <th className="py-2 px-3 font-medium text-right">Qty</th>
                  <th className="py-2 pl-3 font-medium text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1B8FF]/10 text-sm">
                {errorCaseBreakdown.map((item) => {
                  const pct =
                    totalQtyError > 0
                      ? Math.round((item.qtyError / totalQtyError) * 1000) / 10
                      : 0;
                  return (
                    <tr
                      key={item.errorCase}
                      onClick={() => setSearchQuery(item.errorCase)}
                      className="h-9 hover:bg-[#6A2FC8]/18 transition-colors duration-150 cursor-pointer"
                    >
                      <td className="py-1.5 pr-3 font-medium text-[#F2E9FF]/90 truncate max-w-[180px]">
                        {item.errorCase}
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono tabular-nums text-[#D1B8FF]/65">
                        {item.cases}
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono tabular-nums text-[#F2E9FF] font-semibold">
                        {item.qtyError}
                      </td>
                      <td className="py-1.5 pl-3 text-right font-mono tabular-nums text-[#D1B8FF]">
                        {pct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Interactive Table */}
      <section className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[#D1B8FF]/14 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-[#F2E9FF]">
                Daily Internal Issues Log
              </h2>
              <p className="text-xs text-[#D1B8FF]/65 mt-0.5 font-mono tabular-nums">
                Showing {filteredRecords.length}{' '}
                {filteredRecords.length === 1 ? 'case' : 'cases'} ·{' '}
                {tableTotals.qtyError.toLocaleString()} error qty
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {hasFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#D1B8FF] hover:text-[#F2E9FF] bg-[#6A2FC8]/25 hover:bg-[#6A2FC8]/40 border border-[#9D71E8]/30 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear Filters</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={filteredRecords.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium glass-control disabled:opacity-50 rounded-lg cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#D1B8FF]" />
                <span>Download CSV</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#0B0720]/70 border border-[#D1B8FF]/14 rounded-xl w-fit">
            {(['All', 'Major', 'Minor'] as const).map((sev) => {
              const active = severityFilter === sev;
              return (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverityFilter(sev)}
                  className={`relative px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-150 cursor-pointer ${
                    active
                      ? 'text-[#F2E9FF]'
                      : 'text-[#D1B8FF]/65 hover:text-[#F2E9FF]'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="dailyIssueSeverityPill"
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute inset-0 bg-gradient-to-r from-[#6A2FC8] to-[#9D71E8]/90 rounded-lg shadow-[0_0_18px_-4px_rgba(106,47,200,0.8)]"
                    />
                  )}
                  <span className="relative z-10">
                    {sev === 'Minor' ? 'Minor (Miner)' : sev}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-4 relative">
              <Search className="w-4 h-4 text-[#9D71E8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search TPK no., error case, line, remark..."
                aria-label="Search internal issues"
                className="w-full h-10 pl-9 pr-3 text-sm glass-control rounded-lg placeholder:text-[#D1B8FF]/40"
              />
            </div>

            <div className="lg:col-span-2">
              <select
                value={selectedMonthKey}
                onChange={(e) => {
                  setSelectedMonthKey(e.target.value);
                  setLineFilter('All');
                  setConditionFilter('All');
                }}
                aria-label="Filter by Month"
                className="w-full h-10 px-3 text-sm glass-control rounded-lg cursor-pointer"
              >
                {availableMonthOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.key === currentMonthInfo.key
                      ? `${opt.label} (Current)`
                      : opt.label}
                  </option>
                ))}
                <option value="All">All Months</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <select
                value={lineFilter}
                onChange={(e) => setLineFilter(e.target.value)}
                aria-label="Filter by Line"
                className="w-full h-10 px-3 text-sm glass-control rounded-lg cursor-pointer"
              >
                <option value="All">All Lines (Users)</option>
                {availableLines.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
                aria-label="Filter by Condition"
                className="w-full h-10 px-3 text-sm glass-control rounded-lg cursor-pointer"
              >
                <option value="All">All Conditions</option>
                {availableConditions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'date' | 'qty' | 'line')
                }
                aria-label="Sort internal issues"
                className="w-full h-10 px-3 text-sm glass-control rounded-lg cursor-pointer"
              >
                <option value="date">Sort: Latest Date</option>
                <option value="qty">Sort: Highest Qty</option>
                <option value="line">Sort: Line</option>
              </select>
            </div>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-[#F2E9FF]">
              No issue rows match the current filter
            </p>
            <p className="text-xs text-[#D1B8FF]/65 mt-1">
              Adjust your search, line, or severity filter.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0B0720]/65 border-b border-[#D1B8FF]/14 text-xs font-medium text-[#D1B8FF]/70 whitespace-nowrap">
                    <th className="py-2.5 pl-5 pr-3 font-medium">Date</th>
                    <th className="py-2.5 px-3 font-medium">User</th>
                    <th className="py-2.5 px-3 font-medium">Error Case</th>
                    <th className="py-2.5 px-3 font-medium text-right">
                      Qty&apos;s Error
                    </th>
                    <th className="py-2.5 px-3 font-medium text-center">
                      Month
                    </th>
                    <th className="py-2.5 px-3 font-medium">Condition</th>
                    <th className="py-2.5 px-3 font-medium">Case Severity</th>
                    <th className="py-2.5 px-3 font-medium">Year</th>
                    <th className="py-2.5 px-3 font-medium">TPK no.</th>
                    <th className="py-2.5 pl-3 pr-5 font-medium">Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D1B8FF]/10 text-sm">
                  {filteredRecords.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedIssue(row)}
                      className="h-10 hover:bg-[#6A2FC8]/18 transition-colors duration-150 cursor-pointer"
                    >
                      <td className="py-2 pl-5 pr-3 font-mono text-xs text-[#D1B8FF]/85 whitespace-nowrap">
                        {row.dateLabel}
                      </td>
                      <td className="py-2 px-3 font-medium text-[#F2E9FF] whitespace-nowrap">
                        {row.user}
                      </td>
                      <td className="py-2 px-3 text-[#F2E9FF]/90 whitespace-nowrap">
                        {row.errorCase}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-mono tabular-nums font-semibold whitespace-nowrap ${
                          row.qtyError >= 4 ? 'text-rose-400' : 'text-[#F2E9FF]'
                        }`}
                      >
                        {row.qtyError}
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-xs text-[#D1B8FF]/65 whitespace-nowrap">
                        {row.month}
                      </td>
                      <td className="py-2 px-3 text-xs text-[#D1B8FF]/80 whitespace-nowrap">
                        {row.condition}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <SeverityLabel
                          severity={row.severity}
                          rawLabel={row.severityRaw}
                        />
                      </td>
                      <td className="py-2 px-3 font-mono text-xs text-[#D1B8FF]/65 whitespace-nowrap">
                        {row.year}
                      </td>
                      <td className="py-2 px-3 font-mono text-xs text-[#D1B8FF] whitespace-nowrap">
                        {row.tpkNo}
                      </td>
                      <td className="py-2 pl-3 pr-5 text-xs text-[#D1B8FF]/65 max-w-[220px] truncate">
                        {row.remark || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#0B0720]/70 border-t-2 border-[#9D71E8]/35 text-sm font-semibold">
                    <td className="py-3 pl-5 pr-3 text-[#F2E9FF] whitespace-nowrap">
                      Total ({filteredRecords.length} cases)
                    </td>
                    <td className="py-3 px-3 text-xs font-mono text-[#D1B8FF]/60 whitespace-nowrap">
                      —
                    </td>
                    <td className="py-3 px-3 text-xs font-mono text-[#D1B8FF] whitespace-nowrap">
                      {tableTotals.majorCount} Major · {tableTotals.minorCount}{' '}
                      Minor
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-rose-400 whitespace-nowrap">
                      {tableTotals.qtyError.toLocaleString()}
                    </td>
                    <td colSpan={6} className="py-3 px-3" />
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="md:hidden divide-y divide-[#D1B8FF]/10">
              {filteredRecords.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setSelectedIssue(row)}
                  className="w-full p-4 text-left hover:bg-[#6A2FC8]/15 transition-colors cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#F2E9FF]">
                      {row.errorCase}
                    </span>
                    <SeverityLabel
                      severity={row.severity}
                      rawLabel={row.severityRaw}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#D1B8FF]/65 font-mono">
                    <span>
                      {row.dateLabel} · {row.user}
                    </span>
                    <span className="text-rose-400 font-semibold">
                      Qty: {row.qtyError}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#D1B8FF]/65">
                    <span className="font-mono text-[#D1B8FF]">
                      {row.tpkNo}
                    </span>
                    <span>{row.condition}</span>
                  </div>
                  {row.remark && (
                    <p className="text-xs text-[#D1B8FF]/80 truncate">
                      Remark: {row.remark}
                    </p>
                  )}
                </button>
              ))}
              <div className="p-4 bg-[#0B0720]/70 border-t-2 border-[#9D71E8]/35 flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-[#F2E9FF]">
                  Total ({filteredRecords.length} cases)
                </span>
                <span className="font-semibold text-rose-400">
                  Qty Error: {tableTotals.qtyError}
                </span>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Slide-over Detail Drawer */}
      <AnimatePresence>
        {selectedIssue && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 bg-[#0B0720]/75 backdrop-blur-sm"
              onClick={() => setSelectedIssue(null)}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-md glass-sidebar border-l border-[#D1B8FF]/18 h-full overflow-y-auto p-6 flex flex-col justify-between shadow-[-24px_0_64px_-16px_rgba(106,47,200,0.4)]"
              role="dialog"
              aria-label="Issue Detail"
            >
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#D1B8FF]/14">
                  <div>
                    <p className="text-xs font-mono text-[#D1B8FF]">
                      {selectedIssue.tpkNo}
                    </p>
                    <h2 className="text-xl font-bold text-[#F2E9FF] mt-0.5">
                      {selectedIssue.errorCase}
                    </h2>
                    <p className="text-xs text-[#D1B8FF]/65 mt-1">
                      {selectedIssue.dateLabel} · {selectedIssue.user}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedIssue(null)}
                    className="p-2 text-[#D1B8FF]/70 hover:text-[#F2E9FF] rounded-lg hover:bg-[#6A2FC8]/25 cursor-pointer"
                    aria-label="Close detail"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-[#25134D]/45 border border-[#D1B8FF]/14 rounded-xl p-3.5">
                    <dt className="text-xs text-[#D1B8FF]/65">
                      Qty&apos;s Error
                    </dt>
                    <dd className="text-xl font-semibold text-rose-400 font-mono tabular-nums mt-1">
                      {selectedIssue.qtyError}
                    </dd>
                  </div>
                  <div className="bg-[#25134D]/45 border border-[#D1B8FF]/14 rounded-xl p-3.5">
                    <dt className="text-xs text-[#D1B8FF]/65">Case Severity</dt>
                    <dd className="mt-1.5">
                      <SeverityLabel
                        severity={selectedIssue.severity}
                        rawLabel={selectedIssue.severityRaw}
                      />
                    </dd>
                  </div>
                  <div className="bg-[#25134D]/45 border border-[#D1B8FF]/14 rounded-xl p-3.5">
                    <dt className="text-xs text-[#D1B8FF]/65">Condition</dt>
                    <dd className="text-[#F2E9FF] font-medium mt-1">
                      {selectedIssue.condition}
                    </dd>
                  </div>
                  <div className="bg-[#25134D]/45 border border-[#D1B8FF]/14 rounded-xl p-3.5">
                    <dt className="text-xs text-[#D1B8FF]/65">Month / Year</dt>
                    <dd className="text-[#F2E9FF] font-mono mt-1">
                      {MONTH_NAMES[selectedIssue.month] || selectedIssue.month}{' '}
                      {selectedIssue.year}
                    </dd>
                  </div>
                </dl>

                <div className="bg-[#25134D]/45 border border-[#D1B8FF]/14 rounded-xl p-4">
                  <p className="text-xs font-medium text-[#D1B8FF]/65 mb-1.5">
                    Remark
                  </p>
                  <p className="text-sm text-[#F2E9FF]">
                    {selectedIssue.remark || 'No remark recorded.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedIssue(null)}
                className="mt-6 w-full h-10 text-sm font-medium rounded-lg btn-violet-glow cursor-pointer"
              >
                Close
              </button>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
