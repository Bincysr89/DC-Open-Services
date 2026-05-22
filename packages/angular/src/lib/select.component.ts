import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DtSelectOption { label: string; value: string | number; disabled?: boolean; }

let uid = 0;

@Component({
  selector: 'dt-select',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dt-field">
      <label *ngIf="label" class="dt-field__label" [attr.for]="selectId">{{ label }}</label>
      <select
        [id]="selectId"
        [disabled]="disabled"
        [attr.aria-invalid]="!!error"
        [class]="'dt-select dt-input--' + size + (error ? ' dt-select--error' : '')"
        (change)="onChange($any($event.target).value)"
      >
        <option *ngIf="placeholder" value="" disabled [selected]="value === ''">{{ placeholder }}</option>
        <option *ngFor="let o of options" [value]="o.value" [disabled]="!!o.disabled" [selected]="o.value === value">{{ o.label }}</option>
      </select>
      <span *ngIf="error" class="dt-field__error">{{ error }}</span>
      <span *ngIf="!error && hint" class="dt-field__hint">{{ hint }}</span>
    </div>
  `,
})
export class DtSelectComponent {
  @Input() label?: string;
  @Input() hint?: string;
  @Input() error?: string;
  @Input() placeholder?: string;
  @Input() disabled = false;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() options: DtSelectOption[] = [];
  @Input() value: string | number = '';
  @Output() valueChange = new EventEmitter<string>();

  selectId = `dt-select-${++uid}`;

  onChange(v: string) {
    this.value = v;
    this.valueChange.emit(v);
  }
}
