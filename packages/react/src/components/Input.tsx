import { useId, type InputHTMLAttributes } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Input({ label, hint, error, required, size = 'md', id, className = '', ...rest }: InputProps) {
  const reactId = useId();
  const inputId = id ?? reactId;
  const cls = `dt-input dt-input--${size} ${error ? 'dt-input--error' : ''} ${className}`.trim();
  return (
    <div className={`dt-field ${error ? 'dt-field--error' : ''}`.trim()}>
      <div className="dt-field__control">
        {label && (
          <label className="dt-field__label" htmlFor={inputId}>
            {required && <span className="dt-field__required" aria-hidden>*</span>}
            {label}
          </label>
        )}
        <input id={inputId} className={cls} required={required} aria-invalid={!!error} {...rest} />
      </div>
      {error ? <span className="dt-field__error">{error}</span> : hint ? <span className="dt-field__hint">{hint}</span> : null}
    </div>
  );
}
