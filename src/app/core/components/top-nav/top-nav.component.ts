import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule],
  template: `
    <div
      class="flex justify-content-between align-items-center px-2 py-1 shadow-2"
    >
      <div class="font-bold text-xl text-primary">🐾 TrimSalon</div>
      <div *ngIf="authService.user$ | async as user; else loginButton">
        <div class="flex align-items-center">
          <a routerLink="/signout">
            <p-button icon="pi pi-sign-out" [rounded]="true" [text]="true" />
          </a>
        </div>
      </div>
      <ng-template #loginButton>
        <a routerLink="/signin">
          <p-button
            icon="pi pi-sign-in"
            label="Inloggen"
            [rounded]="true"
            [text]="true"
          />
        </a>
      </ng-template>
    </div>
  `,
})
export class TopNavComponent {
  readonly authService = inject(AuthenticationService);
}
