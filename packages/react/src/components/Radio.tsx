import type { InputHTMLAttributes } from 'react';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export function Radio({ label, className = '', ...rest }: RadioProps) {
  return (
    <label className={`dt-check ${className}`.trim()}>
      <input type="radio" {...rest} />
      {label && <span>{label}</span>}
    </label>
  );
}
