import { useState }   from 'react';
import { useQuery }   from '@tanstack/react-query';
import { getAlerts }  from '../api/client';
import { Bell, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { AlertRecord } from '../types';

// Format date nicely
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  }) + ' at ' + date.toLocaleTimeString('en-US', {
    hour:   '2-digit',
    minute: '2-digit',
  });
}

// Color per team
function getTeamColor(team: string): string {
  if (team.toLowerCase().includes('amazon'))     return '#f5a623';
  if (team.toLowerCase().includes('fuel'))       return '#ff9f7e';
  if (team.toLowerCase().includes('maintenance')) return '#f25c5c';
  if (team.toLowerCase().includes('ops'))        return '#c97bff';
  return '#8892aa';
}

// Single alert card
function AlertCard({ alert }: { alert: AlertRecord }) {
  const [expanded, setExpanded] = useState(false);
  const color = getTeamColor(alert.team);

  return (
    <div className="border border-border rounded-lg overflow-hidden mb-2">

      {/* Header row — always visible */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface2 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Team color dot */}
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: color }}
        />

        {/* Team name */}
        <span
          className="font-mono text-[11px] font-semibold w-[140px] shrink-0 truncate"
          style={{ color }}
        >
          {alert.team}
        </span>

        {/* Message preview */}
        <span className="flex-1 text-[12px] text-muted2 truncate">
          {alert.message}
        </span>

        {/* Date */}
        <span className="font-mono text-[10px] text-muted shrink-0 ml-2">
          {formatDate(alert.sentAt)}
        </span>

        {/* Expand icon */}
        <span className="text-muted shrink-0 ml-1">
          {expanded
            ? <ChevronUp   size={13} />
            : <ChevronDown size={13} />
          }
        </span>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-border bg-surface2">

          {/* Full message */}
          <div className="mono-label mb-1 mt-3">Message</div>
          <p className="text-[13px] text-text leading-relaxed">
            {alert.message}
          </p>

          {/* Delay codes */}
          {alert.codes.length > 0 && (
            <div className="mt-3">
              <div className="mono-label mb-2">Delay Codes</div>
              <div className="flex flex-wrap gap-2">
                {alert.codes.map(code => (
                  <span
                    key={code}
                    className="font-mono text-[11px] px-2 py-1 rounded border border-border bg-surface text-amber"
                  >
                    {code}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sent at */}
          <div className="mt-3">
            <div className="mono-label mb-1">Sent</div>
            <span className="font-mono text-[11px] text-muted">
              {formatDate(alert.sentAt)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Main AlertHistory panel
export default function AlertHistory() {
  const [open, setOpen] = useState(false);

  const { data: alerts = [], isLoading } = useQuery({
    queryKey:        ['alerts'],
    queryFn:         getAlerts,
    refetchInterval: 30_000,   // refresh every 30 seconds
  });

  return (
    <>
      {/* Bell button — fixed bottom right */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-surface border border-border hover:border-amber transition-all group"
      >
        <Bell size={14} className="text-muted group-hover:text-amber transition-colors" />
        <span className="font-mono text-[10px] tracking-widest uppercase text-muted group-hover:text-amber transition-colors">
          Alerts
        </span>
        {/* Unread badge */}
        {alerts.length > 0 && (
          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-amber text-black font-mono text-[9px] font-bold">
            {alerts.length > 9 ? '9+' : alerts.length}
          </span>
        )}
      </button>

      {/* Slide-in panel */}
      {open && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="fixed right-0 top-0 bottom-0 w-[520px] bg-surface border-l border-border z-50 flex flex-col">

            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div>
                <div className="font-display text-[15px] font-bold">
                  Alert History
                </div>
                <div className="font-mono text-[10px] text-muted mt-0.5">
                  {alerts.length} alert{alerts.length !== 1 ? 's' : ''} logged
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded border border-border text-muted hover:border-danger hover:text-danger transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Alert list */}
            <div className="flex-1 overflow-y-auto px-4 py-4">

              {isLoading && (
                <div className="flex items-center justify-center gap-2 py-12 text-muted text-sm">
                  <div className="w-4 h-4 border border-amber border-t-transparent rounded-full animate-spin" />
                  Loading alerts…
                </div>
              )}

              {!isLoading && alerts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Bell size={32} className="text-muted opacity-30" />
                  <div className="font-display text-[14px] text-muted2">
                    No alerts yet
                  </div>
                  <p className="text-[12px] text-muted text-center max-w-[240px]">
                    Use the Quick Alert buttons in the sidebar to notify your team about delay patterns
                  </p>
                </div>
              )}

              {!isLoading && alerts.length > 0 && (
                <div>
                  {/* Group alerts by date */}
                  {groupAlertsByDate(alerts).map(group => (
                    <div key={group.date} className="mb-5">
                      {/* Date group header */}
                      <div className="mono-label mb-3 sticky top-0 bg-surface py-1">
                        {group.date}
                      </div>
                      {/* Alerts in this group */}
                      {group.alerts.map(alert => (
                        <AlertCard key={alert._id} alert={alert} />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

// Group alerts by date for display
function groupAlertsByDate(
  alerts: AlertRecord[]
): { date: string; alerts: AlertRecord[] }[] {
  const groups: Record<string, AlertRecord[]> = {};

  alerts.forEach(alert => {
    const date    = new Date(alert.sentAt);
    const today   = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let label: string;

    if (date.toDateString() === today.toDateString()) {
      label = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = 'Yesterday';
    } else {
      label = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month:   'long',
        day:     'numeric',
      });
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(alert);
  });

  return Object.entries(groups).map(([date, alerts]) => ({ date, alerts }));
}