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
      <div className="bg-[#0C172B] border border-[#1B2B48] rounded-xl p-12 text-center">
        <p className="text-sm font-medium text-slate-100">
          No weekly capacity data found
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Verify your Google Sheet includes a Week No. column.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {weeks.map((wk) => {
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
            whileHover={{ y: -2 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[#0C172B] border border-[#1B2B48] hover:border-[#2A426E] rounded-xl p-6 flex flex-col justify-between space-y-5 transition-colors duration-150"
          >
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-100 font-mono">
                    {wk.weekNo}
                    {roleLabel && (
                      <span
                        className={`ml-2 font-sans text-xs font-medium ${
                          roleLabel === 'Current Week'
                            ? 'text-sky-400'
                            : 'text-slate-400'
                        }`}
                      >
                        · {roleLabel}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {firstDate === lastDate
                      ? firstDate
                      : `${firstDate} – ${lastDate}`}{' '}
                    · {wk.activeDays} active{' '}
                    {wk.activeDays === 1 ? 'day' : 'days'}
                  </p>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <div className="text-lg font-semibold text-slate-100">
                    {qtyPct}%
                  </div>
                  <div className="text-xs text-slate-400">Input / Plan</div>
                </div>
              </div>

              {/* Dual Progress Bars */}
              <div className="mt-4 space-y-2.5">
                <div>
                  <div className="flex justify-between text-xs font-mono tabular-nums text-slate-300 mb-1">
                    <span>Qty Volume</span>
                    <span>
                      {wk.inputQty.toLocaleString()} /{' '}
                      {wk.planQty.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#13223D] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${Math.min(100, qtyPct)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono tabular-nums text-slate-300 mb-1">
                    <span>Items Finished</span>
                    <span>
                      {wk.finishedItems} / {wk.plannedItems} ({itemPct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#13223D] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-300"
                      style={{ width: `${Math.min(100, itemPct)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Quality & Rework Metrics */}
              <dl className="mt-5 grid grid-cols-4 gap-3 pt-4 border-t border-[#162542] text-xs">
                <div>
                  <dt className="text-slate-400">Trade</dt>
                  <dd className="font-mono tabular-nums font-semibold text-slate-100 mt-0.5">
                    {wk.tradeQty.toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">PPA NG</dt>
                  <dd className="font-mono tabular-nums font-semibold text-slate-100 mt-0.5">
                    {wk.ppaNgQty}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">OQC NG</dt>
                  <dd className="font-mono tabular-nums font-semibold text-slate-100 mt-0.5">
                    {wk.oqcNgQty}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Rework</dt>
                  <dd
                    className={`font-mono tabular-nums font-semibold mt-0.5 ${
                      wk.remainReworkQty < 0 ? 'text-red-400' : 'text-slate-100'
                    }`}
                  >
                    {wk.remainReworkQty}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="pt-4 border-t border-[#162542] flex items-center justify-between gap-4">
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                Total NG: {wk.totalNgQty}
              </span>
              <button
                type="button"
                onClick={() => onInspectWeek(wk.weekNo)}
                className="group inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300 whitespace-nowrap shrink-0 cursor-pointer transition-colors duration-150"
              >
                <span>View Daily Rows</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
              </button>
            </div>
          </motion.section>
        );
      })}
    </div>
  );
}
