import { useQuery } from "@tanstack/react-query";
import { getStats } from "../api/client";
import { useStore } from "../store/useStore";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Bar, CartesianGrid, LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart } from "recharts";
import { CAT_COLORS } from "../utils/constants";
import clsx from "clsx";

const TOOLTIP_STYLE = {
      contentStyle: { background: '#141820', border: '1px solid #1f2535', borderRadius: 6, fontSize: 11, fontFamily: 'IBM Plex Mono' },
      labelStyle:   { color: '#8892aa' },
      itemStyle:    { color: '#f5a623' },
  };

export default function LeadershipView() {
  
  const { activeUploadId } = useStore();

 const { data: stats } = useQuery({
    queryKey: ['stats', activeUploadId],
    queryFn:  () => getStats(activeUploadId ? { uploadId: activeUploadId } : {}),
  });
  
  const months = stats?.byMonth ?? [];
  const summary = stats?.summary;
  const byCat = stats?.byCat ?? [];
  const maxCat = byCat[0]?.count ?? 1;
  const totalCat = byCat.reduce((s,c) => s + c.count, 0);

  // Month-over-month deltas
  const prev = months[months.length - 2];
  const curr = months[months.length - 1];
  const evDelta  = prev && curr ? Math.round(((curr.events - prev.events) / prev.events) * 100) : 0;
  const minDelta = prev && curr ? Math.round(((curr.totalMinutes - prev.totalMinutes) / prev.totalMinutes) * 100) : 0;

  const chargeRate  = summary ? Math.round((summary.chargeableCount / summary.totalEvents) * 100) : 0;
  const amazonCount = byCat.find(c => c.cat === 'amazon')?.count ?? 0;
  const amazonPct   = summary ? Math.round((amazonCount / summary.totalEvents) * 100) : 0;


  const Delta = ({ pct }: { pct: number }) =>
    Math.abs(pct) < 5
      ? <span className="font-mono text-[11px] text-muted">flat</span>
      : pct > 0
        ? <span className="flex items-center gap-0.5 font-mono text-[11px] text-danger"><TrendingUp size={10}/> +{pct}%</span>
        : <span className="flex items-center gap-0.5 font-mono text-[11px] text-success"><TrendingDown size={10}/> {pct}%</span>;
  if (!activeUploadId) {
    return (
      <div className="flex items-center justify-center h-full gap-3 text-muted">
        <div className="w-4 h-4 border border-amber border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-[11px] tracking-widest uppercase">
          Loading…
        </span>
      </div>
    );
  }
  return (
      <div className="h-full overflow-y-auto p-6 space-y-5">
        {/* ── Scorecards ── */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Delay Events', value: summary?.totalEvents.toLocaleString() ?? '—', accent: '#f5a623', delta: evDelta,  sub: `avg ${summary?.avgMinutes ?? 0}min/event` },
              { label: 'Hours Lost',         value: summary ? `${(summary.totalMinutes/60).toFixed(0)}h` : '—', accent: '#4fa3e0', delta: minDelta, sub: `${summary?.totalMinutes.toLocaleString() ?? 0} total minutes` },
              { label: 'HA Chargeable Rate', value: `${chargeRate}%`, accent: '#3ddc84', delta: 0, sub: `Amazon-caused: ${amazonPct}%` },
            ].map(s => (
              <div key={s.label} className="card p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: s.accent }} />
                <div className="mono-label mb-3">{s.label}</div>
                <div className="font-display text-[44px] font-extrabold leading-none mb-2" style={{ color: s.accent }}>
                  {s.value}
                </div>
                <div className="flex items-center gap-3">
                  {s.delta !== 0 && <Delta pct={s.delta} />}
                  <span className="text-[11px] text-muted">{s.sub}</span>
                </div>
              </div>
            ))}
          </div>
          
          {/* ── Charts ── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-5">
              <div className="mono-label mb-4">Monthly Delay Events</div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={months} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2535" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono', fill: '#5a6480' }} tickFormatter={v => v.slice(2)} />
                  <YAxis tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono', fill: '#5a6480' }} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Bar dataKey="events" fill="#f5a623" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-5">
              <div className="mono-label mb-4">Monthly Minutes Lost</div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={months} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2535" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono', fill: '#5a6480' }} tickFormatter={v => v.slice(2)} />
                  <YAxis tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono', fill: '#5a6480' }} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="totalMinutes" stroke="#4fa3e0" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Category split ── */}
          <div className="card p-5">
            <div className="mono-label mb-4">Delay Category Split</div>
            <div className="flex h-3 rounded-full overflow-hidden gap-[1px] mb-4">
              {byCat.map(c => (
                <div key={c.cat} title={`${c.cat}: ${Math.round((c.count/totalCat)*100)}%`}
                  style={{ flex: c.count, background: CAT_COLORS[c.cat] ?? '#8892aa' }} />
              ))}
            </div>
            <div className="space-y-2">
              {byCat.map(c => {
                const color = CAT_COLORS[c.cat] ?? '#8892aa';
                const pct = Math.round((c.count / totalCat) * 100);
                return (
                  <div key={c.cat} className="flex items-center gap-3">
                    <div className="w-[130px] text-[11px] text-muted2 shrink-0">
                      {c.cat.charAt(0).toUpperCase() + c.cat.slice(1)}
                    </div>
                    <div className="flex-1 h-2 bg-surface3 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(c.count/maxCat)*100}%`, background: color }} />
                    </div>
                    <div className="font-mono text-[10px] w-8 text-right" style={{ color }}>{pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>


          {/* ── Top codes table ── */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-border mono-label">Top Delay Codes</div>
            <table className="w-full text-[12px]">
              <thead>
                <tr>
                  {['Code','Description','Events','% Total','Avg Min','Total Min','Chargeable'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 font-mono text-[9px] tracking-widest uppercase text-muted border-b border-border">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(stats?.byCode ?? []).slice(0,20).map(c => (
                  <tr key={c.code} className="hover:bg-surface2 transition-colors border-b border-border/40">
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border"
                        style={{ color: CAT_COLORS[c.cat] ?? '#8892aa', borderColor: `${CAT_COLORS[c.cat] ?? '#8892aa'}40` }}>
                        {c.code}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted2 max-w-[200px] truncate">{c.shortDesc}</td>
                    <td className="px-4 py-2.5 font-mono text-[11px]">{c.count}</td>
                    <td className="px-4 py-2.5 font-mono text-[11px]">{c.pct}%</td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-muted">{c.avgMinutes}m</td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-info">{c.totalMinutes.toLocaleString()}</td>
                    <td className="px-4 py-2.5">
                      <span className={clsx('font-mono text-[10px]', c.chargeable === 'Yes' ? 'text-danger' : 'text-success')}>
                        {c.chargeable}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

      </div>  
  );
}
