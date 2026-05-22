import type { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: 'flat' | 'raised';
}

export function Card({ elevation = 'flat', className = '', children, ...rest }: CardProps) {
  const cls = `dt-card ${elevation === 'raised' ? 'dt-card--elevated' : ''} ${className}`.trim();
  return <div className={cls} {...rest}>{children}</div>;
}
