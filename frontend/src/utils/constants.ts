export const CAT_COLORS: Record<string, string> = {
  amazon:      '#f5a623',
  maintenance: '#f25c5c',
  weather:     '#4fa3e0',
  crew:        '#c97bff',
  atc:         '#3ddc84',
  fueling:     '#ff9f7e',
  ground:      '#5bc4c4',
  other:       '#8892aa',
};

export const SEVERITY_COLOR = (minutes: number) =>
  minutes >= 120 ? '#f25c5c' : minutes >= 30 ? '#f5a623' : '#3ddc84';

export const CONTACT_TEAMS = [
  { key: 'amazon',      name: 'Amazon Ground Ops', icon: '📦', context: 'Loading, ramp, GSE, documentation issues' },
  { key: 'fueling',     name: 'Fueling Team',      icon: '⛽', context: 'Fuel delays, under/over-fueling, late truck' },
  { key: 'maintenance', name: 'Maintenance (MX)',   icon: '🔧', context: 'Aircraft defects, deferrals, block turn backs' },
  { key: 'crew',        name: 'Flight Ops',         icon: '✈',  context: 'Crew issues, IOE, flight ops delays' },
];