import React, { useState } from 'react';

// Calendar ported from the Dubai Trade modules (dubai-trade/src/components/DatePicker.tsx)
// so date fields here open the same picker: day grid, month and year pickers.

const MS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const p2 = (n: number) => String(n).padStart(2, '0');

/** Format YYYY-MM-DD → "05-06-2026" */
export function fmtDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return `${p2(d)}-${p2(m)}-${y}`;
}

/** Parse "05-06-2026", "05/06/2026" or "5-6-26" back to YYYY-MM-DD; '' when not a date yet. */
export function parseTypedDate(text: string): string {
  const m = text.trim().match(/^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{2}|\d{4})$/);
  if (!m) return '';
  const day = +m[1], month = +m[2];
  const year = m[3].length === 2 ? 2000 + +m[3] : +m[3];
  if (month < 1 || month > 12 || day < 1) return '';
  if (day > new Date(year, month, 0).getDate()) return '';
  return `${year}-${p2(month)}-${p2(day)}`;
}

export function CalendarPicker({ value, onPick }: { value: string; onPick: (iso: string) => void }) {
  const today = new Date();
  const init = value ? new Date(value + 'T00:00') : today;
  const safe = isNaN(init.getTime()) ? today : init;

  const [viewYear,  setViewYear]  = useState(safe.getFullYear());
  const [viewMonth, setViewMonth] = useState(safe.getMonth());
  const [selDay,    setSelDay]    = useState<number | null>(value ? safe.getDate() : null);
  const [mode,      setMode]      = useState<'day' | 'month' | 'year'>('day');
  const [yrStart,   setYrStart]   = useState(safe.getFullYear() - 10);

  const daysInMo   = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDow   = new Date(viewYear, viewMonth, 1).getDay();
  const prevMoDays = new Date(viewYear, viewMonth, 0).getDate();
  const cells: { day: number; t: 'p' | 'c' | 'n' }[] = [];
  for (let i = firstDow - 1; i >= 0; i--) cells.push({ day: prevMoDays - i, t: 'p' });
  for (let d = 1; d <= daysInMo; d++)     cells.push({ day: d, t: 'c' });
  for (let nd = 1; cells.length < 42; nd++) cells.push({ day: nd, t: 'n' });

  const navMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewMonth(d.getMonth());
    setViewYear(d.getFullYear());
  };
  const isSelMonth = !!value && safe.getFullYear() === viewYear && safe.getMonth() === viewMonth;

  const ChevSvg = ({ dir }: { dir: 'l' | 'r' }) => (
    <svg viewBox="0 0 20 20" width="12" height="12" fill="none">
      <path d={dir === 'l' ? 'M13 4l-6 6 6 6' : 'M7 4l6 6-6 6'} stroke="#0e1b3d" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
  const Tri = ({ up }: { up: boolean }) => (
    <svg viewBox="0 0 10 10" width="9" height="9" fill="#697498"><polygon points={up ? '5,2 9,8 1,8' : '1,2 9,2 5,8'} /></svg>
  );
  const NavBtn = ({ onClick, ch, label }: { onClick: () => void; ch: React.ReactNode; label: string }) => (
    <button type="button" aria-label={label} onClick={onClick}
      style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
               border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 4, flexShrink: 0 }}
      onMouseEnter={e => { e.currentTarget.style.background = '#f0f4ff'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
      {ch}
    </button>
  );
  const toggleBtn = (label: React.ReactNode, active: boolean, onClick: () => void) => (
    <button type="button" onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', border: 'none', cursor: 'pointer',
               borderRadius: 16, fontSize: 14, fontWeight: 700, color: '#0e1b3d',
               background: active ? '#e8ecf4' : 'transparent' }}>
      {label}<Tri up={active} />
    </button>
  );
  const pillBtn = (label: string | number, isActive: boolean, activeBg: string, onClick: () => void) => (
    <button key={label} type="button" onClick={onClick}
      style={{
        padding: '10px 0', borderRadius: 20, border: 'none', width: '100%',
        background: isActive ? activeBg : 'transparent',
        color: isActive ? '#fff' : '#0e1b3d', fontWeight: isActive ? 700 : 400,
        fontSize: 14, cursor: 'pointer', transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#e8f0ff'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
      {label}
    </button>
  );

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <NavBtn label="Previous month" onClick={() => mode === 'year' ? setYrStart(y => y - 21) : navMonth(-1)} ch={<ChevSvg dir="l" />} />
        {toggleBtn(MS[viewMonth], mode === 'month', () => setMode(m => m === 'month' ? 'day' : 'month'))}
        <NavBtn label="Next month" onClick={() => mode === 'year' ? setYrStart(y => y + 21) : navMonth(1)} ch={<ChevSvg dir="r" />} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <NavBtn label="Previous year" onClick={() => mode === 'year' ? setYrStart(y => y - 21) : setViewYear(y => y - 1)} ch={<ChevSvg dir="l" />} />
        {toggleBtn(viewYear, mode === 'year', () => setMode(m => m === 'year' ? 'day' : 'year'))}
        <NavBtn label="Next year" onClick={() => mode === 'year' ? setYrStart(y => y + 21) : setViewYear(y => y + 1)} ch={<ChevSvg dir="r" />} />
      </div>
    </div>
  );

  const monthGrid = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '4px 12px' }}>
      {MS.map((m, i) => pillBtn(m, i === viewMonth, '#3a4a6b', () => { setViewMonth(i); setMode('day'); }))}
    </div>
  );

  const years = Array.from({ length: 21 }, (_, i) => yrStart + i);
  const yearGrid = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '4px 8px' }}>
      {years.map(y => pillBtn(y, y === viewYear, '#5b7de8', () => { setViewYear(y); setMode('day'); }))}
    </div>
  );

  const dayGrid = (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 6 }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#697498', paddingBottom: 6 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
        {cells.map((cell, i) => {
          const isCur = cell.t === 'c';
          const isSel = isCur && isSelMonth && selDay === cell.day;
          return (
            <button key={i} type="button"
              onClick={() => {
                if (!isCur) return;
                setSelDay(cell.day);
                // The pick itself is the answer — no Confirm.
                onPick(`${viewYear}-${p2(viewMonth + 1)}-${p2(cell.day)}`);
              }}
              style={{
                height: 36, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, borderRadius: '50%', border: 'none',
                background: isSel ? '#1360d2' : 'transparent',
                color: isSel ? '#fff' : isCur ? '#0e1b3d' : '#c8d0e0',
                fontWeight: isSel ? 700 : 400,
                cursor: isCur ? 'pointer' : 'default',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (isCur && !isSel) e.currentTarget.style.background = '#e8f0ff'; }}
              onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}>
              {cell.day}
            </button>
          );
        })}
      </div>
    </>
  );

  return (
    <div style={{ width: 300 }}>
      {header}
      {mode === 'month' ? monthGrid : mode === 'year' ? yearGrid : dayGrid}
    </div>
  );
}
