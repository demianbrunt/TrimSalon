import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <div
      class="flex justify-content-between align-items-center px-2 py-1 shadow-2"
    >
      <div class="font-bold text-xl text-primary">🐾 TrimSalon</div>
      <p-button icon="pi pi-ellipsis-v" [rounded]="true" [text]="true" />
    </div>
  `,
})
export class TopNavComponent {}
