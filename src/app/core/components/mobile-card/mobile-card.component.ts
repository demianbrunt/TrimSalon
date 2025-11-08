import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-mobile-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="col-12 p-2 py-1">
      <div class="p-3 border surface-border surface-card border-round shadow-1">
        <div class="mb-3">
          <ng-content select="[header]"></ng-content>
        </div>

        <ng-content select="[content]"></ng-content>

        <div
          class="flex justify-content-end gap-2 pt-2 border-top-1 surface-border"
        >
          <ng-content select="[actions]"></ng-content>
        </div>
      </div>
    </div>
  `,
})
export class MobileCardComponent {}
