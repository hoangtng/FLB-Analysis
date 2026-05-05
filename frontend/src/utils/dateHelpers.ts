// Return formatted month option from raw month strings
export function getMonthOptions(months: string[]) : {
    value: string; label: string }[] {
        return [...months].sort().map(m => {
            const [year, month] = m.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1, 1);
            const label = date.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',

            });
            return {value: m, label};
        });
}

// Convert month string to date dateRange
export function monthToDateRange(month: string) : { from: string; to: string} {
    const [year, mon] = month.split('-').map(Number);

    const from = new Date(year, mon-1, 1);

    const to = new Date(year, mon, 0);
    return {
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
    };
}

// Get weeks for given month string
// Exp: 2024-11 so we get weeks of month 11

export function getWeekOptions( month: string
) : { value: string; label: string; from: string, to: string}[] {
    if (!month) return [];

    const [year, mon] = month.split('-').map(Number);
    const lastDay = new Date(year, mon, 0).getDate();
    const weeks: {value: string; label: string; from: string; to: string} [] = [];

    let weekNum = 1;
    let dayStart = 1;

    while (dayStart <= lastDay) {
        // Each week has 7 days, but capped at end of month
        const dayEnd = Math.min(dayStart + 6, lastDay);

        const fromDate = new Date(year, mon -1, dayStart);
        const toDate = new Date(year, mon - 1, dayEnd);

        const fromStr = fromDate.toISOString().slice(0, 10);
        const toStr = fromDate.toISOString().slice(0, 10);

        const fromLabel = fromDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
        const toLabel = toDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});

        weeks.push({
            value: `week${weekNum}`,
            label: `Week ${weekNum} (${fromLabel} - ${toLabel})`,
            from: fromStr,
            to: toStr,
        });
        weekNum++;
        dayStart = dayEnd + 1;
    }
    return weeks;
}


