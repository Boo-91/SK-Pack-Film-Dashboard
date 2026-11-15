import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { PackingCapacityRow } from '../types/packing';
import { CapacityStatusLabel } from './StatusVisuals';

interface OrderDetailDrawerProps {
  record: PackingCapacityRow | null;
  onClose: () => void;
}

export function OrderDetailDrawer({ record, onClose }: OrderDetailDrawerProps) {
  useEffect(() => {
    if (!record) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [record, onClose]);

  const extraEntries = record?.rawRow ? Object.entries(record.rawRow) : [];

  return (
    <AnimatePresence>
      {record && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 bg-[#02060F]/70 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            initial={{ x: 36, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 36, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-md bg-[#0C172B] border-l border-[#1B2B48] h-full overflow-y-auto p-6 flex flex-col justify-between"
            role="dialog"
            aria-modal="true"
            aria-label={`Capacity record for ${record.dateLabel}`}
          >
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#1B2B48]">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">
                    {record.dateLabel} ({record.weekday})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    {record.weekNo}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-[#13223D] transition-colors duration-150 cursor-pointer"
                  aria-label="Close record details"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-4">
                <CapacityStatusLabel status={record.status} />
                <span className="text-xs font-mono tabular-nums text-slate-400">
                  {record.completionPct}% Input / Plan
                </span>
              </div>

              {/* Volume & Item Progress */}
              <div className="py-4 border-y border-[#162542] space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-slate-300">
                      Input Qty&apos;s vs. Plan Qty&apos;s
                    </span>
                    <span className="font-mono tabular-nums text-slate-100 font-semibold">
                      {record.inputQty.toLocaleString()} /{' '}
                      {record.planQty.toLocaleString()} ({record.completionPct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#13223D] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${Math.min(100, record.completionPct)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-slate-300">
                      Finished Items vs. Planned Items
                    </span>
                    <span className="font-mono tabular-nums text-slate-100 font-semibold">
                      {record.finishedItems} / {record.plannedItems} (
                      {record.itemCompletionPct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#13223D] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-300"
                      style={{
                        width: `${Math.min(100, record.itemCompletionPct)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Exact Sheet Metrics */}
              <dl className="grid grid-cols-2 gap-y-4 gap-x-4 text-sm">
                <div>
                  <dt className="text-xs text-slate-400">Trade Qty&apos;s</dt>
                  <dd className="font-mono tabular-nums font-medium text-slate-100 mt-0.5">
                    {record.tradeQty.toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">
                    Remain Rework Qty&apos;s
                  </dt>
                  <dd
                    className={`font-mono tabular-nums font-semibold mt-0.5 ${
                      record.remainReworkQty < 0
                        ? 'text-red-400'
                        : 'text-slate-100'
                    }`}
                  >
                    {record.remainReworkQty.toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">PPA NG Qty&apos;s</dt>
                  <dd className="font-mono tabular-nums font-medium text-slate-100 mt-0.5">
                    {record.ppaNgQty.toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">OQC NG Qty&apos;s</dt>
                  <dd className="font-mono tabular-nums font-medium text-slate-100 mt-0.5">
                    {record.oqcNgQty.toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">
                    Total&apos;s NG Qty&apos;s
                  </dt>
                  <dd className="font-mono tabular-nums font-semibold text-amber-400 mt-0.5">
                    {record.totalNgQty.toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Week No.</dt>
                  <dd className="font-mono font-medium text-slate-100 mt-0.5">
                    {record.weekNo}
                  </dd>
                </div>
              </dl>

              {extraEntries.length > 0 && (
                <div className="pt-4 border-t border-[#162542]">
                  <p className="text-xs font-medium text-slate-400 mb-2">
                    Raw Spreadsheet Row
                  </p>
                  <dl className="divide-y divide-[#162542] text-xs">
                    {extraEntries.map(([k, v]) => (
                      <div
                        key={k}
                        className="py-1.5 flex items-start justify-between gap-4"
                      >
                        <dt className="text-slate-400 shrink-0">{k}</dt>
                        <dd className="text-slate-200 font-mono text-right break-all">
                          {v || '—'}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>

            <div className="pt-6 mt-6 border-t border-[#1B2B48]">
              <button
                type="button"
                onClick={onClose}
                className="w-full h-10 px-4 text-sm font-medium text-slate-200 bg-[#13223D] hover:bg-[#1A2E52] rounded-lg transition-colors duration-150 cursor-pointer"
              >
                Close Panel
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
