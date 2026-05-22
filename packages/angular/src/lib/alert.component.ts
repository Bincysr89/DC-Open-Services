import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type DtAlertVariant = 'info' | 'success' | 'warning' | 'error';

@Component({
  selector: 'dt-alert',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngIf="open" [class]="'dt-alert dt-alert--' + variant" role="alert">
      <div>
        <div *ngIf="title" class="dt-alert__title">{{ title }}</div>
        <div><ng-content></ng-content></div>
      </div>
      <button *ngIf="dismissible" type="button" class="dt-alert__close" aria-label="Dismiss" (click)="dismiss()">×</button>
    </div>
  `,
})
export class DtAlertComponent {
  @Input() variant: DtAlertVariant = 'info';
  @Input() title?: string;
  @Input() dismissible = false;
  @Output() dismissed = new EventEmitter<void>();
  open = true;
  dismiss() { this.open = false; this.dismissed.emit(); }
}
