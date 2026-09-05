export function formatDate(date: Date): string { const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); const d = String(date.getDate()).padStart(2, '0'); return `${y}-${m}-${d}`; }
export function todayStr(): string { return formatDate(new Date()); }
export function isToday(dateStr: string): boolean { return dateStr === todayStr(); }
export function daysBetween(date1: string, date2: string): number { const d1 = new Date(date1); const d2 = new Date(date2); const diffMs = Math.abs(d2.getTime() - d1.getTime()); return Math.round(diffMs / (1000 * 60 * 60 * 24)); }
export function getMonthDays(year: number, month: number): string[] { const days: string[] = []; const date = new Date(year, month - 1, 1); while (date.getMonth() === month - 1) { days.push(formatDate(date)); date.setDate(date.getDate() + 1); } return days; }
