import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DtTabItem { id: string; label: string; content?: TemplateRef<unknown> | string; disabled?: boolean; }

@Component({
  selector: 'dt-tabs',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dt-tabs">
      <div class="dt-tabs__list" role="tablist">
        <button
          *ngFor="let it of items"
          role="tab"
          [attr.aria-selected]="it.id === activeId"
          [disabled]="!!it.disabled"
          [class]="'dt-tabs__tab' + (it.id === activeId ? ' dt-tabs__tab--active' : '')"
          (click)="select(it.id)"
        >{{ it.label }}</button>
      </div>
      <div class="dt-tabs__panel" role="tabpanel">
        <ng-container *ngIf="active() as a">
          <ng-container *ngIf="isString(a.content); else tpl">{{ a.content }}</ng-container>
          <ng-template #tpl>
            <ng-container *ngTemplateOutlet="$any(a.content)"></ng-container>
          </ng-template>
        </ng-container>
      </div>
    </div>
  `,
})
export class DtTabsComponent {
  @Input() items: DtTabItem[] = [];
  @Input() activeId?: string;
  @Output() activeIdChange = new EventEmitter<string>();

  ngOnInit() { if (!this.activeId && this.items[0]) this.activeId = this.items[0].id; }
  select(id: string) { this.activeId = id; this.activeIdChange.emit(id); }
  active() { return this.items.find((i) => i.id === this.activeId); }
  isString(v: unknown): v is string { return typeof v === 'string'; }
}
