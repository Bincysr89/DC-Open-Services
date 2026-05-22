import type { InputHTMLAttributes } from 'react';

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export function Toggle({ label, checked, className = '', ...rest }: ToggleProps) {
  return (
    <label className={`dt-toggle ${checked ? 'dt-toggle--on' : ''} ${className}`.trim()}>
      <input type="checkbox" checked={checked} {...rest} />
      <span className="dt-toggle__track"><span className="dt-toggle__thumb" /></span>
      {label && <span>{label}</span>}
    </label>
  );
}
