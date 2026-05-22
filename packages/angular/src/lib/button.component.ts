import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type DtButtonVariant = 'primary' | 'secondary' | 'outline' | 'tertiary' | 'ghost';
export type DtButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'dt-button',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type"
      [disabled]="disabled"
      [class]="'dt-btn dt-btn--' + variant + ' dt-btn--' + size"
    >
      <ng-content select="[dt-icon-left]"></ng-content>
      <ng-content></ng-content>
      <ng-content select="[dt-icon-right]"></ng-content>
    </button>
  `,
})
export class DtButtonComponent {
  @Input() variant: DtButtonVariant = 'primary';
  @Input() size: DtButtonSize = 'md';
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
}
