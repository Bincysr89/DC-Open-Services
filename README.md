# Dubai Trade Component Library

Reference implementation of the **DT Component Library** Figma design system as code, in two parallel packages that share a single token layer.

> Figma source: `Tpw4hrHjCbi2feZvzVLHis` — DT Component Library

## Packages

| Package | Description |
| --- | --- |
| `@dt-ui/tokens` | Design tokens (colors, typography, spacing, radius, shadows) as CSS custom properties + JS export. The single source of truth — both UI packages consume this. |
| `@dt-ui/react` | React component library (TypeScript, Vite library mode). |
| `@dt-ui/angular` | Angular standalone-component library (ng-packagr). |

## Components included (v0.1)

Mapped from the Figma inventory. Atomic primitives first; patterns (dashboards, screens) are out of scope for the library.

- **Foundations**: color, typography, spacing, radius, elevation tokens
- **Forms**: Button, Input (TextField), Select, Checkbox, Radio, Toggle (Switch)
- **Display**: Card, Badge (Status pill), Alert
- **Navigation**: Tabs, Breadcrumb

Roadmap (next): DatePicker, Pagination, Stepper, Modal, Tooltip, Table, Sidebar, Avatar, Search, Notification.

## Install & build

```bash
cd ~/dubai-trade-ui
pnpm install
pnpm build           # builds tokens → react → angular
```

## Consumption

### React
```tsx
import '@dt-ui/tokens/dist/tokens.css';
import { Button, Alert, Card } from '@dt-ui/react';

<Button variant="primary" size="md">Submit</Button>
```

### Angular
```ts
import '@dt-ui/tokens/dist/tokens.css';
import { DtButtonComponent } from '@dt-ui/angular';

@Component({
  standalone: true,
  imports: [DtButtonComponent],
  template: `<dt-button variant="primary" size="md">Submit</dt-button>`,
})
export class AppComponent {}
```

## Design token mapping

All components reference CSS variables from `@dt-ui/tokens`. To rebrand, override the `:root` block in `tokens.css` — both libraries pick up the change with no rebuild.

| Token | Default |
| --- | --- |
| `--dt-color-primary` | `#C8102E` (DT red — placeholder, replace with brand value) |
| `--dt-color-primary-hover` | `#A50D26` |
| `--dt-color-text` | `#1F2937` |
| `--dt-color-surface` | `#FFFFFF` |
| `--dt-color-border` | `#D1D5DB` |
| `--dt-radius-md` | `6px` |
| `--dt-font-family` | `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` |

See [packages/tokens/src/tokens.css](packages/tokens/src/tokens.css) for the full list.

## Variant API parity

Both libraries expose the same prop surface so a designer's spec translates 1:1:

| Component | Props |
| --- | --- |
| Button | `variant: primary \| secondary \| outline \| ghost`, `size: sm \| md \| lg`, `disabled`, `iconLeft`, `iconRight` |
| Input | `size`, `state: default \| error \| disabled`, `label`, `hint`, `error` |
| Select | `options`, `value`, `placeholder`, `state` |
| Checkbox / Radio / Toggle | `checked`, `disabled`, `label` |
| Alert | `variant: info \| success \| warning \| error`, `title`, `dismissible` |
| Badge | `variant: success \| inProgress \| rejected \| submitted \| draft \| cancel` (from Figma status pills) |
| Card | `padding`, `elevation` |
| Tabs | `items`, `activeId` |
| Breadcrumb | `items: { label, href }[]` |
