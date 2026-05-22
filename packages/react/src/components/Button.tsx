import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'tertiary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const cls = `dt-btn dt-btn--${variant} dt-btn--${size} ${className}`.trim();
  return (
    <button className={cls} {...rest}>
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
