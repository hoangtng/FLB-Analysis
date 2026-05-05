import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '../store/useStore';
import { getDelays, getStats, getOrigins } from '../api/client';
import { CAT_COLORS, CONTACT_TEAMS, SEVERITY_COLOR } from '../utils/constants';
import { getMonthOptions, getWeekOptions, monthToDateRange } from '../utils/dateHelpers';
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import clsx from 'clsx';

type SortKey = 'date' | 'flight' | 'origin' | 'code' | 'minutes';
const PAGE_SIZE = 100;
function getPageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];

  // Always show first page
  pages.push(1);

  // Left ellipsis
  if (current > 3) pages.push('...');

  // Pages around current
  const start = Math.max(2, current - 1);
  const end   = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  // Right ellipsis
  if (current < total - 2) pages.push('...');

  // Always show last page
  pages.push(total);

  return pages;
}

export default function OpsView() {
  const { filters, setFilter, setMonthFilter, setWeekFilter, setQuickRange,
          resetFilters, activeUploadId, page, setPage, openAlert } = useStore();

  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'minutes',
    dir: 'desc',
  });
  

  // Resolve month/week selections into from/to date strings
  const dateRange = useMemo((): { from: string; to: string } => {
    if (filters.month && filters.week) {
      const found = getWeekOptions(filters.month).find(w => w.value === filters.week);
      if (found) return { from: found.from, to: found.to };
    }
    if (filters.month) return monthToDateRange(filters.month);
    if (filters.from || filters.to) return { from: filters.from, to: filters.to };
    return { from: '', to: '' };
  }, [filters.month, filters.week, filters.from, filters.to]);

  // Params for the paginated delay records table
  const params = useMemo((): Record<string, string> => {
    const p: Record<string, string> = {
      sort:  sort.key,
      dir:   sort.dir,
      limit: String(PAGE_SIZE),
      page:  String(page),
    };
    if (activeUploadId)     p.uploadId   = activeUploadId;
    if (filters.origin)     p.origin     = filters.origin;
    if (filters.cat)        p.cat        = filters.cat;
    if (filters.chargeable) p.chargeable = filters.chargeable;
    if (filters.search)     p.search     = filters.search;
    if (dateRange.from)     p.from       = dateRange.from;
    if (dateRange.to)       p.to         = dateRange.to;
    return p;
  }, [filters, sort, activeUploadId, dateRange, page]);

  // Params for KPI numbers — same date filter, no pagination
  const statsParams = useMemo((): Record<string, string> => {
    const p: Record<string, string> = {};
    if (activeUploadId) p.uploadId = activeUploadId;
    if (dateRange.from) p.from     = dateRange.from;
    if (dateRange.to)   p.to       = dateRange.to;
    return p;
  }, [activeUploadId, dateRange]);

  // Params for sidebar charts — always full dataset
  const fullParams = useMemo((): Record<string, string> => {
    const p: Record<string, string> = {};
    if (activeUploadId) p.uploadId = activeUploadId;
    return p;
  }, [activeUploadId]);

  const { data: delaysData, isFetching } = useQuery({
    queryKey:        ['delays', params],
    queryFn:         () => getDelays(params),
    refetchInterval: 30_000,
    enabled:         !!activeUploadId,
  });

  const { data: statsData } = useQuery({
    queryKey: ['stats-filtered', statsParams],
    queryFn:  () => getStats(statsParams),
    enabled:  !!activeUploadId,
  });

  const { data: fullStatsData } = useQuery({
    queryKey: ['stats-full', fullParams],
    queryFn:  () => getStats(fullParams),
    enabled:  !!activeUploadId,
  });

  const { data: origins } = useQuery({
    queryKey: ['origins', activeUploadId],
    queryFn:  () => getOrigins(activeUploadId ?? undefined),
    enabled:  !!activeUploadId,
  });

  const records    = delaysData?.data  ?? [];
  const totalRows  = delaysData?.total ?? 0;
  const totalPages = Math.ceil(totalRows / PAGE_SIZE);

  const summary  = statsData?.summary;
  const byCode   = fullStatsData?.byCode ?? [];
  const byHour   = fullStatsData?.byHour ?? [];
  const maxCount = byCode[0]?.count ?? 1;
  const maxHour  = Math.max(1, ...byHour.map(h => h.count));

  const monthOptions = useMemo(
    () => getMonthOptions(fullStatsData?.byMonth.map(m => m.month) ?? []),
    [fullStatsData]
  );

  const weekOptions = useMemo(
    () => filters.month ? getWeekOptions(filters.month) : [],
    [filters.month]
  );

  const activeFilterCount = useMemo(() =>
    [filters.origin, filters.cat, filters.chargeable, filters.search,
     filters.month, filters.week, filters.from].filter(Boolean).length,
    [filters]
  );

  const periodLabel = useMemo(() => {
    if (filters.month && filters.week)
      return weekOptions.find(w => w.value === filters.week)?.label ?? '';
    if (filters.month)
      return monthOptions.find(m => m.value === filters.month)?.label ?? '';
    if (filters.from && filters.to)
      return `${filters.from} → ${filters.to}`;
    return 'All time';
  }, [filters, monthOptions, weekOptions]);

  const toggleSort = (key: SortKey) =>
    setSort(s => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }));


  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Sidebar ── */}
      {/* SIDEBAR */}
      <aside className="w-[280px] shrink-0 border-r border-border bg-surface flex flex-col overflow-y-auto">

        {/* KPIs */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="mono-label truncate max-w-[160px]" title={periodLabel}>
              {periodLabel}
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 font-mono text-[9px] text-danger hover:opacity-75 transition-opacity shrink-0"
              >
                <X size={10} /> Clear ({activeFilterCount})
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Events',  value: summary?.totalEvents     ?? 0, red: false },
              { label: 'Minutes', value: summary?.totalMinutes    ?? 0, red: false },
              { label: 'Charged', value: summary?.chargeableCount ?? 0, red: true  },
            ].map(s => (
              <div key={s.label} className="bg-surface2 border border-border rounded p-2 text-center">
                <div className={clsx('font-mono text-[17px] font-semibold', s.red ? 'text-danger' : 'text-amber')}>
                  {s.value.toLocaleString()}
                </div>
                <div className="text-[9px] text-muted uppercase tracking-wide mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Date Filters */}
        <div className="p-4 border-b border-border">
          <div className="mono-label mb-3">Date Range</div>

          {/* Month */}
          <div className="mb-2">
            <div className="text-[10px] text-muted mb-1.5">Month</div>
            <select
              className="w-full bg-surface2 border border-border rounded px-2 py-1.5 text-[11px] font-mono outline-none focus:border-amber text-text cursor-pointer"
              value={filters.month}
              onChange={e => setMonthFilter(e.target.value)}
            >
              <option value="">All months</option>
              {monthOptions.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Week — only when month selected */}
          {filters.month && weekOptions.length > 0 && (
            <div className="mb-2">
              <div className="text-[10px] text-muted mb-1.5">Week</div>
              <select
                className="w-full bg-surface2 border border-border rounded px-2 py-1.5 text-[11px] font-mono outline-none focus:border-amber text-text cursor-pointer"
                value={filters.week}
                onChange={e => setWeekFilter(e.target.value)}
              >
                <option value="">All weeks</option>
                {weekOptions.map(w => (
                  <option key={w.value} value={w.value}>{w.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Custom range */}
          <div className="mt-3">
            <div className="text-[10px] text-muted mb-1.5">Custom range</div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="flex-1 bg-surface2 border border-border rounded px-2 py-1.5 text-[11px] font-mono outline-none focus:border-amber text-text"
                value={filters.from}
                onChange={e => setQuickRange(e.target.value, filters.to)}
              />
              <span className="text-[10px] text-muted shrink-0">to</span>
              <input
                type="date"
                className="flex-1 bg-surface2 border border-border rounded px-2 py-1.5 text-[11px] font-mono outline-none focus:border-amber text-text"
                value={filters.to}
                onChange={e => setQuickRange(filters.from, e.target.value)}
              />
            </div>
          </div>

          {/* Active range pill */}
          {(dateRange.from || dateRange.to) && (
            <div className="mt-2 flex items-center justify-between px-2 py-1.5 bg-amber/10 border border-amber/20 rounded">
              <span className="font-mono text-[10px] text-amber">
                {dateRange.from} → {dateRange.to}
              </span>
              <button
                onClick={() => { setMonthFilter(''); setQuickRange('', ''); }}
                className="text-amber hover:opacity-70"
              >
                <X size={10} />
              </button>
            </div>
          )}
        </div>

        {/* Other Filters */}
        <div className="p-4 border-b border-border space-y-2">
          <div className="mono-label mb-1">Other Filters</div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted2 w-16 shrink-0">Station</span>
            <select
              className="flex-1 bg-surface2 border border-border rounded px-2 py-1.5 text-[11px] font-mono outline-none focus:border-amber text-text"
              value={filters.origin}
              onChange={e => setFilter('origin', e.target.value)}
            >
              <option value="">All</option>
              {origins?.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted2 w-16 shrink-0">Category</span>
            <select
              className="flex-1 bg-surface2 border border-border rounded px-2 py-1.5 text-[11px] font-mono outline-none focus:border-amber text-text"
              value={filters.cat}
              onChange={e => setFilter('cat', e.target.value)}
            >
              <option value="">All</option>
              {['amazon','maintenance','weather','crew','atc','fueling','ground','other'].map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted2 w-16 shrink-0">Charge</span>
            <select
              className="flex-1 bg-surface2 border border-border rounded px-2 py-1.5 text-[11px] font-mono outline-none focus:border-amber text-text"
              value={filters.chargeable}
              onChange={e => setFilter('chargeable', e.target.value)}
            >
              <option value="">All</option>
              <option value="Yes">HA Chargeable</option>
              <option value="No">Not Chargeable</option>
            </select>
          </div>
          <input
            className="w-full bg-surface2 border border-border rounded px-3 py-1.5 text-[12px] outline-none focus:border-amber placeholder:text-muted text-text"
            placeholder="Search reason text…"
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
          />
        </div>

        {/* Hour Chart */}
        <div className="p-4 border-b border-border">
          <div className="mono-label mb-2">Delays by Hour</div>

          {/* Bar chart — hover any bar to see hour + count */}
          <div className="flex items-end gap-[2px]" style={{ height: '48px' }}>
            {Array.from({ length: 24 }, (_, h) => {
              const cnt  = byHour.find(x => Number(x.hour) === h)?.count ?? 0;
              const barH = Math.max(1, (cnt / maxHour) * 44);
              const peak = (h >= 14 && h <= 16) || h >= 22 || h === 0;
              return (
                <div
                  key={h}
                  title={`${String(h).padStart(2,'0')}:00 — ${cnt} delay${cnt !== 1 ? 's' : ''}`}
                  className="flex-1 rounded-[1px_1px_0_0] cursor-default transition-opacity hover:opacity-60 self-end"
                  style={{
                    height:     `${barH}px`,
                    background: cnt > 0 ? (peak ? '#c9924a' : '#2a2d38') : '#1e2029',
                  }}
                />
              );
            })}
          </div>

          {/* Axis labels — 00, 06, 12, 18, 23 only */}
          <div className="flex justify-between mt-1 px-0">
            {['00','06','12','18','23'].map(label => (
              <span key={label} className="font-mono text-muted" style={{ fontSize: '8px' }}>
                {label}
              </span>
            ))}
          </div>

          {/* Legend */}
          <div className="flex gap-3 mt-1.5">
            <span className="flex items-center gap-1 font-mono text-[9px] text-muted">
              <span className="inline-block w-2 h-2 rounded-[1px]" style={{ background: '#c9924a' }} />
              peak
            </span>
            <span className="flex items-center gap-1 font-mono text-[9px] text-muted">
              <span className="inline-block w-2 h-2 rounded-[1px]" style={{ background: '#2a2d38' }} />
              off-peak
            </span>
          </div>
        </div>
        {/* Top Codes */}
        <div className="p-4 border-b border-border">
          <div className="mono-label mb-3">Top Codes</div>
          {byCode.slice(0, 8).map(c => (
            <div key={c.code} className="flex items-center gap-2 mb-2 cursor-pointer group"
              >
              <span className="font-mono text-[10px] w-9 shrink-0 group-hover:underline"
                style={{ color: CAT_COLORS[c.cat] ?? '#7a8299' }}>
                {c.code}
              </span>
              <div className="flex-1 h-[5px] bg-surface3 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${(c.count / maxCount) * 100}%`, background: CAT_COLORS[c.cat] ?? '#7a8299' }} />
              </div>
              <span className="font-mono text-[10px] text-muted w-6 text-right">{c.count}</span>
            </div>
          ))}
        </div>

        {/* Quick Alert */}
        <div className="p-4">
          <div className="mono-label mb-3">Quick Alert</div>
          {CONTACT_TEAMS.map(t => (
            <button
              key={t.key}
              onClick={() => openAlert(t.name, t.context)}
              className="w-full flex items-center gap-3 px-3 py-2.5 mb-2 rounded border border-border bg-surface2 hover:border-amber hover:bg-amber/5 text-left transition-all group"
            >
              <span className="text-[14px]">{t.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium">{t.name}</div>
                <div className="text-[10px] text-muted truncate">
                  {t.context.split(',')[0]}
                </div>
              </div>
              <span className="font-mono text-[10px] text-muted group-hover:text-amber">
                →
              </span>
            </button>
          ))}
        </div>
      </aside>

        
      

      {/* MAIN FEED */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Feed header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0 gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display text-[13px] font-bold">Delay Events</span>
            {filters.month && (
              <span className="flex items-center gap-1 font-mono text-[9px] px-2 py-0.5 rounded-full bg-amber/10 border border-amber/30 text-amber">
                {monthOptions.find(m => m.value === filters.month)?.label}
                <button onClick={() => setMonthFilter('')} className="hover:opacity-70"><X size={9} /></button>
              </span>
            )}
            {filters.week && (
              <span className="flex items-center gap-1 font-mono text-[9px] px-2 py-0.5 rounded-full bg-amber/10 border border-amber/30 text-amber">
                {weekOptions.find(w => w.value === filters.week)?.label}
                <button onClick={() => setWeekFilter('')} className="hover:opacity-70"><X size={9} /></button>
              </span>
            )}
            {filters.from && !filters.month && (
              <span className="flex items-center gap-1 font-mono text-[9px] px-2 py-0.5 rounded-full bg-amber/10 border border-amber/30 text-amber">
                {filters.from} → {filters.to || '…'}
                <button onClick={() => setQuickRange('', '')} className="hover:opacity-70"><X size={9} /></button>
              </span>
            )}
            {isFetching && (
              <div className="w-3 h-3 border border-amber border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          <span className="font-mono text-[10px] text-muted shrink-0">
            {totalRows > 0
              ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, totalRows)} of ${totalRows.toLocaleString()}`
              : '0 records'
            }
          </span>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr>
                {([['date','Date'],['flight','Flight'],['origin','Station'],['code','Code']] as [SortKey, string][]).map(([k, label]) => (
                  <th key={k} onClick={() => toggleSort(k)}
                    className="text-left px-4 py-2.5 font-mono text-[9px] tracking-widest uppercase text-muted border-b border-border sticky top-0 bg-surface cursor-pointer hover:text-text whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      {label}
                      {sort.key === k && (sort.dir === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
                    </span>
                  </th>
                ))}
                <th className="text-left px-4 py-2.5 font-mono text-[9px] tracking-widest uppercase text-muted border-b border-border sticky top-0 bg-surface">
                  Description
                </th>
                <th onClick={() => toggleSort('minutes')}
                  className="text-left px-4 py-2.5 font-mono text-[9px] tracking-widest uppercase text-muted border-b border-border sticky top-0 bg-surface cursor-pointer hover:text-text">
                  <span className="inline-flex items-center gap-1">
                    Min
                    {sort.key === 'minutes' && (sort.dir === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
                  </span>
                </th>
                <th className="text-left px-4 py-2.5 font-mono text-[9px] tracking-widests uppercase text-muted border-b border-border sticky top-0 bg-surface">
                  Reason
                </th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r._id} onClick={() => (r.code)}
                  className="hover:bg-surface2 transition-colors cursor-pointer border-b border-border/40">
                  <td className="px-4 py-2.5 font-mono text-[10px] text-muted whitespace-nowrap">{r.date}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] whitespace-nowrap">{r.flight}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-muted2 whitespace-nowrap">{r.origin || '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border"
                      style={{ color: CAT_COLORS[r.cat] ?? '#7a8299', borderColor: `${CAT_COLORS[r.cat] ?? '#7a8299'}40` }}>
                      {r.code}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted2 max-w-[180px] truncate">{r.shortDesc}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className="font-mono text-[11px]" style={{ color: SEVERITY_COLOR(r.minutes) }}>
                      <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
                        style={{ background: SEVERITY_COLOR(r.minutes) }} />
                      {r.minutes}m
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted max-w-[220px] truncate text-[11px]">{r.reasonText || '—'}</td>
                </tr>
              ))}
              {records.length === 0 && isFetching && (
                <tr><td colSpan={7} className="px-4 py-12 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted text-sm">
                    <div className="w-4 h-4 border border-amber border-t-transparent rounded-full animate-spin" />
                    Loading…
                  </div>
                </td></tr>
              )}
              {records.length === 0 && !isFetching && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted text-sm">
                  No delay records match current filters
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border shrink-0 bg-surface">
            <span className="font-mono text-[10px] text-muted">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={page === 1}
                className="font-mono text-[10px] px-2 py-1 rounded border border-border text-muted2 hover:border-amber hover:text-amber disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                «
              </button>
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="font-mono text-[10px] px-3 py-1 rounded border border-border text-muted2 hover:border-amber hover:text-amber disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                ‹ Prev
              </button>
              {getPageNumbers(page, totalPages).map((p, i) =>
                p === '...' ? (
                  <span key={`e-${i}`} className="font-mono text-[10px] px-2 text-muted">…</span>
                ) : (
                  <button key={p} onClick={() => setPage(Number(p))}
                    className={clsx(
                      'font-mono text-[10px] px-2.5 py-1 rounded border transition-colors',
                      page === p
                        ? 'border-amber bg-amber/10 text-amber'
                        : 'border-border text-muted2 hover:border-amber hover:text-amber'
                    )}>
                    {p}
                  </button>
                )
              )}
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
                className="font-mono text-[10px] px-3 py-1 rounded border border-border text-muted2 hover:border-amber hover:text-amber disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                Next ›
              </button>
              <button onClick={() => setPage(totalPages)} disabled={page >= totalPages}
                className="font-mono text-[10px] px-2 py-1 rounded border border-border text-muted2 hover:border-amber hover:text-amber disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                »
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-muted">Go to</span>
              <input
                type="number" min={1} max={totalPages} defaultValue={page} key={page}
                className="w-12 bg-surface2 border border-border rounded px-2 py-1 text-[11px] font-mono outline-none focus:border-amber text-center text-text"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const val = parseInt((e.target as HTMLInputElement).value);
                    if (!isNaN(val) && val >= 1 && val <= totalPages) setPage(val);
                  }
                }}
              />
            </div>
          </div>
        )}

      </main>
    </div>
  );
}