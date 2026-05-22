import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'dt-radio',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="dt-check">
      <input
        type="radio"
        [name]="name"
        [value]="value"
        [checked]="checked"
        [disabled]="disabled"
        (change)="select.emit(value)"
      />
      <span *ngIf="label">{{ label }}</span>
    </label>
  `,
})
export class DtRadioComponent {
  @Input() label?: string;
  @Input() name = '';
  @Input() value: string | number = '';
  @Input() checked = false;
  @Input() disabled = false;
  @Output() select = new EventEmitter<string | number>();
}
