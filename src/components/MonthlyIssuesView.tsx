import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Search,
} from 'lucide-react';
import { MonthlyIssueRow, MonthlyIssueStatus } from '../types/packing';
import { CosmicDonutChart, CosmicTrendBarChart } from './CosmicCharts';

const MONTHLY_STATUS_ORDER: MonthlyIssueStatus[] = [
  'On Target',
  'Watch',
  'High NG',
  'Pending',
];

const MONTHLY_STATUS_META: Record<
  MonthlyIssueStatus,
  {
    color: string;
    highlightColor: string;
    barClass: string;
    gradientClass: string;
    swatchClass: string;
    glowColor: string;
    textClass: string;
    icon: React.ComponentType<{ className?: string }>;
    ruleLabel: string;
  }
> = {
  'On Target': {
    color: '#34D399',
    highlightColor: '#6EE7B7',
    barClass: 'bg-gradient-to-r from-emerald-500 to-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.6)]',
    gradientClass: 'bg-gradient-to-t from-emerald-600/85 via-emerald-400 to-emerald-200',
    swatchClass: 'bg-emerald-400',
    glowColor: 'rgba(52, 211, 153, 0.7)',
    textClass: 'text-emerald-300',
    icon: CheckCircle2,
    ruleLabel: '< 0.015% NG',
  },
  Watch: {
    color: '#FBBF24',
    highlightColor: '#FDE68A',
    barClass: 'bg-gradient-to-r from-amber-500 to-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.6)]',
    gradientClass: 'bg-gradient-to-t from-amber-500/85 via-amber-400 to-amber-200',
    swatchClass: 'bg-amber-300',
    glowColor: 'rgba(252, 211, 77, 0.7)',
    textClass: 'text-amber-300',
    icon: Eye,
    ruleLabel: '0.015% – 0.025% NG',
  },
  'High NG': {
    color: '#FB7185',
    highlightColor: '#FDA4AF',
    barClass: 'bg-gradient-to-r from-rose-500 to-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.6)]',
    gradientClass: 'bg-gradient-to-t from-rose-500/85 via-rose-400 to-rose-300',
    swatchClass: 'bg-rose-400',
    glowColor: 'rgba(251, 113, 133, 0.75)',
    textClass: 'text-rose-400',
    icon: AlertTriangle,
    ruleLabel: '≥ 0.025% NG',
  },
  Pending: {
    color: '#635385',
    highlightColor: '#7D6CA3',
    barClass: 'bg-[#635385]/55',
    gradientClass: 'bg-[#635385]/45',
    swatchClass: 'bg-[#635385]',
    glowColor: 'rgba(99, 83, 133, 0.45)',
    textClass: 'text-[#A896C9]/65',
    icon: Clock,
    ruleLabel: 'No output recorded yet',
  },
};

function MonthlyStatusLabel({ status }: { status: MonthlyIssueStatus }) {
  const meta = MONTHLY_STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${meta.textClass}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{status}</span>
    </span>
  );
}

interface MonthlyIssuesViewProps {
  records: MonthlyIssueRow[];
  sourceLabel: string;
  isLoading?: boolean;
}

export function MonthlyIssuesView({
  records,
  sourceLabel,
  isLoading = false,
}: MonthlyIssuesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<MonthlyIssueStatus | 'All'>(
    'All'
  );
  const [yearFilter, setYearFilter] = useState<string>('All');
  const [selectedMonthId, setSelectedMonthId] = useState<string | null>(null);

  const availableYears = useMemo(() => {
    const set = new Set<number>();
    records.forEach((r) => {
      if (r.year > 0) set.add(r.year);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [records]);

  const yearScopedRecords = useMemo(() => {
    const base =
      yearFilter === 'All'
        ? records
        : records.filter((r) => String(r.year) === yearFilter);
    return [...base].sort((a, b) => a.monthIndex - b.monthIndex);
  }, [records, yearFilter]);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return yearScopedRecords.filter((row) => {
      if (statusFilter !== 'All' && row.status !== statusFilter) return false;
      if (selectedMonthId && row.id !== selectedMonthId) return false;
      if (q) {
        const hay = `${row.monthLabel} ${row.year} ${row.status}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [yearScopedRecords, statusFilter, selectedMonthId, searchQuery]);

  const activeMonths = yearScopedRecords.filter((r) => r.status !== 'Pending');
  const totalNg = yearScopedRecords.reduce((s, r) => s + r.ngQty, 0);
  const totalOutput = yearScopedRecords.reduce((s, r) => s + r.outputQty, 0);
  const overallNgPct = totalOutput > 0 ? (totalNg / totalOutput) * 100 : 0;

  const peakNgMonth =
    activeMonths.length > 0
      ? [...activeMonths].sort((a, b) => b.ngQty - a.ngQty)[0]
      : null;
  const bestNgMonth =
    activeMonths.length > 0
      ? [...activeMonths].sort((a, b) => a.ngPct - b.ngPct)[0]
      : null;

  const maxNgQty = Math.max(1, ...yearScopedRecords.map((r) => r.ngQty));
  const maxNgPct = Math.max(0.01, ...yearScopedRecords.map((r) => r.ngPct));

  const statusCounts = MONTHLY_STATUS_ORDER.reduce((acc, status) => {
    acc[status] = yearScopedRecords.filter((r) => r.status === status).length;
    return acc;
  }, {} as Record<MonthlyIssueStatus, number>);

  const totalMonths = yearScopedRecords.length;
  const monthlyDonutSegments = MONTHLY_STATUS_ORDER.map((status) => ({
    id: status,
    label: status,
    subLabel: MONTHLY_STATUS_META[status].ruleLabel,
    count: statusCounts[status],
    color: MONTHLY_STATUS_META[status].color,
    highlightColor: MONTHLY_STATUS_META[status].highlightColor,
  }));

  const watchThresholdPct = Math.min(100, (0.015 / maxNgPct) * 100);
  const highThresholdPct = Math.min(100, (0.025 / maxNgPct) * 100);

  const monthlyTrendItems = yearScopedRecords.map((row) => ({
    id: row.id,
    axisLabel: row.monthLabel,
    headerTitle: `${row.monthLabel} ${row.year}`,
    headerSub:
      row.status === 'Pending'
        ? 'Pending — no output recorded'
        : `${row.status} · % NG: ${row.ngPctLabel}`,
    totalValue: row.status === 'Pending' ? 0 : row.ngQty,
    displayValueLabel: row.status === 'Pending' ? 'Pending' : `${row.ngQty.toLocaleString()} NG`,
    isDimmed: row.status === 'Pending',
    isSelected: selectedMonthId === row.id,
    segments: [
      {
        key: 'ng',
        label: row.status,
        value: row.status === 'Pending' ? 0 : row.ngQty,
        gradientClass: MONTHLY_STATUS_META[row.status].gradientClass,
        swatchClass: MONTHLY_STATUS_META[row.status].swatchClass,
        glowColor: MONTHLY_STATUS_META[row.status].glowColor,
      },
    ],
    footerNote:
      row.status === 'Pending'
        ? undefined
        : `Output: ${row.outputQty.toLocaleString()} · Rate: ${row.ngPctLabel}`,
  }));

  const tableTotals = filteredRecords.reduce(
    (acc, r) => {
      acc.ngQty += r.ngQty;
      acc.outputQty += r.outputQty;
      return acc;
    },
    { ngQty: 0, outputQty: 0 }
  );
  const tableOverallPct =
    tableTotals.outputQty > 0
      ? (tableTotals.ngQty / tableTotals.outputQty) * 100
      : 0;

  const handleExportCsv = () => {
    const headers = ['No.', '% NG', 'NG', 'Output', 'Year'];
    const lines = [
      headers.join(','),
      ...filteredRecords.map((r) =>
        [
          r.monthLabel,
          r.ngPctLabel === '—' ? '' : r.ngPctLabel,
          r.status === 'Pending' ? '' : r.ngQty,
          r.status === 'Pending' ? '' : r.outputQty,
          r.year,
        ].join(',')
      ),
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `monthly-internal-issues-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const hasFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'All' ||
    yearFilter !== 'All' ||
    selectedMonthId !== null;

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setYearFilter('All');
    setSelectedMonthId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F2E9FF]">
            Monthly Internal Issues
          </h1>
          <p className="text-sm text-[#D1B8FF]/70 mt-1">
            Monthly NG quantity, output volume, and % NG rate · {sourceLabel}
          </p>
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-medium text-[#D1B8FF] hover:text-[#F2E9FF] self-start sm:self-auto cursor-pointer"
          >
            Reset Filters
          </button>
        )}
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
              Total Internal NG
            </p>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-2xl font-semibold tracking-tight text-amber-300 font-mono tabular-nums">
                {totalNg.toLocaleString()}
              </span>
              <span className="text-xs text-[#D1B8FF]/65 font-mono tabular-nums">
                {activeMonths.length > 0
                  ? `${Math.round(totalNg / activeMonths.length)} avg/mo`
                  : '0'}
              </span>
            </div>
            <div className="mt-2.5 h-1.5 w-full bg-[#0B0720]/75 border border-[#D1B8FF]/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${
                    totalMonths > 0
                      ? (activeMonths.length / totalMonths) * 100
                      : 0
                  }%`,
                }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.65)]"
              />
            </div>
            <p className="mt-2 text-xs text-[#D1B8FF]/65 font-mono tabular-nums">
              Across {activeMonths.length} of {totalMonths} recorded months
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
              Total Annual Output
            </p>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-2xl font-semibold tracking-tight text-[#F2E9FF] font-mono tabular-nums">
                {totalOutput.toLocaleString()}
              </span>
              <span className="text-xs text-[#D1B8FF] font-mono tabular-nums">
                {activeMonths.length} mos
              </span>
            </div>
            <div className="mt-2.5 h-1.5 w-full bg-[#0B0720]/75 border border-[#D1B8FF]/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${
                    totalMonths > 0
                      ? (activeMonths.length / totalMonths) * 100
                      : 0
                  }%`,
                }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-[#6A2FC8] to-[#9D71E8] shadow-[0_0_10px_rgba(157,113,232,0.75)]"
              />
            </div>
            <p className="mt-2 text-xs text-[#D1B8FF]/65 font-mono tabular-nums">
              Avg{' '}
              {activeMonths.length > 0
                ? Math.round(totalOutput / activeMonths.length).toLocaleString()
                : 0}{' '}
              output/month
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
              Overall % NG Rate
            </p>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span
                className={`text-2xl font-semibold tracking-tight font-mono tabular-nums ${
                  overallNgPct >= 0.025
                    ? 'text-rose-400'
                    : overallNgPct >= 0.015
                      ? 'text-amber-300'
                      : 'text-emerald-300'
                }`}
              >
                {overallNgPct.toFixed(3)}%
              </span>
              <span className="text-xs text-[#D1B8FF]/65 font-mono tabular-nums">
                {statusCounts['On Target']} on target
              </span>
            </div>
            <div className="mt-2.5 h-1.5 w-full bg-[#0B0720]/75 border border-[#D1B8FF]/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${
                    activeMonths.length > 0
                      ? (statusCounts['On Target'] / activeMonths.length) * 100
                      : 0
                  }%`,
                }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.65)]"
              />
            </div>
            <p className="mt-2 text-xs text-[#D1B8FF]/65 font-mono tabular-nums">
              Watch: {statusCounts.Watch} · High NG: {statusCounts['High NG']}
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
              Peak vs. Best Month
            </p>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-2xl font-semibold tracking-tight text-[#F2E9FF] font-mono tabular-nums">
                {peakNgMonth
                  ? `${peakNgMonth.monthLabel} (${peakNgMonth.ngQty})`
                  : '—'}
              </span>
              <span className="text-xs text-rose-400 font-mono tabular-nums">
                {peakNgMonth ? peakNgMonth.ngPctLabel : ''}
              </span>
            </div>
            <p className="mt-3 text-xs text-[#D1B8FF]/80 font-mono tabular-nums">
              Best:{' '}
              <span className="text-emerald-300 font-semibold">
                {bestNgMonth
                  ? `${bestNgMonth.monthLabel} (${bestNgMonth.ngPctLabel} · ${bestNgMonth.ngQty} NG)`
                  : '—'}
              </span>
            </p>
          </motion.div>
        </div>
      )}

      {/* Primary Visuals Row: Monthly Status Ring + Monthly % NG Progress Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-5 glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-[#F2E9FF]">
                Monthly % NG Status
              </h2>
              <p className="text-xs text-[#D1B8FF]/65 mt-0.5">
                Click any status row to filter the monthly table
              </p>
            </div>
            {statusFilter !== 'All' && (
              <button
                type="button"
                onClick={() => setStatusFilter('All')}
                className="text-xs font-medium text-[#D1B8FF] hover:text-[#F2E9FF] cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          <CosmicDonutChart
            segments={monthlyDonutSegments}
            totalCount={totalMonths}
            totalLabel="Months"
            activeFilter={statusFilter}
            onSelect={(id) => setStatusFilter(id as MonthlyIssueStatus | 'All')}
            ariaLabel="Monthly quality status ring chart"
          />
        </section>

        {/* Monthly % NG Progress Bars */}
        <section className="lg:col-span-7 glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#F2E9FF]">
                Monthly NG Rate &amp; Volume Progress
              </h2>
              <p className="text-xs text-[#D1B8FF]/65 mt-0.5">
                % NG relative to target thresholds · Click any month to isolate
              </p>
            </div>
            {selectedMonthId && (
              <button
                type="button"
                onClick={() => setSelectedMonthId(null)}
                className="text-xs font-medium text-[#D1B8FF] hover:text-[#F2E9FF] cursor-pointer"
              >
                All Months
              </button>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
            {yearScopedRecords.map((row) => {
              const barPct =
                row.status === 'Pending' ? 0 : (row.ngPct / maxNgPct) * 100;
              const isSelected = selectedMonthId === row.id;
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() =>
                    setSelectedMonthId(isSelected ? null : row.id)
                  }
                  className={`w-full text-left p-2.5 -mx-2 rounded-xl transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-[#6A2FC8]/30 ring-1 ring-[#9D71E8]/55'
                      : 'hover:bg-[#6A2FC8]/15'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2 text-xs mb-1.5">
                    <span className="font-mono font-semibold text-[#F2E9FF]">
                      {row.monthLabel} {row.year}
                    </span>
                    <span className="font-mono tabular-nums text-[#D1B8FF]/80">
                      {row.status === 'Pending' ? (
                        <span className="text-[#D1B8FF]/45">Pending</span>
                      ) : (
                        <>
                          <strong className="text-[#F2E9FF]">
                            {row.ngQty}
                          </strong>{' '}
                          NG · {row.ngPctLabel}
                        </>
                      )}
                    </span>
                  </div>
                  <div className="relative h-2 w-full bg-[#0B0720]/75 border border-[#D1B8FF]/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barPct}%` }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      className={`h-full rounded-full ${MONTHLY_STATUS_META[row.status].barClass}`}
                    />
                    {watchThresholdPct < 98 && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-0 w-px bg-amber-300/45"
                        style={{ left: `${watchThresholdPct}%` }}
                      />
                    )}
                    {highThresholdPct < 98 && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-0 w-px bg-rose-400/55"
                        style={{ left: `${highThresholdPct}%` }}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Monthly Trend Bar Chart */}
      <section className="glass-panel rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#F2E9FF]">
              Monthly Internal NG Trend
            </h2>
            <p className="text-xs text-[#D1B8FF]/65 mt-0.5">
              Hover any month bar to view NG count, Output volume, and % NG rate · Click to isolate
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#D1B8FF]/70">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.65)]" />
              <span>On Target</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.65)]" />
              <span>Watch</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.65)]" />
              <span>High NG</span>
            </span>
          </div>
        </div>

        <CosmicTrendBarChart
          items={monthlyTrendItems}
          maxValue={maxNgQty}
          unitLabel="NG"
          showAllAxisLabels
          onBarClick={(id) =>
            setSelectedMonthId(selectedMonthId === id ? null : id)
          }
          emptyMessage="No monthly trend data found."
        />
      </section>

      {/* Monthly Data Table */}
      <section className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[#D1B8FF]/14 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[#F2E9FF]">
              Monthly Internal Issues Summary
            </h2>
            <p className="text-xs text-[#D1B8FF]/65 mt-0.5 font-mono tabular-nums">
              Showing {filteredRecords.length}{' '}
              {filteredRecords.length === 1 ? 'month' : 'months'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#9D71E8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search month..."
                aria-label="Search monthly issues"
                className="h-9 pl-8 pr-3 text-xs glass-control rounded-lg placeholder:text-[#D1B8FF]/40"
              />
            </div>

            {availableYears.length > 1 && (
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                aria-label="Filter by Year"
                className="h-9 px-2.5 text-xs glass-control rounded-lg cursor-pointer"
              >
                <option value="All">All Years</option>
                {availableYears.map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filteredRecords.length === 0}
              className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium glass-control disabled:opacity-50 rounded-lg cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#D1B8FF]" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B0720]/65 border-b border-[#D1B8FF]/14 text-xs font-medium text-[#D1B8FF]/70 whitespace-nowrap">
                <th className="py-2.5 pl-5 pr-3 font-medium">No.</th>
                <th className="py-2.5 px-3 font-medium">Status</th>
                <th className="py-2.5 px-3 font-medium text-right">% NG</th>
                <th className="py-2.5 px-3 font-medium text-right">NG</th>
                <th className="py-2.5 px-3 font-medium text-right">Output</th>
                <th className="py-2.5 pl-3 pr-5 font-medium text-right">
                  Year
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D1B8FF]/10 text-sm">
              {filteredRecords.map((row) => (
                <tr
                  key={row.id}
                  className={`h-10 transition-colors duration-150 ${
                    row.status === 'Pending'
                      ? 'bg-[#0B0720]/30 text-[#D1B8FF]/45'
                      : 'hover:bg-[#6A2FC8]/18'
                  }`}
                >
                  <td className="py-2 pl-5 pr-3 font-mono font-semibold text-[#F2E9FF] whitespace-nowrap">
                    {row.monthLabel}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    <MonthlyStatusLabel status={row.status} />
                  </td>
                  <td
                    className={`py-2 px-3 text-right font-mono tabular-nums whitespace-nowrap ${MONTHLY_STATUS_META[row.status].textClass}`}
                  >
                    {row.ngPctLabel}
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-[#F2E9FF] whitespace-nowrap">
                    {row.status === 'Pending'
                      ? '—'
                      : row.ngQty.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-[#D1B8FF]/80 whitespace-nowrap">
                    {row.status === 'Pending'
                      ? '—'
                      : row.outputQty.toLocaleString()}
                  </td>
                  <td className="py-2 pl-3 pr-5 text-right font-mono tabular-nums text-[#D1B8FF]/65 whitespace-nowrap">
                    {row.year}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#0B0720]/70 border-t-2 border-[#9D71E8]/35 text-sm font-semibold">
                <td className="py-3 pl-5 pr-3 text-[#F2E9FF] whitespace-nowrap">
                  Total ({filteredRecords.length} mos)
                </td>
                <td className="py-3 px-3 text-xs font-mono text-[#D1B8FF] whitespace-nowrap">
                  {filteredRecords.filter((r) => r.status !== 'Pending').length}{' '}
                  active
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-300 whitespace-nowrap">
                  {tableOverallPct.toFixed(3)}%
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-amber-300 whitespace-nowrap">
                  {tableTotals.ngQty.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-[#F2E9FF] whitespace-nowrap">
                  {tableTotals.outputQty.toLocaleString()}
                </td>
                <td className="py-3 pl-3 pr-5 text-right font-mono text-xs text-[#D1B8FF]/65 whitespace-nowrap">
                  {yearFilter === 'All' ? 'All' : yearFilter}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}
