import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'dt-toggle',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label [class]="'dt-toggle' + (checked ? ' dt-toggle--on' : '')">
      <input type="checkbox" [checked]="checked" [disabled]="disabled" (change)="onToggle($any($event.target).checked)" />
      <span class="dt-toggle__track"><span class="dt-toggle__thumb"></span></span>
      <span *ngIf="label">{{ label }}</span>
    </label>
  `,
})
export class DtToggleComponent {
  @Input() label?: string;
  @Input() checked = false;
  @Input() disabled = false;
  @Output() checkedChange = new EventEmitter<boolean>();
  onToggle(v: boolean) { this.checked = v; this.checkedChange.emit(v); }
}
