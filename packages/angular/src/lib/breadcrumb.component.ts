import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DtBreadcrumbItem { label: string; href?: string; }

@Component({
  selector: 'dt-breadcrumb',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="dt-breadcrumb" aria-label="Breadcrumb">
      <ng-container *ngFor="let it of items; let last = last; let i = index">
        <ng-container *ngIf="last || !it.href; else linkTpl">
          <span [class.dt-breadcrumb__current]="last">{{ it.label }}</span>
        </ng-container>
        <ng-template #linkTpl><a [href]="it.href">{{ it.label }}</a></ng-template>
        <span *ngIf="!last" class="dt-breadcrumb__sep" aria-hidden="true">{{ separator }}</span>
      </ng-container>
    </nav>
  `,
})
export class DtBreadcrumbComponent {
  @Input() items: DtBreadcrumbItem[] = [];
  @Input() separator = '/';
}
