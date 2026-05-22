import { useId, type SelectHTMLAttributes } from 'react';

export interface SelectOption { label: string; value: string | number; disabled?: boolean; }

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Select({ label, hint, error, options, placeholder, required, size = 'md', id, className = '', ...rest }: SelectProps) {
  const reactId = useId();
  const selectId = id ?? reactId;
  const cls = `dt-select dt-input--${size} ${error ? 'dt-select--error' : ''} ${className}`.trim();
  return (
    <div className={`dt-field ${error ? 'dt-field--error' : ''}`.trim()}>
      <div className="dt-field__control">
        {label && (
          <label className="dt-field__label" htmlFor={selectId}>
            {required && <span className="dt-field__required" aria-hidden>*</span>}
            {label}
          </label>
        )}
        <select id={selectId} className={cls} required={required} aria-invalid={!!error} {...rest}>
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
          ))}
        </select>
      </div>
      {error ? <span className="dt-field__error">{error}</span> : hint ? <span className="dt-field__hint">{hint}</span> : null}
    </div>
  );
}
