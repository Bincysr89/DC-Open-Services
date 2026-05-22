import type { InputHTMLAttributes } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export function Checkbox({ label, className = '', ...rest }: CheckboxProps) {
  return (
    <label className={`dt-check ${className}`.trim()}>
      <input type="checkbox" {...rest} />
      {label && <span>{label}</span>}
    </label>
  );
}
