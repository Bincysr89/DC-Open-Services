import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type DtBadgeVariant = 'success' | 'inProgress' | 'rejected' | 'submitted' | 'draft' | 'cancel';

@Component({
  selector: 'dt-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span [class]="'dt-badge dt-badge--' + variant"><ng-content></ng-content></span>`,
})
export class DtBadgeComponent {
  @Input() variant: DtBadgeVariant = 'draft';
}
