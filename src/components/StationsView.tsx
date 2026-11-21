import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import type { WeekWindowMeta } from '../lib/sheetParser';
import { PackingCapacityRow } from '../types/packing';

interface WeeklyCapacityViewProps {
  records: PackingCapacityRow[];
  weekWindow?: WeekWindowMeta;
  onInspectWeek: (weekNo: string) => void;
}

export function WeeklyCapacityView({
  records,
  weekWindow,
  onInspectWeek,
}: WeeklyCapacityViewProps) {
  const weekMap = new Map<
    string,
    {
      weekNo: string;
      dateRange: string[];
      activeDays: number;
      planQty: number;
      inputQty: number;
      tradeQty: number;
      plannedItems: number;
      finishedItems: number;
      remainReworkQty: number;
      ppaNgQty: number;
      oqcNgQty: number;
      totalNgQty: number;
    }
  >();

  for (const row of records) {
    const key = row.weekNo || 'Unassigned';
    if (!weekMap.has(key)) {
      weekMap.set(key, {
        weekNo: key,
        dateRange: [],
        activeDays: 0,
        planQty: 0,
        inputQty: 0,
        tradeQty: 0,
        plannedItems: 0,
        finishedItems: 0,
        remainReworkQty: 0,
        ppaNgQty: 0,
        oqcNgQty: 0,
        totalNgQty: 0,
      });
    }
    const wk = weekMap.get(key)!;
    wk.dateRange.push(row.dateLabel);
    if (row.status !== 'Off Day' && row.status !== 'Waiting') wk.activeDays += 1;
    wk.planQty += row.planQty;
    wk.inputQty += row.inputQty;
    wk.tradeQty += row.tradeQty;
    wk.plannedItems += row.plannedItems;
    wk.finishedItems += row.finishedItems;
    wk.remainReworkQty += row.remainReworkQty;
    wk.ppaNgQty += row.ppaNgQty;
    wk.oqcNgQty += row.oqcNgQty;
    wk.totalNgQty += row.totalNgQty;
  }

  const weeks = Array.from(weekMap.values());

  if (weeks.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center">
        <p className="text-sm font-medium text-[#F2E9FF]">
          No weekly capacity data found
        </p>
        <p className="text-xs text-[#D1B8FF]/65 mt-1">
          Verify your Google Sheet includes a Week No. column.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {weeks.map((wk, idx) => {
        const qtyPct =
          wk.planQty > 0
            ? Math.round((wk.inputQty / wk.planQty) * 1000) / 10
            : 0;
        const itemPct =
          wk.plannedItems > 0
            ? Math.round((wk.finishedItems / wk.plannedItems) * 1000) / 10
            : 0;
        const firstDate = wk.dateRange[0];
        const lastDate = wk.dateRange[wk.dateRange.length - 1];
        const roleLabel = weekWindow?.roleByWeek[wk.weekNo];

        return (
          <motion.section
            key={wk.weekNo}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -3 }}
            transition={{
              duration: 0.22,
              delay: Math.min(idx * 0.04, 0.24),
              ease: [0.16, 1, 0.3, 1],
            }}
            className="glass-panel-interactive rounded-2xl p-6 flex flex-col justify-between space-y-5 relative overflow-hidden"
          >
            {roleLabel === 'Current Week' && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#9D71E8]/75 to-transparent"
              />
            )}

            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-[#F2E9FF] font-mono">
                    {wk.weekNo}
                    {roleLabel && (
                      <span
                        className={`ml-2 font-sans text-xs font-medium ${
                          roleLabel === 'Current Week'
                            ? 'text-[#D1B8FF]'
                            : 'text-[#D1B8FF]/65'
                        }`}
                      >
                        · {roleLabel}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[#D1B8FF]/65 mt-0.5">
                    {firstDate === lastDate
                      ? firstDate
                      : `${firstDate} – ${lastDate}`}{' '}
                    · {wk.activeDays} active{' '}
                    {wk.activeDays === 1 ? 'day' : 'days'}
                  </p>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <div className="text-lg font-semibold text-[#F2E9FF]">
                    {qtyPct}%
                  </div>
                  <div className="text-xs text-[#D1B8FF]/65">Input / Plan</div>
                </div>
              </div>

              {/* Dual Progress Bars */}
              <div className="mt-4 space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-mono tabular-nums text-[#D1B8FF]/85 mb-1.5">
                    <span>Qty Volume</span>
                    <span>
                      {wk.inputQty.toLocaleString()} /{' '}
                      {wk.planQty.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#0B0720]/75 border border-[#D1B8FF]/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, qtyPct)}%` }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full bg-gradient-to-r from-[#6A2FC8] to-[#9D71E8] shadow-[0_0_12px_rgba(157,113,232,0.7)]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono tabular-nums text-[#D1B8FF]/85 mb-1.5">
                    <span>Items Finished</span>
                    <span>
                      {wk.finishedItems} / {wk.plannedItems} ({itemPct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#0B0720]/75 border border-[#D1B8FF]/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, itemPct)}%` }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.6)]"
                    />
                  </div>
                </div>
              </div>

              {/* Quality & Rework Metrics */}
              <dl className="mt-5 grid grid-cols-4 gap-3 pt-4 border-t border-[#D1B8FF]/12 text-xs">
                <div>
                  <dt className="text-[#D1B8FF]/65">Trade</dt>
                  <dd className="font-mono tabular-nums font-semibold text-[#F2E9FF] mt-0.5">
                    {wk.tradeQty.toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#D1B8FF]/65">PPA NG</dt>
                  <dd className="font-mono tabular-nums font-semibold text-[#F2E9FF] mt-0.5">
                    {wk.ppaNgQty}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#D1B8FF]/65">OQC NG</dt>
                  <dd className="font-mono tabular-nums font-semibold text-[#F2E9FF] mt-0.5">
                    {wk.oqcNgQty}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#D1B8FF]/65">Rework</dt>
                  <dd
                    className={`font-mono tabular-nums font-semibold mt-0.5 ${
                      wk.remainReworkQty < 0 ? 'text-rose-400' : 'text-[#F2E9FF]'
                    }`}
                  >
                    {wk.remainReworkQty}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="pt-4 border-t border-[#D1B8FF]/12 flex items-center justify-between gap-4">
              <span className="text-xs text-[#D1B8FF]/70 font-mono tabular-nums">
                Total NG: {wk.totalNgQty}
              </span>
              <button
                type="button"
                onClick={() => onInspectWeek(wk.weekNo)}
                className="group inline-flex items-center gap-1.5 text-xs font-medium text-[#D1B8FF] hover:text-[#F2E9FF] whitespace-nowrap shrink-0 cursor-pointer transition-colors duration-150"
              >
                <span>View Daily Rows</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#9D71E8] transition-transform duration-150 group-hover:translate-x-1" />
              </button>
            </div>
          </motion.section>
        );
      })}
    </div>
  );
}
