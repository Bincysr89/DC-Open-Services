import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

let uid = 0;

@Component({
  selector: 'dt-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="'dt-field' + (error ? ' dt-field--error' : '')">
      <div class="dt-field__control">
        <label *ngIf="label" class="dt-field__label" [attr.for]="inputId">
          <span *ngIf="required" class="dt-field__required" aria-hidden="true">*</span>{{ label }}
        </label>
        <input
          [id]="inputId"
          [type]="type"
          [placeholder]="placeholder || ''"
          [disabled]="disabled"
          [required]="required"
          [value]="value"
          [attr.aria-invalid]="!!error"
          [class]="'dt-input dt-input--' + size + (error ? ' dt-input--error' : '')"
          (input)="onInput($any($event.target).value)"
        />
      </div>
      <span *ngIf="error" class="dt-field__error">{{ error }}</span>
      <span *ngIf="!error && hint" class="dt-field__hint">{{ hint }}</span>
    </div>
  `,
})
export class DtInputComponent {
  @Input() label?: string;
  @Input() hint?: string;
  @Input() error?: string;
  @Input() placeholder?: string;
  @Input() disabled = false;
  @Input() required = false;
  @Input() type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' = 'text';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() value: string | number = '';
  @Output() valueChange = new EventEmitter<string>();

  inputId = `dt-input-${++uid}`;

  onInput(v: string) {
    this.value = v;
    this.valueChange.emit(v);
  }
}
