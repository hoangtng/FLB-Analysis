import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '../store/useStore';
import { getDelays } from '../api/client';
import { CAT_COLORS, SEVERITY_COLOR } from '../utils/constants';

import { ChevronUp, ChevronDown } from 'lucide-react';

type SortKey = 'date' | 'flight' | 'origin' | 'code' | 'minutes';

export default function OpsView() {
  const { filters, activeUploadId } = useStore();
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'minutes',
    dir: 'desc',
  });


  // Build query params
  const params: Record<string, string> = {
    sort:  sort.key,
    dir:   sort.dir,
    limit: '300',
  };
  if (activeUploadId)     params.uploadId   = activeUploadId;
  if (filters.origin)     params.origin     = filters.origin;
  if (filters.cat)        params.cat        = filters.cat;
  if (filters.chargeable) params.chargeable = filters.chargeable;
  if (filters.search)     params.search     = filters.search;
  if (filters.from)     params.from       = filters.from;
  if (filters.to)       params.to         = filters.to;

  const { data: delaysData } = useQuery({
    queryKey: ['delays', params],
    queryFn:  () => getDelays(params),
    refetchInterval: 30_000,
  });

  const records  = delaysData?.data ?? [];
  
  const toggleSort = (key: SortKey) =>
    setSort(s => ({
      key,
      dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc',
    }));



  return (
    <div className="flex h-full overflow-hidden">

      

      {/* ── Main Feed ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-display text-[13px] font-bold">Delay Events</span>
          </div>
          <span className="font-mono text-[10px] text-muted">
            {records.length} records
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr>
                {(
                  [
                    ['date',   'Date'],
                    ['flight', 'Flight'],
                    ['origin', 'Station'],
                    ['code',   'Code'],
                  ] as [SortKey, string][]
                ).map(([k, label]) => (
                  <th
                    key={k}
                    onClick={() => toggleSort(k)}
                    className="text-left px-4 py-2.5 font-mono text-[9px] tracking-widest uppercase text-muted border-b border-border sticky top-0 bg-surface cursor-pointer hover:text-white whitespace-nowrap"
                  >
                    <span className="inline-flex items-center gap-1">
                      {label}
                      {sort.key === k && (
                        sort.dir === 'desc'
                          ? <ChevronDown size={10} />
                          : <ChevronUp   size={10} />
                      )}
                    </span>
                  </th>
                ))}
                <th className="text-left px-4 py-2.5 font-mono text-[9px] tracking-widest uppercase text-muted border-b border-border sticky top-0 bg-surface">
                  Description
                </th>
                <th
                  onClick={() => toggleSort('minutes')}
                  className="text-left px-4 py-2.5 font-mono text-[9px] tracking-widest uppercase text-muted border-b border-border sticky top-0 bg-surface cursor-pointer hover:text-white"
                >
                  <span className="inline-flex items-center gap-1">
                    Min
                    {sort.key === 'minutes' && (
                      sort.dir === 'desc'
                        ? <ChevronDown size={10} />
                        : <ChevronUp   size={10} />
                    )}
                  </span>
                </th>
                <th className="text-left px-4 py-2.5 font-mono text-[9px] tracking-widest uppercase text-muted border-b border-border sticky top-0 bg-surface">
                  Reason
                </th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr
                  key={r._id}
                  
                  className="hover:bg-surface2 transition-colors cursor-pointer border-b border-border/40"
                >
                  <td className="px-4 py-2.5 font-mono text-[10px] text-muted whitespace-nowrap">
                    {r.date}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11px] whitespace-nowrap">
                    {r.flight}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-muted2">
                    {r.origin || '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className="font-mono text-[10px] px-1.5 py-0.5 rounded border"
                      style={{
                        color:       CAT_COLORS[r.cat] ?? '#8892aa',
                        borderColor: `${CAT_COLORS[r.cat] ?? '#8892aa'}40`,
                      }}
                    >
                      {r.code}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted2 max-w-[180px] truncate">
                    {r.shortDesc}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span
                      className="font-mono text-[11px]"
                      style={{ color: SEVERITY_COLOR(r.minutes) }}
                    >
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
                        style={{ background: SEVERITY_COLOR(r.minutes) }}
                      />
                      {r.minutes}m
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted max-w-[220px] truncate text-[11px]">
                    {r.reasonText || '—'}
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted text-sm">
                    No records match current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}