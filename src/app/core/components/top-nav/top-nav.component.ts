import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <div
      class="flex justify-content-between align-items-center px-3 py-2 shadow-2 bg-white"
    >
      <div class="flex align-items-center gap-2">
        <span class="text-3xl">🐾</span>
        <span class="font-bold text-2xl text-primary">TrimSalon</span>
      </div>

      <div class="flex align-items-center">
        @if (authService.isAuthenticated()) {
          <p-button
            (click)="signOut()"
            icon="pi pi-sign-out"
            [rounded]="true"
            [text]="true"
            severity="secondary"
            pTooltip="Uitloggen"
          />
        }
      </div>
    </div>
  `,
})
export class TopNavComponent {
  readonly authService = inject(AuthenticationService);
  private readonly router = inject(Router);

  signOut(): void {
    this.authService.signOut();
    this.router.navigate(['/signedout']);
  }
}
