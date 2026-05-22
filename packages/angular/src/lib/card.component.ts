import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'dt-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="'dt-card' + (elevation === 'raised' ? ' dt-card--elevated' : '')">
      <ng-content></ng-content>
    </div>
  `,
})
export class DtCardComponent {
  @Input() elevation: 'flat' | 'raised' = 'flat';
}
