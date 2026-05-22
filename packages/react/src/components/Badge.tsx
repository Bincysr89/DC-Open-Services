import type { HTMLAttributes } from 'react';

export type BadgeVariant = 'success' | 'inProgress' | 'rejected' | 'submitted' | 'draft' | 'cancel';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = 'draft', className = '', children, ...rest }: BadgeProps) {
  return (
    <span className={`dt-badge dt-badge--${variant} ${className}`.trim()} {...rest}>
      {children}
    </span>
  );
}
