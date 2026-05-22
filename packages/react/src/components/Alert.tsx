import { useState, type ReactNode } from 'react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  children?: ReactNode;
}

export function Alert({ variant = 'info', title, dismissible, onDismiss, children }: AlertProps) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className={`dt-alert dt-alert--${variant}`} role="alert">
      <div>
        {title && <div className="dt-alert__title">{title}</div>}
        {children && <div>{children}</div>}
      </div>
      {dismissible && (
        <button
          type="button"
          className="dt-alert__close"
          aria-label="Dismiss"
          onClick={() => { setOpen(false); onDismiss?.(); }}
        >×</button>
      )}
    </div>
  );
}
