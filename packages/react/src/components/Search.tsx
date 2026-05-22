import { useId, type InputHTMLAttributes } from 'react';

export interface SearchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  onClear?: () => void;
}

export function Search({ label, size = 'md', value, onClear, id, className = '', ...rest }: SearchProps) {
  const reactId = useId();
  const inputId = id ?? reactId;
  return (
    <div className="dt-field">
      {label && <label className="dt-field__label dt-field__label--block" htmlFor={inputId}>{label}</label>}
      <div className={`dt-search dt-search--${size} ${className}`.trim()}>
        <svg className="dt-search__icon" width="20" height="20" viewBox="0 0 20 20" aria-hidden>
          <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M14 14l4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input id={inputId} type="search" className="dt-search__input" value={value} {...rest} />
        {value ? (
          <button type="button" className="dt-search__clear" aria-label="Clear" onClick={onClear}>×</button>
        ) : null}
      </div>
    </div>
  );
}
