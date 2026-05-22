import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'dt-checkbox',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="dt-check">
      <input type="checkbox" [checked]="checked" [disabled]="disabled" (change)="onToggle($any($event.target).checked)" />
      <span *ngIf="label">{{ label }}</span>
    </label>
  `,
})
export class DtCheckboxComponent {
  @Input() label?: string;
  @Input() checked = false;
  @Input() disabled = false;
  @Output() checkedChange = new EventEmitter<boolean>();
  onToggle(v: boolean) { this.checked = v; this.checkedChange.emit(v); }
}
