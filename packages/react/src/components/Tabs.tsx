import { useState, type ReactNode } from 'react';

export interface TabItem { id: string; label: string; content: ReactNode; disabled?: boolean; }

export interface TabsProps {
  items: TabItem[];
  activeId?: string;
  onChange?: (id: string) => void;
}

export function Tabs({ items, activeId, onChange }: TabsProps) {
  const [internal, setInternal] = useState(activeId ?? items[0]?.id);
  const current = activeId ?? internal;
  const select = (id: string) => { setInternal(id); onChange?.(id); };
  const active = items.find((i) => i.id === current);
  return (
    <div className="dt-tabs">
      <div className="dt-tabs__list" role="tablist">
        {items.map((it) => (
          <button
            key={it.id}
            role="tab"
            aria-selected={it.id === current}
            disabled={it.disabled}
            className={`dt-tabs__tab ${it.id === current ? 'dt-tabs__tab--active' : ''}`}
            onClick={() => select(it.id)}
          >{it.label}</button>
        ))}
      </div>
      <div className="dt-tabs__panel" role="tabpanel">{active?.content}</div>
    </div>
  );
}
