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
    textClass: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }
> = {
  Completed: {
    color: '#34D399',
    textClass: 'text-emerald-400',
    icon: CheckCircle2,
    description: 'Plan & items 100% finished with zero rework',
  },
  'Rework Alert': {
    color: '#F87171',
    textClass: 'text-red-400',
    icon: AlertTriangle,
    description: "Negative Remain Rework Qty's recorded",
  },
  'In Progress': {
    color: '#38BDF8',
    textClass: 'text-sky-400',
    icon: PlayCircle,
    description: 'Partial input received against plan',
  },
  Planned: {
    color: '#FBBF24',
    textClass: 'text-amber-400',
    icon: Clock,
    description: 'Scheduled plan awaiting input',
  },
  Waiting: {
    color: '#818CF8',
    textClass: 'text-indigo-400',
    icon: Hourglass,
    description: 'Upcoming/today date awaiting plan entry',
  },
  'Off Day': {
    color: '#64748B',
    textClass: 'text-slate-400',
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
            className="bg-[#0C172B] border border-[#1B2B48] rounded-xl p-5 h-28 animate-pulse"
          >
            <div className="h-3 w-24 bg-[#182947] rounded mb-3" />
            <div className="h-7 w-24 bg-[#182947] rounded mb-2" />
            <div className="h-3 w-32 bg-[#13223D] rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#0C172B] border border-[#1B2B48] hover:border-[#2A426E] rounded-xl p-5 transition-colors duration-150"
      >
        <p className="text-xs font-medium text-slate-400">Input vs. Plan Qty</p>
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <span className="text-2xl font-semibold tracking-tight text-slate-100 font-mono tabular-nums">
            {totalInputQty.toLocaleString()}
          </span>
          <span className="text-xs font-medium text-sky-400 font-mono tabular-nums">
            {qtyProgressPct}%
          </span>
        </div>
        <div className="mt-2.5 h-1.5 w-full bg-[#13223D] rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${Math.min(100, qtyProgressPct)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-400 font-mono tabular-nums">
          Plan {totalPlanQty.toLocaleString()} · Trade{' '}
          {totalTradeQty.toLocaleString()}
        </p>
      </motion.div>

      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#0C172B] border border-[#1B2B48] hover:border-[#2A426E] rounded-xl p-5 transition-colors duration-150"
      >
        <p className="text-xs font-medium text-slate-400">
          Finished vs. Planned Items
        </p>
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <span className="text-2xl font-semibold tracking-tight text-slate-100 font-mono tabular-nums">
            {totalFinishedItems.toLocaleString()}
          </span>
          <span className="text-xs font-medium text-emerald-400 font-mono tabular-nums">
            {itemProgressPct}%
          </span>
        </div>
        <div className="mt-2.5 h-1.5 w-full bg-[#13223D] rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-400 transition-all duration-300"
            style={{ width: `${Math.min(100, itemProgressPct)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-400 font-mono tabular-nums">
          {totalPlannedItems.toLocaleString()} planned ·{' '}
          {activeProductionDays.length} active{' '}
          {activeProductionDays.length === 1 ? 'day' : 'days'}
        </p>
      </motion.div>

      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#0C172B] border border-[#1B2B48] hover:border-[#2A426E] rounded-xl p-5 transition-colors duration-150"
      >
        <p className="text-xs font-medium text-slate-400">Total Quality NG</p>
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <span className="text-2xl font-semibold tracking-tight text-amber-400 font-mono tabular-nums">
            {totalNg.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            {totalInputQty > 0
              ? `${((totalNg / totalInputQty) * 100).toFixed(3)}%`
              : '0%'}
          </span>
        </div>
        <p className="mt-3 text-xs text-slate-300 font-mono tabular-nums">
          PPA NG: {totalPpaNg.toLocaleString()} · OQC NG:{' '}
          {totalOqcNg.toLocaleString()}
        </p>
      </motion.div>

      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#0C172B] border border-[#1B2B48] hover:border-[#2A426E] rounded-xl p-5 transition-colors duration-150"
      >
        <p className="text-xs font-medium text-slate-400">Remain Rework Qty</p>
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <span
            className={`text-2xl font-semibold tracking-tight font-mono tabular-nums ${
              totalRemainRework < 0 ? 'text-red-400' : 'text-emerald-400'
            }`}
          >
            {totalRemainRework.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            {reworkDaysCount} {reworkDaysCount === 1 ? 'day' : 'days'}
          </span>
        </div>
        <p className="mt-3 text-xs text-slate-400">
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

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  const donutSegments = CAPACITY_STATUS_ORDER.map((status) => {
    const count = statusCounts[status].days;
    const ratio = totalDays > 0 ? count / totalDays : 0;
    const segmentLength = ratio * circumference;
    const dashOffset = -cumulativeOffset;
    cumulativeOffset += segmentLength;
    return {
      status,
      count,
      segmentLength,
      dashOffset,
      color: CAPACITY_STATUS_META[status].color,
    };
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#0C172B] border border-[#1B2B48] rounded-xl p-5 h-28 animate-pulse"
            >
              <div className="h-3 w-24 bg-[#182947] rounded mb-3" />
              <div className="h-7 w-24 bg-[#182947] rounded mb-2" />
              <div className="h-3 w-32 bg-[#13223D] rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-[#0C172B] border border-[#1B2B48] rounded-xl p-6 h-80 animate-pulse" />
          <div className="lg:col-span-7 bg-[#0C172B] border border-[#1B2B48] rounded-xl p-6 h-80 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CapacityScorecardStrip records={records} />

      {/* Primary Visuals Row: Day Status Ring + Weekly Plan vs Input */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-5 bg-[#0C172B] border border-[#1B2B48] rounded-xl p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Daily Schedule Status
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any status row to filter the daily capacity log
              </p>
            </div>
            {activeStatusFilter !== 'All' && (
              <button
                type="button"
                onClick={() => onSelectStatus('All')}
                className="text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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
                aria-label="Daily schedule status ring chart"
              >
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke="#13223D"
                  strokeWidth="18"
                />
                {totalDays > 0 &&
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
                          activeStatusFilter === 'All' ||
                          activeStatusFilter === seg.status
                            ? 1
                            : 0.22
                        }
                        className="transition-opacity duration-150 cursor-pointer hover:opacity-90"
                        onClick={() =>
                          onSelectStatus(
                            activeStatusFilter === seg.status
                              ? 'All'
                              : seg.status
                          )
                        }
                      />
                    ) : null
                  )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-semibold text-slate-100 font-mono tabular-nums">
                  {totalDays}
                </span>
                <span className="text-xs text-slate-400">Days</span>
              </div>
            </div>

            <div className="w-full divide-y divide-[#162542]">
              {CAPACITY_STATUS_ORDER.map((status) => {
                const count = statusCounts[status].days;
                const pct =
                  totalDays > 0 ? Math.round((count / totalDays) * 100) : 0;
                const isSelected = activeStatusFilter === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() =>
                      onSelectStatus(isSelected ? 'All' : status)
                    }
                    className={`w-full py-2 px-2.5 flex items-center justify-between gap-3 text-left rounded-md transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-[#162849]'
                        : 'hover:bg-[#12203B] hover:translate-x-0.5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                        style={{
                          backgroundColor: CAPACITY_STATUS_META[status].color,
                        }}
                        aria-hidden="true"
                      />
                      <span className="text-sm font-medium text-slate-200 truncate">
                        {status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums">
                      <span className="text-sm font-semibold text-slate-100 w-7 text-right">
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

        {/* Weekly Plan vs Input Capacity Chart (Last Week, Current Week, Next Week) */}
        <section className="lg:col-span-7 bg-[#0C172B] border border-[#1B2B48] rounded-xl p-6 flex flex-col justify-between">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Weekly Capacity: Plan vs. Input
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Last week, current week, and next week · Click a week to filter
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#2C426B]" />
                <span>Plan Qty</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-500" />
                <span>Input Qty</span>
              </span>
              {activeWeekFilter !== 'All' && (
                <button
                  type="button"
                  onClick={() => onSelectWeek('All')}
                  className="text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
                >
                  Show 3-Week Window
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {weeks.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">
                No weekly data found for the current window.
              </p>
            ) : (
              weeks.map((wk) => {
                const planWidth = (wk.planQty / maxWeekQty) * 100;
                const inputWidth = (wk.inputQty / maxWeekQty) * 100;
                const pct =
                  wk.planQty > 0
                    ? Math.round((wk.inputQty / wk.planQty) * 100)
                    : 0;
                const isSelected = activeWeekFilter === wk.weekNo;
                const isCurrent = wk.roleLabel === 'Current Week';

                return (
                  <button
                    key={wk.weekNo}
                    type="button"
                    onClick={() =>
                      onSelectWeek(isSelected ? 'All' : wk.weekNo)
                    }
                    className={`w-full text-left p-3 -mx-3 rounded-lg transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-[#162849]'
                        : 'hover:bg-[#12203B]'
                    }`}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-sm font-semibold text-slate-100 shrink-0">
                          {wk.weekNo}
                        </span>
                        <span
                          className={`text-xs font-medium shrink-0 ${
                            isCurrent ? 'text-sky-400' : 'text-slate-400'
                          }`}
                        >
                          · {wk.roleLabel}
                        </span>
                        <span className="text-xs text-slate-500 truncate hidden sm:inline">
                          · {wk.firstDate} – {wk.lastDate}
                        </span>
                      </div>
                      <div className="text-xs font-mono tabular-nums text-slate-300 shrink-0">
                        <span className="font-semibold text-slate-100">
                          {wk.inputQty.toLocaleString()}
                        </span>
                        <span className="text-slate-400">
                          {' '}
                          / {wk.planQty.toLocaleString()} ({pct}%)
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="h-2.5 w-full bg-[#13223D] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#334E7D] rounded-full transition-all duration-300"
                          style={{ width: `${planWidth}%` }}
                        />
                      </div>
                      <div className="h-2.5 w-full bg-[#13223D] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${inputWidth}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono tabular-nums text-slate-400">
                      <span>
                        Items: {wk.finishedItems}/{wk.plannedItems} · Trade:{' '}
                        {wk.tradeQty.toLocaleString()}
                      </span>
                      <span
                        className={
                          wk.remainReworkQty < 0
                            ? 'text-red-400 font-medium'
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
        <section className="lg:col-span-7 bg-[#0C172B] border border-[#1B2B48] rounded-xl p-6 flex flex-col justify-between">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Daily Quality NG Trend (PPA vs. OQC)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Last {ngActiveDays.length} active production days · Hover a bar for exact counts
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-400" />
                <span>PPA NG</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-red-400" />
                <span>OQC NG</span>
              </span>
            </div>
          </div>

          <div className="mt-6">
            {ngActiveDays.length === 0 ? (
              <p className="text-sm text-slate-400 py-10 text-center">
                No active production days in the current filter.
              </p>
            ) : (
              <div className="h-48 flex items-end gap-1.5 sm:gap-2 pt-4 border-b border-[#1B2B48]">
                {ngActiveDays.map((day) => {
                  const totalH =
                    maxDailyNg > 0 ? (day.totalNgQty / maxDailyNg) * 100 : 0;
                  const ppaShare =
                    day.totalNgQty > 0
                      ? (day.ppaNgQty / day.totalNgQty) * 100
                      : 0;
                  const oqcShare = 100 - ppaShare;
                  return (
                    <div
                      key={day.id}
                      className="flex-1 min-w-0 h-full flex flex-col justify-end items-center group"
                      title={`${day.dateLabel} (${day.weekday}): Total NG ${day.totalNgQty} (PPA ${day.ppaNgQty}, OQC ${day.oqcNgQty})`}
                    >
                      <span className="text-[10px] font-mono tabular-nums text-slate-300 mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        {day.totalNgQty}
                      </span>
                      <div
                        className="w-full max-w-[22px] rounded-t-sm overflow-hidden flex flex-col justify-end bg-[#13223D] group-hover:scale-x-110 transition-transform duration-150"
                        style={{
                          height: `${Math.max(day.totalNgQty > 0 ? 6 : 2, totalH)}%`,
                        }}
                      >
                        {day.oqcNgQty > 0 && (
                          <div
                            className="w-full bg-red-400"
                            style={{ height: `${oqcShare}%` }}
                          />
                        )}
                        {day.ppaNgQty > 0 && (
                          <div
                            className="w-full bg-amber-400"
                            style={{ height: `${ppaShare}%` }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {ngActiveDays.length > 0 && (
              <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>{ngActiveDays[0].dateLabel}</span>
                <span>
                  Peak: {Math.max(...ngActiveDays.map((d) => d.totalNgQty))} NG
                </span>
                <span>{ngActiveDays[ngActiveDays.length - 1].dateLabel}</span>
              </div>
            )}
          </div>
        </section>

        <section className="lg:col-span-5 bg-[#0C172B] border border-[#1B2B48] rounded-xl p-6">
          <h2 className="text-base font-semibold text-slate-100">
            Weekday Throughput Average
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Average plan & input capacity across active production days
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1B2B48] text-xs font-medium text-slate-400">
                  <th className="py-2 pr-3 font-medium">Weekday</th>
                  <th className="py-2 px-3 font-medium text-right">Avg Plan</th>
                  <th className="py-2 px-3 font-medium text-right">
                    Avg Input
                  </th>
                  <th className="py-2 pl-3 font-medium text-right">Total NG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#162542] text-sm">
                {weekdayStats.map((row) => (
                  <tr
                    key={row.day}
                    className="h-9 hover:bg-[#12203B] transition-colors duration-150"
                  >
                    <td className="py-1.5 pr-3 font-medium text-slate-200">
                      {row.day}
                      <span className="ml-1.5 text-xs text-slate-400 font-mono">
                        ({row.count}d)
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono tabular-nums text-slate-400">
                      {row.avgPlan.toLocaleString()}
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono tabular-nums text-slate-100 font-medium">
                      {row.avgInput.toLocaleString()}
                    </td>
                    <td className="py-1.5 pl-3 text-right font-mono tabular-nums text-amber-400">
                      {row.ngTotal.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {weekdayStats.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-6 text-center text-xs text-slate-400"
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
