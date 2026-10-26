const pad = (n: number) => String(n).padStart(2, '0');

// Date locali come "YYYY-MM-DD" (niente toISOString: sfaserebbe per il fuso orario)
export const toDateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const monthRange = (year: number, month: number) => ({
  from: toDateKey(new Date(year, month, 1)),
  to: toDateKey(new Date(year, month + 1, 0)),
});

export const MONTH_NAMES = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

export const WEEKDAYS = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];

// Griglia del mese con settimana che parte da lunedì; null = cella vuota
export function monthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export const isValidTime = (t: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);

// "YYYY-MM-DD" + "HH:MM" locali -> Date
export function combine(dateKey: string, time: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm);
}
