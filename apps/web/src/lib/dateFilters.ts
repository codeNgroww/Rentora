export type TimeframeMode = 'monthly' | 'quarterly' | 'yearly' | 'custom';

export interface TimeframeFilter {
  mode: TimeframeMode;
  year: number;
  month: number; // 1-12
  quarter: number; // 1-4
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  label: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function getMonthlyRange(year: number, month: number): TimeframeFilter {
  const m = Math.max(1, Math.min(12, month));
  const padM = String(m).padStart(2, '0');
  const lastDay = new Date(year, m, 0).getDate();
  const padD = String(lastDay).padStart(2, '0');
  const quarter = Math.ceil(m / 3);

  return {
    mode: 'monthly',
    year,
    month: m,
    quarter,
    startDate: `${year}-${padM}-01`,
    endDate: `${year}-${padM}-${padD}`,
    label: `${MONTH_NAMES[m - 1]} ${year}`,
  };
}

export function getQuarterlyRange(year: number, quarter: number): TimeframeFilter {
  const q = Math.max(1, Math.min(4, quarter));
  const startMonth = (q - 1) * 3 + 1;
  const endMonth = q * 3;
  const padStartM = String(startMonth).padStart(2, '0');
  const padEndM = String(endMonth).padStart(2, '0');
  const lastDay = new Date(year, endMonth, 0).getDate();

  const quarterLabels: Record<number, string> = {
    1: 'Q1 (Jan - Mar)',
    2: 'Q2 (Apr - Jun)',
    3: 'Q3 (Jul - Sep)',
    4: 'Q4 (Oct - Dec)',
  };

  return {
    mode: 'quarterly',
    year,
    month: startMonth,
    quarter: q,
    startDate: `${year}-${padStartM}-01`,
    endDate: `${year}-${padEndM}-${String(lastDay).padStart(2, '0')}`,
    label: `${quarterLabels[q]} ${year}`,
  };
}

export function getYearlyRange(year: number): TimeframeFilter {
  return {
    mode: 'yearly',
    year,
    month: 1,
    quarter: 1,
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
    label: `Full Year ${year}`,
  };
}

export function getCustomRange(startDate: string, endDate: string): TimeframeFilter {
  const now = new Date();
  const s = startDate || `${now.getFullYear()}-01-01`;
  const e = endDate || `${now.getFullYear()}-12-31`;

  return {
    mode: 'custom',
    year: parseInt(s.slice(0, 4), 10) || now.getFullYear(),
    month: parseInt(s.slice(5, 7), 10) || 1,
    quarter: 1,
    startDate: s,
    endDate: e,
    label: `${s} to ${e}`,
  };
}

export function isDateInRange(dateStr?: string | null, start?: string, end?: string): boolean {
  if (!dateStr) return false;
  const d = dateStr.slice(0, 10);
  if (start && d < start) return false;
  if (end && d > end) return false;
  return true;
}
