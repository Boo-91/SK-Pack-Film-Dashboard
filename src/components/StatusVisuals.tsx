import React from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  CalendarOff,
  CheckCircle2,
  Clock,
  Hourglass,
  PlayCircle,
} from 'lucide-react';
import type { WeekWindowMeta } from '../lib/sheetParser';
import { CapacityStatus, PackingCapacityRow } from '../types/packing';
import {
  CosmicDonutChart,
  CosmicTrendBarChart,
} from './CosmicCharts';

export const CAPACITY_STATUS_ORDER: CapacityStatus[] = [
  'Completed',
  'Rework Alert',
  'In Progress',
  'Planned',
  'Waiting',
  'Off Day',
];

export const CAPACITY_STATUS_META: Record<
  CapacityStatus,
  {
    color: string;
    highlightColor: string;
    textClass: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }
> = {
  Completed: {
    color: '#34D399',
    highlightColor: '#6EE7B7',
    textClass: 'text-emerald-300',
    icon: CheckCircle2,
    description: 'Plan & items 100% finished with zero rework',
  },
  'Rework Alert': {
    color: '#FB7185',
    highlightColor: '#FDA4AF',
    textClass: 'text-rose-400',
    icon: AlertTriangle,
    description: "Negative Remain Rework Qty's recorded",
  },
  'In Progress': {
    color: '#38BDF8',
    highlightColor: '#7DD3FC',
    textClass: 'text-sky-300',
    icon: PlayCircle,
    description: 'Partial input received against plan',
  },
  Planned: {
    color: '#FBBF24',
    highlightColor: '#FDE68A',
    textClass: 'text-amber-300',
    icon: Clock,
    description: 'Scheduled plan awaiting input',
  },
  Waiting: {
    color: '#D1B8FF',
    highlightColor: '#EFE4FF',
    textClass: 'text-[#D1B8FF]',
    icon: Hourglass,
    description: 'Upcoming/today date awaiting plan entry',
  },
  'Off Day': {
    color: '#635385',
    highlightColor: '#7D6CA3',
    textClass: 'text-[#A896C9]/65',
    icon: CalendarOff,
    description: 'Past date with zero planned volume & items',
  },
};

export function CapacityStatusLabel({ status }: { status: CapacityStatus }) {
  const meta = CAPACITY_STATUS_META[status];
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

export function CapacityScorecardStrip({
  records,
  isLoading = false,
}: {
  records: PackingCapacityRow[];
  isLoading?: boolean;
}) {
  const activeProductionDays = records.filter(
    (r) => r.status !== 'Off Day' && r.status !== 'Waiting'
  );

  const totalPlanQty = records.reduce((s, r) => s + r.planQty, 0);
  const totalInputQty = records.reduce((s, r) => s + r.inputQty, 0);
  const totalTradeQty = records.reduce((s, r) => s + r.tradeQty, 0);
  const qtyProgressPct =
    totalPlanQty > 0
      ? Math.round((totalInputQty / totalPlanQty) * 1000) / 10
      : 0;

  const totalPlannedItems = records.reduce((s, r) => s + r.plannedItems, 0);
  const totalFinishedItems = records.reduce((s, r) => s + r.finishedItems, 0);
  const itemProgressPct =
    totalPlannedItems > 0
      ? Math.round((totalFinishedItems / totalPlannedItems) * 1000) / 10
      : 0;

  const totalPpaNg = records.reduce((s, r) => s + r.ppaNgQty, 0);
  const totalOqcNg = records.reduce((s, r) => s + r.oqcNgQty, 0);
  const totalNg = records.reduce((s, r) => s + r.totalNgQty, 0);

  const totalRemainRework = records.reduce((s, r) => s + r.remainReworkQty, 0);
  const reworkDaysCount = records.filter((r) => r.remainReworkQty < 0).length;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="glass-panel rounded-2xl p-5 h-28 animate-pulse"
          >
            <div className="h-3 w-24 bg-[#6A2FC8]/30 rounded mb-3" />
            <div className="h-7 w-24 bg-[#9D71E8]/25 rounded mb-2" />
            <div className="h-3 w-32 bg-[#25134D]/60 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -3 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel-interactive rounded-2xl p-5"
      >
        <p className="text-xs font-medium text-[#D1B8FF]/70">
          Input vs. Plan Qty
        </p>
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <span className="text-2xl font-semibold tracking-tight text-[#F2E9FF] font-mono tabular-nums">
            {totalInputQty.toLocaleString()}
          </span>
          <span className="text-xs font-medium text-[#D1B8FF] font-mono tabular-nums">
            {qtyProgressPct}%
          </span>
        </div>
        <div className="mt-2.5 h-1.5 w-full bg-[#0B0720]/75 border border-[#D1B8FF]/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, qtyProgressPct)}%` }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-[#6A2FC8] to-[#9D71E8] shadow-[0_0_10px_rgba(157,113,232,0.75)]"
          />
        </div>
        <p className="mt-2 text-xs text-[#D1B8FF]/65 font-mono tabular-nums">
          Plan {totalPlanQty.toLocaleString()} · Trade{' '}
          {totalTradeQty.toLocaleString()}
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
          Finished vs. Planned Items
        </p>
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <span className="text-2xl font-semibold tracking-tight text-[#F2E9FF] font-mono tabular-nums">
            {totalFinishedItems.toLocaleString()}
          </span>
          <span className="text-xs font-medium text-emerald-300 font-mono tabular-nums">
            {itemProgressPct}%
          </span>
        </div>
        <div className="mt-2.5 h-1.5 w-full bg-[#0B0720]/75 border border-[#D1B8FF]/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, itemProgressPct)}%` }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.65)]"
          />
        </div>
        <p className="mt-2 text-xs text-[#D1B8FF]/65 font-mono tabular-nums">
          {totalPlannedItems.toLocaleString()} planned ·{' '}
          {activeProductionDays.length} active{' '}
          {activeProductionDays.length === 1 ? 'day' : 'days'}
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
          Total Quality NG
        </p>
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <span className="text-2xl font-semibold tracking-tight text-amber-300 font-mono tabular-nums">
            {totalNg.toLocaleString()}
          </span>
          <span className="text-xs text-[#D1B8FF]/65 font-mono tabular-nums">
            {totalInputQty > 0
              ? `${((totalNg / totalInputQty) * 100).toFixed(3)}%`
              : '0%'}
          </span>
        </div>
        <p className="mt-3 text-xs text-[#D1B8FF]/80 font-mono tabular-nums">
          PPA NG: {totalPpaNg.toLocaleString()} · OQC NG:{' '}
          {totalOqcNg.toLocaleString()}
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
          Remain Rework Qty
        </p>
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <span
            className={`text-2xl font-semibold tracking-tight font-mono tabular-nums ${
              totalRemainRework < 0 ? 'text-rose-400' : 'text-emerald-300'
            }`}
          >
            {totalRemainRework.toLocaleString()}
          </span>
          <span className="text-xs text-[#D1B8FF]/65 font-mono tabular-nums">
            {reworkDaysCount} {reworkDaysCount === 1 ? 'day' : 'days'}
          </span>
        </div>
        <p className="mt-3 text-xs text-[#D1B8FF]/65">
          {reworkDaysCount > 0
            ? 'Days with negative rework balance'
            : 'All rework quantities cleared'}
        </p>
      </motion.div>
    </div>
  );
}

interface StatusVisualsProps {
  records: PackingCapacityRow[];
  allRecords: PackingCapacityRow[];
  weekWindow: WeekWindowMeta;
  activeStatusFilter: CapacityStatus | 'All';
  activeWeekFilter: string;
  onSelectStatus: (status: CapacityStatus | 'All') => void;
  onSelectWeek: (weekNo: string) => void;
  isLoading: boolean;
}

export function PackingOverviewVisuals({
  records,
  allRecords,
  weekWindow,
  activeStatusFilter,
  activeWeekFilter,
  onSelectStatus,
  onSelectWeek,
  isLoading,
}: StatusVisualsProps) {
  const totalDays = records.length;
  const activeProductionDays = records.filter(
    (r) => r.status !== 'Off Day' && r.status !== 'Waiting'
  );

  const statusCounts = CAPACITY_STATUS_ORDER.reduce((acc, status) => {
    const matching = records.filter((r) => r.status === status);
    acc[status] = {
      days: matching.length,
      planQty: matching.reduce((s, r) => s + r.planQty, 0),
    };
    return acc;
  }, {} as Record<CapacityStatus, { days: number; planQty: number }>);

  // Weekly Capacity container strictly displays Last Week, Current Week, and Next Week
  const windowWeekSet = new Set(weekWindow.orderedWindowWeeks);
  const weekMap = new Map<
    string,
    {
      weekNo: string;
      roleLabel: 'Last Week' | 'Current Week' | 'Next Week';
      firstDate: string;
      lastDate: string;
      planQty: number;
      inputQty: number;
      tradeQty: number;
      plannedItems: number;
      finishedItems: number;
      totalNgQty: number;
      remainReworkQty: number;
      activeDays: number;
    }
  >();

  for (const row of allRecords) {
    const key = row.weekNo || 'Unassigned';
    if (!windowWeekSet.has(key)) continue;
    if (!weekMap.has(key)) {
      weekMap.set(key, {
        weekNo: key,
        roleLabel: weekWindow.roleByWeek[key] || 'Current Week',
        firstDate: row.dateLabel,
        lastDate: row.dateLabel,
        planQty: 0,
        inputQty: 0,
        tradeQty: 0,
        plannedItems: 0,
        finishedItems: 0,
        totalNgQty: 0,
        remainReworkQty: 0,
        activeDays: 0,
      });
    }
    const w = weekMap.get(key)!;
    w.lastDate = row.dateLabel;
    w.planQty += row.planQty;
    w.inputQty += row.inputQty;
    w.tradeQty += row.tradeQty;
    w.plannedItems += row.plannedItems;
    w.finishedItems += row.finishedItems;
    w.totalNgQty += row.totalNgQty;
    w.remainReworkQty += row.remainReworkQty;
    if (row.status !== 'Off Day' && row.status !== 'Waiting') w.activeDays += 1;
  }

  const weeks = weekWindow.orderedWindowWeeks
    .map((wk) => weekMap.get(wk))
    .filter((wk): wk is NonNullable<typeof wk> => Boolean(wk));

  const maxWeekQty = Math.max(
    1,
    ...weeks.map((w) => Math.max(w.planQty, w.inputQty))
  );

  const ngActiveDays = activeProductionDays.slice(-20);
  const maxDailyNg = Math.max(1, ...ngActiveDays.map((d) => d.totalNgQty));

  const weekdayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekdayStats = weekdayOrder
    .map((day) => {
      const matching = records.filter(
        (r) =>
          r.weekday.toLowerCase().startsWith(day.toLowerCase()) &&
          r.status !== 'Off Day' &&
          r.status !== 'Waiting'
      );
      const count = matching.length;
      const avgPlan =
        count > 0
          ? Math.round(matching.reduce((s, r) => s + r.planQty, 0) / count)
          : 0;
      const avgInput =
        count > 0
          ? Math.round(matching.reduce((s, r) => s + r.inputQty, 0) / count)
          : 0;
      const ngTotal = matching.reduce((s, r) => s + r.totalNgQty, 0);
      return { day, count, avgPlan, avgInput, ngTotal };
    })
    .filter((d) => d.count > 0);

  const radiusDonutSegments = CAPACITY_STATUS_ORDER.map((status) => ({
    id: status,
    label: status,
    count: statusCounts[status].days,
    color: CAPACITY_STATUS_META[status].color,
    highlightColor: CAPACITY_STATUS_META[status].highlightColor,
  }));

  const ngTrendItems = ngActiveDays.map((day) => ({
    id: day.id,
    axisLabel: day.dateLabel,
    headerTitle: `${day.dateLabel} (${day.weekday})`,
    headerSub: day.weekNo ? `${day.weekNo} · Status: ${day.status}` : undefined,
    totalValue: day.totalNgQty,
    segments: [
      {
        key: 'oqc',
        label: 'OQC NG',
        value: day.oqcNgQty,
        gradientClass: 'bg-gradient-to-t from-rose-500/85 via-rose-400 to-rose-300',
        swatchClass: 'bg-rose-400',
        glowColor: 'rgba(251, 113, 133, 0.7)',
      },
      {
        key: 'ppa',
        label: 'PPA NG',
        value: day.ppaNgQty,
        gradientClass: 'bg-gradient-to-t from-amber-500/85 via-amber-400 to-amber-200',
        swatchClass: 'bg-amber-300',
        glowColor: 'rgba(252, 211, 77, 0.65)',
      },
    ],
    footerNote: `Input: ${day.inputQty.toLocaleString()} / Plan: ${day.planQty.toLocaleString()}`,
  }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="glass-panel rounded-2xl p-5 h-28 animate-pulse"
            >
              <div className="h-3 w-24 bg-[#6A2FC8]/30 rounded mb-3" />
              <div className="h-7 w-24 bg-[#9D71E8]/25 rounded mb-2" />
              <div className="h-3 w-32 bg-[#25134D]/60 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 glass-panel rounded-2xl p-6 h-80 animate-pulse" />
          <div className="lg:col-span-7 glass-panel rounded-2xl p-6 h-80 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CapacityScorecardStrip records={records} />

      {/* Primary Visuals Row: Orbital Day Status Ring + Grouped Weekly Plan vs Input */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-5 glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-[#F2E9FF]">
                Daily Schedule Status
              </h2>
              <p className="text-xs text-[#D1B8FF]/65 mt-0.5">
                Hover arcs to inspect · Click any status to filter log
              </p>
            </div>
            {activeStatusFilter !== 'All' && (
              <button
                type="button"
                onClick={() => onSelectStatus('All')}
                className="text-xs font-medium text-[#D1B8FF] hover:text-[#F2E9FF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          <CosmicDonutChart
            segments={radiusDonutSegments}
            totalCount={totalDays}
            totalLabel="Days"
            activeFilter={activeStatusFilter}
            onSelect={(id) => onSelectStatus(id as CapacityStatus | 'All')}
            ariaLabel="Daily schedule status ring chart"
          />
        </section>

        {/* Weekly Plan vs Input Progressive Bar Chart (Last Week, Current Week, Next Week) */}
        <section className="lg:col-span-7 glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#F2E9FF]">
                Weekly Capacity: Plan vs. Input
              </h2>
              <p className="text-xs text-[#D1B8FF]/65 mt-0.5">
                Last week, current week, and next week · Click a week to filter
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#D1B8FF]/70">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D1B8FF]/45 border border-[#D1B8FF]/50" />
                <span>Plan Qty</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#9D71E8] shadow-[0_0_8px_rgba(157,113,232,0.85)]" />
                <span>Input Qty</span>
              </span>
              {activeWeekFilter !== 'All' && (
                <button
                  type="button"
                  onClick={() => onSelectWeek('All')}
                  className="text-xs font-medium text-[#D1B8FF] hover:text-[#F2E9FF] transition-colors cursor-pointer"
                >
                  Show 3-Week Window
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {weeks.length === 0 ? (
              <p className="text-sm text-[#D1B8FF]/65 py-10 text-center">
                No weekly data found for the current window.
              </p>
            ) : (
              weeks.map((wk, idx) => {
                const planWidth = (wk.planQty / maxWeekQty) * 100;
                const inputWidth = (wk.inputQty / maxWeekQty) * 100;
                const pct =
                  wk.planQty > 0
                    ? Math.round((wk.inputQty / wk.planQty) * 100)
                    : 0;
                const isSelected = activeWeekFilter === wk.weekNo;
                const isCurrent = wk.roleLabel === 'Current Week';
                const isOverTarget = pct >= 100 && wk.planQty > 0;

                return (
                  <button
                    key={wk.weekNo}
                    type="button"
                    onClick={() =>
                      onSelectWeek(isSelected ? 'All' : wk.weekNo)
                    }
                    className={`w-full text-left px-3.5 py-3 rounded-xl transition-all duration-150 cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-[#6A2FC8]/30 ring-1 ring-inset ring-[#9D71E8]/60 shadow-[0_0_20px_-6px_rgba(157,113,232,0.75)]'
                        : isCurrent
                          ? 'bg-[#25134D]/45 ring-1 ring-inset ring-[#D1B8FF]/20 hover:bg-[#6A2FC8]/22'
                          : 'bg-[#0B0720]/35 ring-1 ring-inset ring-[#D1B8FF]/8 hover:bg-[#6A2FC8]/18'
                    }`}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-sm font-semibold text-[#F2E9FF] shrink-0">
                          {wk.weekNo}
                        </span>
                        <span
                          className={`text-xs font-medium shrink-0 ${
                            isCurrent
                              ? 'text-[#D1B8FF]'
                              : 'text-[#D1B8FF]/65'
                          }`}
                        >
                          · {wk.roleLabel}
                        </span>
                        <span className="text-xs text-[#D1B8FF]/50 truncate hidden sm:inline">
                          · {wk.firstDate} – {wk.lastDate}
                        </span>
                      </div>
                      <div className="text-xs font-mono tabular-nums text-[#D1B8FF]/80 shrink-0">
                        <span className="font-semibold text-[#F2E9FF]">
                          {wk.inputQty.toLocaleString()}
                        </span>
                        <span className="text-[#D1B8FF]/60">
                          {' '}
                          / {wk.planQty.toLocaleString()} (
                        </span>
                        <span
                          className={`font-semibold ${
                            isOverTarget ? 'text-emerald-300' : 'text-[#D1B8FF]'
                          }`}
                        >
                          {pct}%
                        </span>
                        <span className="text-[#D1B8FF]/60">)</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {/* Plan Progressive Track */}
                      <div className="relative h-2.5 w-full bg-[#0B0720]/80 border border-[#D1B8FF]/12 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${planWidth}%` }}
                          transition={{
                            duration: 0.45,
                            delay: idx * 0.05,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className="h-full rounded-full bg-gradient-to-r from-[#25134D] via-[#D1B8FF]/30 to-[#D1B8FF]/55 relative"
                        >
                          <span
                            aria-hidden="true"
                            className="absolute inset-x-0 top-0 h-px bg-[#F2E9FF]/35"
                          />
                        </motion.div>
                      </div>

                      {/* Input Progressive Track */}
                      <div className="relative h-2.5 w-full bg-[#0B0720]/80 border border-[#D1B8FF]/12 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${inputWidth}%` }}
                          transition={{
                            duration: 0.52,
                            delay: idx * 0.05 + 0.04,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className={`h-full rounded-full relative ${
                            isOverTarget
                              ? 'bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-200 shadow-[0_0_14px_rgba(52,211,153,0.75)]'
                              : 'bg-gradient-to-r from-[#6A2FC8] via-[#9D71E8] to-[#D1B8FF] shadow-[0_0_14px_rgba(157,113,232,0.8)]'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className="absolute inset-x-0 top-0 h-px bg-white/50"
                          />
                        </motion.div>
                      </div>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono tabular-nums text-[#D1B8FF]/70">
                      <span>
                        Items: {wk.finishedItems}/{wk.plannedItems} · Trade:{' '}
                        {wk.tradeQty.toLocaleString()}
                      </span>
                      <span
                        className={
                          wk.remainReworkQty < 0
                            ? 'text-rose-400 font-semibold'
                            : ''
                        }
                      >
                        NG: {wk.totalNgQty}
                        {wk.remainReworkQty < 0
                          ? ` · Rework ${wk.remainReworkQty}`
                          : ''}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Secondary Row: Quality NG Breakdown + Weekday Averages */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#F2E9FF]">
                Daily Quality NG Trend (PPA vs. OQC)
              </h2>
              <p className="text-xs text-[#D1B8FF]/65 mt-0.5">
                Last {ngActiveDays.length} active production days · Hover a bar for exact counts
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#D1B8FF]/70">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.65)]" />
                <span>PPA NG</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.65)]" />
                <span>OQC NG</span>
              </span>
            </div>
          </div>

          <CosmicTrendBarChart
            items={ngTrendItems}
            maxValue={maxDailyNg}
            unitLabel="NG"
            emptyMessage="No active production days in the current filter."
          />
        </section>

        <section className="lg:col-span-5 glass-panel rounded-2xl p-6">
          <h2 className="text-base font-semibold text-[#F2E9FF]">
            Weekday Throughput Average
          </h2>
          <p className="text-xs text-[#D1B8FF]/65 mt-0.5">
            Average plan &amp; input capacity across active production days
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#D1B8FF]/16 text-xs font-medium text-[#D1B8FF]/70">
                  <th className="py-2 pr-3 font-medium">Weekday</th>
                  <th className="py-2 px-3 font-medium text-right">Avg Plan</th>
                  <th className="py-2 px-3 font-medium text-right">
                    Avg Input
                  </th>
                  <th className="py-2 pl-3 font-medium text-right">Total NG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1B8FF]/10 text-sm">
                {weekdayStats.map((row) => {
                  const pct =
                    row.avgPlan > 0
                      ? Math.min(100, Math.round((row.avgInput / row.avgPlan) * 100))
                      : 0;
                  return (
                    <tr
                      key={row.day}
                      className="h-10 hover:bg-[#6A2FC8]/18 transition-colors duration-150"
                    >
                      <td className="py-1.5 pr-3 font-medium text-[#F2E9FF]">
                        {row.day}
                        <span className="ml-1.5 text-xs text-[#D1B8FF]/60 font-mono">
                          ({row.count}d)
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono tabular-nums text-[#D1B8FF]/70">
                        {row.avgPlan.toLocaleString()}
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono tabular-nums text-[#F2E9FF] font-medium">
                        <div>{row.avgInput.toLocaleString()}</div>
                        <div className="mt-1 h-[2px] w-16 ml-auto bg-[#0B0720]/75 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#6A2FC8] to-[#9D71E8]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-1.5 pl-3 text-right font-mono tabular-nums text-amber-300">
                        {row.ngTotal.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
                {weekdayStats.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-6 text-center text-xs text-[#D1B8FF]/65"
                    >
                      No active weekdays in current selection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
