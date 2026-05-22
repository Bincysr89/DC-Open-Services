import { useMemo, useState } from 'react';
import { Button } from './Button';
import { Dropdown } from './Dropdown';

export interface DateTimePickerProps {
  value?: Date;
  onChange?: (date: Date) => void;
  onConfirm?: (date: Date) => void;
  minYear?: number;
  maxYear?: number;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEKDAYS = ['S','M','T','W','T','F','S'];
const pad = (n: number) => String(n).padStart(2, '0');

export function DateTimePicker({
  value, onChange, onConfirm, minYear = 2020, maxYear = 2035,
}: DateTimePickerProps) {
  const initial = value ?? new Date();
  const [view, setView] = useState({ year: initial.getFullYear(), month: initial.getMonth() });
  const [selected, setSelected] = useState(initial);
  const today = new Date();
  const [hours, setHours] = useState(initial.getHours());
  const [minutes, setMinutes] = useState(initial.getMinutes());

  const cells = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [view]);

  const setMonth = (m: number) => setView((v) => ({ ...v, month: m }));
  const setYear = (y: number) => setView((v) => ({ ...v, year: y }));
  const stepMonth = (delta: number) => setView((v) => {
    const m = v.month + delta;
    if (m < 0) return { year: v.year - 1, month: 11 };
    if (m > 11) return { year: v.year + 1, month: 0 };
    return { year: v.year, month: m };
  });

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const pickDay = (d: Date) => {
    setSelected(d);
    const next = new Date(d);
    next.setHours(hours);
    next.setMinutes(minutes);
    onChange?.(next);
  };

  const confirm = () => {
    const final = new Date(selected);
    final.setHours(hours);
    final.setMinutes(minutes);
    onConfirm?.(final);
  };

  const yearOptions = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

  return (
    <div className="dt-dtp">
      <div className="dt-dtp__calendar">
        <div className="dt-dtp__head">
          <button type="button" className="dt-dtp__nav" aria-label="Previous month" onClick={() => stepMonth(-1)}>‹</button>
          <select className="dt-dtp__select" value={view.month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <button type="button" className="dt-dtp__nav" aria-label="Next month" onClick={() => stepMonth(1)}>›</button>
          <button type="button" className="dt-dtp__nav" aria-label="Previous year" onClick={() => setYear(view.year - 1)}>‹</button>
          <select className="dt-dtp__select" value={view.year} onChange={(e) => setYear(Number(e.target.value))}>
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button type="button" className="dt-dtp__nav" aria-label="Next year" onClick={() => setYear(view.year + 1)}>›</button>
        </div>
        <div className="dt-dtp__weekdays">
          {WEEKDAYS.map((d, i) => <span key={i}>{d}</span>)}
        </div>
        <div className="dt-dtp__grid">
          {cells.map((d, i) => {
            const inMonth = d.getMonth() === view.month;
            const isToday = sameDay(d, today);
            const isSelected = sameDay(d, selected);
            return (
              <button
                key={i}
                type="button"
                className={[
                  'dt-dtp__day',
                  inMonth ? '' : 'dt-dtp__day--out',
                  isToday ? 'dt-dtp__day--today' : '',
                  isSelected ? 'dt-dtp__day--selected' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => pickDay(d)}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>
      </div>
      <div className="dt-dtp__time">
        <div className="dt-dtp__time-row">
          <Dropdown
            label="Hours"
            labelStyle="block"
            compact
            value={hours}
            onChange={(v) => setHours(Number(v))}
            options={Array.from({ length: 24 }, (_, i) => ({ label: pad(i), value: i }))}
          />
          <span className="dt-dtp__colon">:</span>
          <Dropdown
            label="Minutes"
            labelStyle="block"
            compact
            value={minutes}
            onChange={(v) => setMinutes(Number(v))}
            options={Array.from({ length: 60 }, (_, i) => ({ label: pad(i), value: i }))}
          />
        </div>
        <Button variant="primary" size="lg" onClick={confirm}>Confirm</Button>
      </div>
    </div>
  );
}
