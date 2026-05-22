import { Fragment } from 'react';

export interface BreadcrumbItem { label: string; href?: string; }

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: string;
}

export function Breadcrumb({ items, separator = '/' }: BreadcrumbProps) {
  return (
    <nav className="dt-breadcrumb" aria-label="Breadcrumb">
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <Fragment key={i}>
            {last || !it.href
              ? <span className={last ? 'dt-breadcrumb__current' : undefined}>{it.label}</span>
              : <a href={it.href}>{it.label}</a>}
            {!last && <span className="dt-breadcrumb__sep" aria-hidden>{separator}</span>}
          </Fragment>
        );
      })}
    </nav>
  );
}
