export interface CodeMeta {
  short: string;
  long: string;
  cat: string;
  chargeable: string;
}

// Delay code lookup table
export const CODE_META: Record<string, CodeMeta> = {
  A06:  { short: 'Amazon Late Inbound Linehaul',    long: 'Late Amazon ground delivery of payload.',        cat: 'amazon',      chargeable: 'No'  },
  A20A: { short: 'Amazon Ramp Delay',               long: '*Amazon caused* delay due to ground loading.',   cat: 'amazon',      chargeable: 'No'  },
  A21A: { short: 'Amazon Ground Documentation',     long: '*Amazon caused* documentation errors.',          cat: 'amazon',      chargeable: 'No'  },
  A22:  { short: 'Weight and Balance Error',        long: 'Weight & balance process error.',                cat: 'other',       chargeable: 'No'  },
  A32A: { short: 'Amazon Loading/Unloading',        long: '*Amazon caused* loading/unloading delay.',       cat: 'amazon',      chargeable: 'No'  },
  A32H: { short: 'HA Loading/Unloading',            long: '*Hawaiian caused* loading/unloading delay.',     cat: 'ground',      chargeable: 'Yes' },
  A33A: { short: 'Amazon Ground Service Equipment', long: '*Amazon caused* GSE issue.',                     cat: 'amazon',      chargeable: 'No'  },
  A33H: { short: 'HA Ground Service Equipment',     long: '*Hawaiian caused* GSE issue.',                   cat: 'ground',      chargeable: 'Yes' },
  A36A: { short: 'Amazon Fueling/Defueling',        long: '*Amazon caused* fueling delay.',                 cat: 'amazon',      chargeable: 'No'  },
  A36H: { short: 'HA Fueling/Defueling',            long: '*Hawaiian caused* fueling delay.',               cat: 'fueling',     chargeable: 'Yes' },
  A41:  { short: 'Aircraft Defects',                long: 'Delay due to aircraft defect.',                  cat: 'maintenance', chargeable: 'Yes' },
  A47:  { short: 'Maintenance Block Turn Back',     long: 'Ground turnback due to maintenance issue.',      cat: 'maintenance', chargeable: 'Yes' },
  A57:  { short: 'Paperwork Failure',               long: 'Flight paperwork transmission failure.',         cat: 'other',       chargeable: 'Yes' },
  A60:  { short: 'Flight Ops Delay',                long: 'Delay due to flight crew or HA reason.',         cat: 'crew',        chargeable: 'Yes' },
  A63:  { short: 'Late Crew Boarding',              long: 'Crew arrived late to aircraft.',                 cat: 'crew',        chargeable: 'Yes' },
  A71:  { short: 'Departure Station Weather',       long: 'Weather at departure station.',                  cat: 'weather',     chargeable: 'No'  },
  A72:  { short: 'Destination Station Weather',     long: 'Weather at arrival station.',                    cat: 'weather',     chargeable: 'No'  },
  A73:  { short: 'Enroute Weather',                 long: 'Enroute or alternate airport weather.',          cat: 'weather',     chargeable: 'No'  },
  A75A: { short: 'Amazon De-Icing',                 long: '*Amazon caused* de-icing delay.',                cat: 'amazon',      chargeable: 'No'  },
  A75H: { short: 'HA De-Icing',                     long: '*Hawaiian caused* de-icing delay.',              cat: 'ground',      chargeable: 'Yes' },
  A77:  { short: 'Weather Ground Impairment',       long: 'Weather affecting airport operations.',          cat: 'weather',     chargeable: 'No'  },
  A80:  { short: 'ATC/Government Delay',            long: 'ATC or government requirements.',                cat: 'atc',         chargeable: 'No'  },
  A81:  { short: 'ATC Enroute Demand/Capacity',     long: 'ATC capacity limitations.',                      cat: 'atc',         chargeable: 'No'  },
  A88:  { short: 'Airport Congestion',              long: 'Congestion at departure airport.',               cat: 'atc',         chargeable: 'No'  },
  A93:  { short: 'Late Arrival From Prior Delays',  long: 'Delay caused by upline delays.',                 cat: 'other',       chargeable: 'No'  },
  A95:  { short: 'Other (see remarks)',             long: 'Reason not in standard list.',                   cat: 'other',       chargeable: 'No'  },
};

// Function to catch some typo error such as 32, A32, OT( On time)
//  Return null if ontime or null
//  Return code same as code lookup table      
export function normalizeCode(raw: unknown): string | null {
  if (!raw || raw === 'NULL' || raw === 'OT' || raw === 'ONTIME') return null;
  let c = String(raw).trim();
  if (!c || c === 'null' || c === 'undefined') return null;
  if (/^\d+$/.test(c)) return `A${c.padStart(2, '0')}`;
  if (!c.startsWith('A') && /^\d/.test(c)) return `A${c}`;
  return c;
}