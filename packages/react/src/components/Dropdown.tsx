import { useEffect, useId, useRef, useState } from 'react';

export interface DropdownOption { label: string; value: string | number; disabled?: boolean; }

export interface DropdownProps {
  label?: string;
  required?: boolean;
  options: DropdownOption[];
  value?: string | number;
  onChange?: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  hint?: string;
  labelStyle?: 'floating' | 'block';
  compact?: boolean;
}

export function Dropdown({
  label, required, options, value, onChange, placeholder = 'Select an option', disabled, error, hint,
  labelStyle = 'floating', compact = false,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const select = (opt: DropdownOption) => {
    if (opt.disabled) return;
    onChange?.(opt.value);
    setOpen(false);
  };

  return (
    <div className={`dt-field ${error ? 'dt-field--error' : ''}`.trim()} ref={wrapRef}>
      {labelStyle === 'block' && label && (
        <label className="dt-field__label dt-field__label--block" htmlFor={id}>
          {required && <span className="dt-field__required" aria-hidden>*</span>}
          {label}
        </label>
      )}
      <div className="dt-field__control">
        {labelStyle === 'floating' && label && (
          <label className="dt-field__label" htmlFor={id}>
            {required && <span className="dt-field__required" aria-hidden>*</span>}
            {label}
          </label>
        )}
        <button
          type="button"
          id={id}
          className={`dt-dropdown ${error ? 'dt-input--error' : ''} ${open ? 'dt-dropdown--open' : ''}`.trim()}
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="listbox"
          onClick={() => setOpen((o) => !o)}
        >
          <span className={`dt-dropdown__value ${!selected ? 'dt-dropdown__value--placeholder' : ''}`.trim()}>
            {selected ? selected.label : placeholder}
          </span>
          <svg className="dt-dropdown__caret" width="20" height="20" viewBox="0 0 20 20" aria-hidden>
            <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {open && (
          <ul className={`dt-dropdown__panel ${compact ? 'dt-dropdown__panel--compact' : ''}`.trim()} role="listbox" aria-labelledby={id}>
            {options.map((o) => {
              const active = o.value === value;
              return (
                <li
                  key={o.value}
                  role="option"
                  aria-selected={active}
                  aria-disabled={o.disabled}
                  className={`dt-dropdown__option ${compact ? 'dt-dropdown__option--compact' : ''} ${active ? 'dt-dropdown__option--active' : ''} ${o.disabled ? 'dt-dropdown__option--disabled' : ''}`.trim()}
                  onClick={() => select(o)}
                >
                  {!compact && <span className={`dt-radio-dot ${active ? 'dt-radio-dot--on' : ''}`.trim()} aria-hidden />}
                  {o.label}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {error ? <span className="dt-field__error">{error}</span> : hint ? <span className="dt-field__hint">{hint}</span> : null}
    </div>
  );
}
