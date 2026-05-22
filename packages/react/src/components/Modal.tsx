import { useEffect, type ReactNode } from 'react';
import { Button, type ButtonVariant } from './Button';

export type ModalVariant = 'default' | 'success' | 'error' | 'warning' | 'pending' | 'confirm';

export interface ModalAction {
  label: string;
  variant?: ButtonVariant;
  onClick?: () => void;
  autoFocus?: boolean;
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  variant?: ModalVariant;
  title?: string;
  children?: ReactNode;
  actions?: ModalAction[];
  size?: 'sm' | 'md' | 'lg';
  dismissOnBackdrop?: boolean;
}

const VARIANT_ICON: Record<ModalVariant, ReactNode> = {
  default: null,
  success: (
    <svg width="60" height="60" viewBox="0 0 60 60" aria-hidden>
      <circle cx="30" cy="30" r="28" fill="#28A745" />
      <path d="M18 31l8 8 16-18" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg width="60" height="60" viewBox="0 0 60 60" aria-hidden>
      <circle cx="30" cy="30" r="28" fill="#DC3545" />
      <path d="M20 20l20 20M40 20L20 40" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  ),
  warning: (
    <svg width="60" height="60" viewBox="0 0 60 60" aria-hidden>
      <path d="M30 6 L56 52 L4 52 Z" fill="#FFCC00" />
      <path d="M30 24v12" stroke="#0E1B3D" strokeWidth="4" strokeLinecap="round" />
      <circle cx="30" cy="44" r="2.5" fill="#0E1B3D" />
    </svg>
  ),
  pending: (
    <svg width="60" height="60" viewBox="0 0 60 60" aria-hidden>
      <circle cx="30" cy="30" r="26" fill="none" stroke="#1360D2" strokeWidth="4" strokeOpacity="0.2" />
      <path d="M30 4 a26 26 0 0 1 26 26" fill="none" stroke="#1360D2" strokeWidth="4" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 30 30" to="360 30 30" dur="1s" repeatCount="indefinite" />
      </path>
    </svg>
  ),
  confirm: (
    <svg width="60" height="60" viewBox="0 0 60 60" aria-hidden>
      <circle cx="30" cy="30" r="28" fill="#1360D2" />
      <path d="M30 18v14M30 40v2" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  ),
};

export function Modal({
  open, onClose, variant = 'default', title, children, actions, size = 'md', dismissOnBackdrop = true,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="dt-modal" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="dt-modal__backdrop"
        onClick={() => dismissOnBackdrop && onClose()}
      />
      <div className={`dt-modal__dialog dt-modal__dialog--${size}`}>
        <button type="button" className="dt-modal__close" aria-label="Close" onClick={onClose}>×</button>
        {variant !== 'default' && (
          <div className="dt-modal__icon">{VARIANT_ICON[variant]}</div>
        )}
        {title && <h3 className="dt-modal__title">{title}</h3>}
        {children && <div className="dt-modal__body">{children}</div>}
        {actions && actions.length > 0 && (
          <div className="dt-modal__actions">
            {actions.map((a, i) => (
              <Button
                key={i}
                variant={a.variant ?? 'secondary'}
                onClick={a.onClick}
                autoFocus={a.autoFocus}
              >{a.label}</Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
