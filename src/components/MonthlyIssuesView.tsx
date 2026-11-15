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
    barClass: string;
    textClass: string;
    icon: React.ComponentType<{ className?: string }>;
    ruleLabel: string;
  }
> = {
  'On Target': {
    color: '#34D399',
    barClass: 'bg-emerald-400',
    textClass: 'text-emerald-400',
    icon: CheckCircle2,
    ruleLabel: '< 0.015% NG',
  },
  Watch: {
    color: '#FBBF24',
    barClass: 'bg-amber-400',
    textClass: 'text-amber-400',
    icon: Eye,
    ruleLabel: '0.015% – 0.025% NG',
  },
  'High NG': {
    color: '#F87171',
    barClass: 'bg-red-400',
    textClass: 'text-red-400',
    icon: AlertTriangle,
    ruleLabel: '≥ 0.025% NG',
  },
  Pending: {
    color: '#64748B',
    barClass: 'bg-slate-600',
    textClass: 'text-slate-400',
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
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  const donutSegments = MONTHLY_STATUS_ORDER.map((status) => {
    const count = statusCounts[status];
    const ratio = totalMonths > 0 ? count / totalMonths : 0;
    const segmentLength = ratio * circumference;
    const dashOffset = -cumulativeOffset;
    cumulativeOffset += segmentLength;
    return {
      status,
      count,
      segmentLength,
      dashOffset,
      color: MONTHLY_STATUS_META[status].color,
    };
  });

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
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Monthly Internal Issues
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monthly NG quantity, output volume, and % NG rate · {sourceLabel}
          </p>
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-medium text-sky-400 hover:text-sky-300 self-start sm:self-auto cursor-pointer"
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
              className="bg-[#0C172B] border border-[#1B2B48] rounded-xl p-5 h-28 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[#0C172B] border border-[#1B2B48] hover:border-[#2A426E] rounded-xl p-5 transition-colors duration-150"
          >
            <p className="text-xs font-medium text-slate-400">
              Total Internal NG
            </p>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-2xl font-semibold tracking-tight text-amber-400 font-mono tabular-nums">
                {totalNg.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                {activeMonths.length > 0
                  ? `${Math.round(totalNg / activeMonths.length)} avg/mo`
                  : '0'}
              </span>
            </div>
            <div className="mt-2.5 h-1.5 w-full bg-[#13223D] rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-300"
                style={{
                  width: `${
                    totalMonths > 0
                      ? (activeMonths.length / totalMonths) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-400 font-mono tabular-nums">
              Across {activeMonths.length} of {totalMonths} recorded months
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[#0C172B] border border-[#1B2B48] hover:border-[#2A426E] rounded-xl p-5 transition-colors duration-150"
          >
            <p className="text-xs font-medium text-slate-400">
              Total Annual Output
            </p>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-2xl font-semibold tracking-tight text-slate-100 font-mono tabular-nums">
                {totalOutput.toLocaleString()}
              </span>
              <span className="text-xs text-sky-400 font-mono tabular-nums">
                {activeMonths.length} mos
              </span>
            </div>
            <div className="mt-2.5 h-1.5 w-full bg-[#13223D] rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{
                  width: `${
                    totalMonths > 0
                      ? (activeMonths.length / totalMonths) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-400 font-mono tabular-nums">
              Avg{' '}
              {activeMonths.length > 0
                ? Math.round(totalOutput / activeMonths.length).toLocaleString()
                : 0}{' '}
              output/month
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[#0C172B] border border-[#1B2B48] hover:border-[#2A426E] rounded-xl p-5 transition-colors duration-150"
          >
            <p className="text-xs font-medium text-slate-400">
              Overall % NG Rate
            </p>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span
                className={`text-2xl font-semibold tracking-tight font-mono tabular-nums ${
                  overallNgPct >= 0.025
                    ? 'text-red-400'
                    : overallNgPct >= 0.015
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                }`}
              >
                {overallNgPct.toFixed(3)}%
              </span>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                {statusCounts['On Target']} on target
              </span>
            </div>
            <div className="mt-2.5 h-1.5 w-full bg-[#13223D] rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-300"
                style={{
                  width: `${
                    activeMonths.length > 0
                      ? (statusCounts['On Target'] / activeMonths.length) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-400 font-mono tabular-nums">
              Watch: {statusCounts.Watch} · High NG: {statusCounts['High NG']}
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[#0C172B] border border-[#1B2B48] hover:border-[#2A426E] rounded-xl p-5 transition-colors duration-150"
          >
            <p className="text-xs font-medium text-slate-400">
              Peak vs. Best Month
            </p>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-2xl font-semibold tracking-tight text-slate-100 font-mono tabular-nums">
                {peakNgMonth ? `${peakNgMonth.monthLabel} (${peakNgMonth.ngQty})` : '—'}
              </span>
              <span className="text-xs text-red-400 font-mono tabular-nums">
                {peakNgMonth ? peakNgMonth.ngPctLabel : ''}
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-300 font-mono tabular-nums">
              Best:{' '}
              <span className="text-emerald-400 font-semibold">
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
        <section className="lg:col-span-5 bg-[#0C172B] border border-[#1B2B48] rounded-xl p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Monthly % NG Status
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any status row to filter the monthly table
              </p>
            </div>
            {statusFilter !== 'All' && (
              <button
                type="button"
                onClick={() => setStatusFilter('All')}
                className="text-xs font-medium text-sky-400 hover:text-sky-300 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
              <svg
                viewBox="0 0 160 160"
                className="w-40 h-40 -rotate-90"
                role="img"
                aria-label="Monthly quality status ring chart"
              >
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke="#13223D"
                  strokeWidth="18"
                />
                {totalMonths > 0 &&
                  donutSegments.map((seg) =>
                    seg.segmentLength > 0 ? (
                      <circle
                        key={seg.status}
                        cx="80"
                        cy="80"
                        r={radius}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="18"
                        strokeDasharray={`${seg.segmentLength} ${circumference}`}
                        strokeDashoffset={seg.dashOffset}
                        opacity={
                          statusFilter === 'All' || statusFilter === seg.status
                            ? 1
                            : 0.22
                        }
                        className="transition-opacity duration-150 cursor-pointer hover:opacity-90"
                        onClick={() =>
                          setStatusFilter(
                            statusFilter === seg.status ? 'All' : seg.status
                          )
                        }
                      />
                    ) : null
                  )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-semibold text-slate-100 font-mono tabular-nums">
                  {totalMonths}
                </span>
                <span className="text-xs text-slate-400">Months</span>
              </div>
            </div>

            <div className="w-full divide-y divide-[#162542]">
              {MONTHLY_STATUS_ORDER.map((status) => {
                const count = statusCounts[status];
                const pct =
                  totalMonths > 0 ? Math.round((count / totalMonths) * 100) : 0;
                const isSelected = statusFilter === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(isSelected ? 'All' : status)}
                    className={`w-full py-2 px-2.5 flex items-center justify-between gap-3 text-left rounded-md transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-[#162849]'
                        : 'hover:bg-[#12203B] hover:translate-x-0.5'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-2.5 h-2.5 rounded-xs shrink-0"
                          style={{
                            backgroundColor: MONTHLY_STATUS_META[status].color,
                          }}
                          aria-hidden="true"
                        />
                        <span className="text-sm font-medium text-slate-200 truncate">
                          {status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 pl-5">
                        {MONTHLY_STATUS_META[status].ruleLabel}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums">
                      <span className="text-sm font-semibold text-slate-100 w-6 text-right">
                        {count}
                      </span>
                      <span className="text-xs text-slate-400 w-9 text-right">
                        {pct}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Monthly % NG Progress Bars */}
        <section className="lg:col-span-7 bg-[#0C172B] border border-[#1B2B48] rounded-xl p-6 flex flex-col justify-between">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Monthly NG Rate & Volume Progress
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                % NG and total NG per month · Click any month to isolate in table
              </p>
            </div>
            {selectedMonthId && (
              <button
                type="button"
                onClick={() => setSelectedMonthId(null)}
                className="text-xs font-medium text-sky-400 hover:text-sky-300 cursor-pointer"
              >
                All Months
              </button>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {yearScopedRecords.map((row) => {
              const barPct = row.status === 'Pending' ? 0 : (row.ngPct / maxNgPct) * 100;
              const isSelected = selectedMonthId === row.id;
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() =>
                    setSelectedMonthId(isSelected ? null : row.id)
                  }
                  className={`w-full text-left p-2.5 -mx-2 rounded-lg transition-all duration-150 cursor-pointer ${
                    isSelected ? 'bg-[#162849]' : 'hover:bg-[#12203B]'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2 text-xs mb-1.5">
                    <span className="font-mono font-semibold text-slate-100">
                      {row.monthLabel} {row.year}
                    </span>
                    <span className="font-mono tabular-nums text-slate-300">
                      {row.status === 'Pending' ? (
                        <span className="text-slate-500">Pending</span>
                      ) : (
                        <>
                          <strong className="text-white">{row.ngQty}</strong> NG
                          · {row.ngPctLabel}
                        </>
                      )}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#13223D] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${MONTHLY_STATUS_META[row.status].barClass}`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Monthly Trend Bar Chart */}
      <section className="bg-[#0C172B] border border-[#1B2B48] rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Monthly Internal NG Trend
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Hover any month bar to view NG count, Output volume, and % NG rate
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-400" />
              <span>On Target</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-400" />
              <span>Watch</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-red-400" />
              <span>High NG</span>
            </span>
          </div>
        </div>

        <div className="mt-6">
          <div className="h-48 flex items-end gap-2 sm:gap-3 pt-5 border-b border-[#1B2B48]">
            {yearScopedRecords.map((row) => {
              const heightPct =
                row.status === 'Pending' ? 2 : (row.ngQty / maxNgQty) * 100;
              return (
                <div
                  key={row.id}
                  onClick={() =>
                    setSelectedMonthId(
                      selectedMonthId === row.id ? null : row.id
                    )
                  }
                  className="flex-1 min-w-0 h-full flex flex-col justify-end items-center group cursor-pointer"
                  title={
                    row.status === 'Pending'
                      ? `${row.monthLabel} ${row.year}: Pending`
                      : `${row.monthLabel} ${row.year}: ${row.ngQty} NG / ${row.outputQty.toLocaleString()} Output (${row.ngPctLabel})`
                  }
                >
                  <span className="text-[11px] font-mono tabular-nums text-slate-300 mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    {row.status === 'Pending' ? '—' : row.ngQty}
                  </span>
                  <div
                    className={`w-full max-w-[34px] rounded-t-sm transition-transform duration-150 group-hover:scale-x-105 ${MONTHLY_STATUS_META[row.status].barClass}`}
                    style={{
                      height: `${Math.max(row.status === 'Pending' ? 3 : 6, heightPct)}%`,
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex items-center gap-2 sm:gap-3">
            {yearScopedRecords.map((row) => (
              <div
                key={row.id}
                className="flex-1 min-w-0 text-center text-[11px] font-mono text-slate-400 truncate"
              >
                {row.monthLabel}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Monthly Data Table */}
      <section className="bg-[#0C172B] border border-[#1B2B48] rounded-xl overflow-hidden">
        <div className="p-5 border-b border-[#1B2B48] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Monthly Internal Issues Summary
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono tabular-nums">
              Showing {filteredRecords.length}{' '}
              {filteredRecords.length === 1 ? 'month' : 'months'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search month..."
                aria-label="Search monthly issues"
                className="h-9 pl-8 pr-3 text-xs bg-[#081020] border border-[#1E3154] rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            {availableYears.length > 1 && (
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                aria-label="Filter by Year"
                className="h-9 px-2.5 text-xs bg-[#081020] border border-[#1E3154] rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
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
              className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium text-slate-200 bg-[#111F38] border border-[#223659] hover:bg-[#172A4A] hover:border-[#2E4975] disabled:opacity-50 rounded-lg transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#091224] border-b border-[#1B2B48] text-xs font-medium text-slate-400 whitespace-nowrap">
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
            <tbody className="divide-y divide-[#162542] text-sm">
              {filteredRecords.map((row) => (
                <tr
                  key={row.id}
                  className={`h-10 transition-colors duration-150 ${
                    row.status === 'Pending'
                      ? 'bg-[#091224]/50 text-slate-500'
                      : 'hover:bg-[#13223D]'
                  }`}
                >
                  <td className="py-2 pl-5 pr-3 font-mono font-semibold text-slate-100 whitespace-nowrap">
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
                  <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-slate-100 whitespace-nowrap">
                    {row.status === 'Pending'
                      ? '—'
                      : row.ngQty.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-300 whitespace-nowrap">
                    {row.status === 'Pending'
                      ? '—'
                      : row.outputQty.toLocaleString()}
                  </td>
                  <td className="py-2 pl-3 pr-5 text-right font-mono tabular-nums text-slate-400 whitespace-nowrap">
                    {row.year}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#091224] border-t-2 border-[#223659] text-sm font-semibold">
                <td className="py-3 pl-5 pr-3 text-slate-100 whitespace-nowrap">
                  Total ({filteredRecords.length} mos)
                </td>
                <td className="py-3 px-3 text-xs font-mono text-sky-400 whitespace-nowrap">
                  {filteredRecords.filter((r) => r.status !== 'Pending').length}{' '}
                  active
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-400 whitespace-nowrap">
                  {tableOverallPct.toFixed(3)}%
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-amber-400 whitespace-nowrap">
                  {tableTotals.ngQty.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-white whitespace-nowrap">
                  {tableTotals.outputQty.toLocaleString()}
                </td>
                <td className="py-3 pl-3 pr-5 text-right font-mono text-xs text-slate-400 whitespace-nowrap">
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
